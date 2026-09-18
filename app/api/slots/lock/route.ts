import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SlotLockRecord {
  id: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  startMinutes: number;
  endMinutes: number;
  sessionId: string;
  clientName?: string;
  createdAt: number;
  expiresAt: number; // Unix timestamp ms
}

// In-memory global store for locks in the server process
// Global declaration to survive HMR/server reloads
declare global {
  var __bella_slot_locks__: Map<string, SlotLockRecord> | undefined;
}

if (!globalThis.__bella_slot_locks__) {
  globalThis.__bella_slot_locks__ = new Map<string, SlotLockRecord>();
}

const locksStore = globalThis.__bella_slot_locks__;

function cleanExpiredLocks() {
  const now = Date.now();
  for (const [key, lock] of locksStore.entries()) {
    if (lock.expiresAt <= now) {
      locksStore.delete(key);
    }
  }
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// GET: Returns active locks for a given professional and date
export async function GET(req: NextRequest) {
  cleanExpiredLocks();
  const { searchParams } = new URL(req.url);
  const professionalId = searchParams.get('professionalId');
  const date = searchParams.get('date');

  const now = Date.now();
  const activeLocks: { time: string; endMinutes: number; remainingSeconds: number; sessionId: string }[] = [];

  for (const lock of locksStore.values()) {
    if (
      (!professionalId || lock.professionalId === professionalId) &&
      (!date || lock.date === date) &&
      lock.expiresAt > now
    ) {
      activeLocks.push({
        time: lock.time,
        endMinutes: lock.endMinutes,
        remainingSeconds: Math.max(0, Math.ceil((lock.expiresAt - now) / 1000)),
        sessionId: lock.sessionId
      });
    }
  }

  return NextResponse.json({ success: true, locks: activeLocks });
}

// POST: Acquire, release, or commit a temporary slot lock
export async function POST(req: NextRequest) {
  cleanExpiredLocks();

  try {
    const body = await req.json();
    const { action, professionalId, date, time, durationMinutes = 60, sessionId, clientName } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId é obrigatório' }, { status: 400 });
    }

    const now = Date.now();

    // 1. ACTION RELEASE: libera qualquer trava da sessão atual
    if (action === 'release') {
      for (const [key, lock] of locksStore.entries()) {
        if (lock.sessionId === sessionId) {
          locksStore.delete(key);
        }
      }
      return NextResponse.json({ success: true, message: 'Trava liberada com sucesso.' });
    }

    // Validações básicas para LOCK ou COMMIT
    if (!professionalId || !date || !time) {
      return NextResponse.json({ success: false, error: 'professionalId, date e time são obrigatórios' }, { status: 400 });
    }

    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + Number(durationMinutes);

    // 2. ACTION COMMIT: validação final no servidor antes de gravar o agendamento
    if (action === 'commit') {
      // Verifica se alguma outra sessão bloqueou este intervalo
      for (const lock of locksStore.values()) {
        if (
          lock.professionalId === professionalId &&
          lock.date === date &&
          lock.sessionId !== sessionId &&
          lock.expiresAt > now
        ) {
          // Checa sobreposição temporal
          if (startMinutes < lock.endMinutes && endMinutes > lock.startMinutes) {
            return NextResponse.json({
              success: false,
              conflict: true,
              message: 'Conflito de concorrência: Este horário acabou de ser agendado por outra cliente.'
            }, { status: 409 });
          }
        }
      }

      // Remove a trava temporária da sessão já que o agendamento foi comitado
      for (const [key, lock] of locksStore.entries()) {
        if (lock.sessionId === sessionId) {
          locksStore.delete(key);
        }
      }

      return NextResponse.json({ success: true, message: 'Horário liberado e reservado com sucesso!' });
    }

    // 3. ACTION LOCK: trava temporária de 5 minutos
    // Primeiro remove travas anteriores desta mesma sessão para não segurar múltiplos horários
    for (const [key, lock] of locksStore.entries()) {
      if (lock.sessionId === sessionId) {
        locksStore.delete(key);
      }
    }

    // Checa se há conflito com trava ativa de outra sessão
    for (const lock of locksStore.values()) {
      if (
        lock.professionalId === professionalId &&
        lock.date === date &&
        lock.sessionId !== sessionId &&
        lock.expiresAt > now
      ) {
        // Checa sobreposição de minutos
        if (startMinutes < lock.endMinutes && endMinutes > lock.startMinutes) {
          const remainingSecs = Math.max(1, Math.ceil((lock.expiresAt - now) / 1000));
          const mins = Math.floor(remainingSecs / 60);
          const secs = remainingSecs % 60;
          const timeFormatted = `${mins}:${String(secs).padStart(2, '0')}`;

          return NextResponse.json({
            success: false,
            conflict: true,
            message: `Este horário acabou de ser selecionado por outra cliente e está temporariamente bloqueado por 5 minutos (libera em ${timeFormatted} se não confirmada). Por favor, escolha outro horário.`,
            remainingSeconds: remainingSecs
          }, { status: 409 });
        }
      }
    }

    // Sem conflito: gera bloqueio temporário de 5 minutos (300 segundos)
    const lockId = `lock-${professionalId}-${date}-${time}-${Date.now()}`;
    const expiresAt = now + 5 * 60 * 1000; // 5 minutos exatos

    const newLock: SlotLockRecord = {
      id: lockId,
      professionalId,
      date,
      time,
      durationMinutes: Number(durationMinutes),
      startMinutes,
      endMinutes,
      sessionId,
      clientName: clientName || undefined,
      createdAt: now,
      expiresAt
    };

    locksStore.set(lockId, newLock);

    return NextResponse.json({
      success: true,
      lock: {
        id: lockId,
        professionalId,
        date,
        time,
        expiresAt,
        durationSeconds: 300,
        remainingSeconds: 300
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar trava de horário';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

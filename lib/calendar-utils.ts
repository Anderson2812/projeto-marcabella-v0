import { Booking, AvailabilityConfig } from '@/types';

export function formatDatePtBr(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formata os dias e horários de atendimento da profissional de maneira amigável em português
 * para exibição em bio, cabeçalho e vitrine pública.
 */
export function formatWorkingDaysSummary(availability?: AvailabilityConfig | null): {
  daysText: string;
  hoursText: string;
  fullSummary: string;
  lunchBreakText?: string;
} {
  if (!availability) {
    return {
      daysText: 'Segunda a Sábado',
      hoursText: '09:00 às 19:00',
      fullSummary: 'Segunda a Sábado, das 09:00 às 19:00'
    };
  }

  if (availability.allowedDatesMode === 'specific_dates' && availability.allowedSpecificDates?.length) {
    const hours = `das ${availability.startTime || '09:00'} às ${availability.endTime || '19:00'}`;
    return {
      daysText: 'Datas Específicas / Plantões',
      hoursText: hours,
      fullSummary: `Atendimento em datas específicas selecionadas (${availability.allowedSpecificDates.length} dias liberados), ${hours}`
    };
  }

  const days = availability.activeDays || [1, 2, 3, 4, 5, 6];
  const sorted = [...days].sort((a, b) => a - b);
  const dayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  let daysText = '';

  if (sorted.length === 7) {
    daysText = 'Todos os dias';
  } else if (sorted.length === 0) {
    daysText = 'Sob consulta / Agenda Fechada';
  } else if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5, 6])) {
    daysText = 'Segunda a Sábado';
  } else if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) {
    daysText = 'Segunda a Sexta';
  } else if (JSON.stringify(sorted) === JSON.stringify([2, 3, 4, 5, 6])) {
    daysText = 'Terça a Sábado';
  } else if (JSON.stringify(sorted) === JSON.stringify([2, 3, 4, 5])) {
    daysText = 'Terça a Sexta';
  } else if (JSON.stringify(sorted) === JSON.stringify([3, 4, 5, 6])) {
    daysText = 'Quarta a Sábado';
  } else if (JSON.stringify(sorted) === JSON.stringify([0, 6])) {
    daysText = 'Finais de Semana (Sáb e Dom)';
  } else {
    // Lista customizada de dias
    if (sorted.length <= 3) {
      daysText = sorted.map(d => dayNamesFull[d]).join(', ').replace(/, ([^,]*)$/, ' e $1');
    } else {
      daysText = sorted.map(d => dayNamesShort[d]).join(', ');
    }
  }

  const startTime = availability.startTime || '09:00';
  const endTime = availability.endTime || '19:00';
  const hoursText = `das ${startTime} às ${endTime}`;

  let lunchBreakText: string | undefined = undefined;
  if (availability.hasLunchBreak && availability.lunchStart && availability.lunchEnd) {
    lunchBreakText = `(Almoço: ${availability.lunchStart} às ${availability.lunchEnd})`;
  }

  const fullSummary = `${daysText}, ${hoursText}${lunchBreakText ? ` ${lunchBreakText}` : ''}`;

  return {
    daysText,
    hoursText,
    fullSummary,
    lunchBreakText
  };
}

function formatToIcsDate(dateStr: string, timeStr: string, durationMinutes: number = 60): { start: string; end: string } {
  // dateStr is YYYY-MM-DD, timeStr is HH:MM
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hour, minute, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const startFormatted = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}T${pad(startDate.getHours())}${pad(startDate.getMinutes())}00`;
  const endFormatted = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  return { start: startFormatted, end: endFormatted };
}

export function getGoogleCalendarUrl(booking: Booking): string {
  const { start, end } = formatToIcsDate(booking.date, booking.time, booking.serviceDuration);
  const title = encodeURIComponent(`${booking.serviceName} - ${booking.professionalName}`);
  const details = encodeURIComponent(
    `Agendamento de ${booking.serviceName} com ${booking.professionalName}.\n` +
    `Cliente: ${booking.clientName}\n` +
    `Código: ${booking.code}\n` +
    `Valor Total: R$ ${booking.totalPrice.toFixed(2)}\n` +
    `Endereço: ${booking.professionalAddress || 'A combinar'}\n` +
    `Contato Profissional: ${booking.professionalPhone}`
  );
  const location = encodeURIComponent(booking.professionalAddress || 'Espaço de Atendimento');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function generateIcsFileContent(booking: Booking): string {
  const { start, end } = formatToIcsDate(booking.date, booking.time, booking.serviceDuration);
  const title = `${booking.serviceName} com ${booking.professionalName}`;
  const description = `Agendamento ${booking.serviceName}\\nProfissional: ${booking.professionalName}\\nCliente: ${booking.clientName}\\nCódigo: ${booking.code}\\nEndereço: ${booking.professionalAddress}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agendamento Beleza Estetica//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:agendamento-${booking.id}@plataforma`,
    `DTSTAMP:${start}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${booking.professionalAddress || 'Espaço de Atendimento'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(booking: Booking) {
  if (typeof window === 'undefined') return;
  const icsContent = generateIcsFileContent(booking);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agendamento-${booking.code.replace('#', '')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Helper para geração de chave e código Pix Copia e Cola formatado
export function generatePixCopiaECola(
  pixKey: string,
  receiverName: string,
  city: string,
  amount: number,
  txId: string = 'AGEND'
): string {
  // Limpeza de caracteres
  const cleanKey = pixKey.trim();
  const cleanName = receiverName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase();
  const cleanCity = (city || 'SAO PAULO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase();
  const formattedAmount = amount.toFixed(2);
  const cleanTxId = txId.replace(/[^A-Za-z0-9]/g, '').substring(0, 20) || 'AGEND123';

  // Montagem simplificada padrão EMV-QRCPS (Banco Central do Brasil)
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccount = 
    formatField('00', 'br.gov.bcb.pix') +
    formatField('01', cleanKey);

  const additionalData = formatField('05', cleanTxId);

  let payload = 
    formatField('00', '01') + // Format indicator
    formatField('26', merchantAccount) +
    formatField('52', '0000') + // Merchant Category Code
    formatField('53', '986') + // Moeda BRL
    formatField('54', formattedAmount) +
    formatField('58', 'BR') + // País
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', additionalData) +
    '6304'; // Checksum indicator

  // CRC-16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return payload + crcHex;
}

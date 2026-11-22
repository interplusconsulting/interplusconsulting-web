/**
 * PromptPay QR payload (Thai QR Payment / EMVCo merchant-presented, tag 29 = PromptPay credit transfer).
 * Supports a mobile number (10 digits starting with 0), a national/tax ID (13 digits) or an e-wallet ID (15 digits).
 */

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function promptPayTarget(id: string): string | null {
  const digits = id.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return tlv('01', `0066${digits.slice(1)}`.padStart(13, '0'));
  if (/^\d{13}$/.test(digits)) return tlv('02', digits);
  if (/^\d{15}$/.test(digits)) return tlv('03', digits);
  return null;
}

/** Returns the PromptPay QR text for an exact amount, or null when the PromptPay ID is not valid. */
export function promptPayPayload(id: string, amount: number): string | null {
  const target = promptPayTarget(id);
  if (!target || !(amount > 0)) return null;
  const merchant = tlv('29', tlv('00', 'A000000677010111') + target);
  const body = tlv('00', '01') + tlv('01', '12') + merchant + tlv('53', '764') + tlv('54', amount.toFixed(2)) + tlv('58', 'TH') + '6304';
  return body + crc16(body);
}

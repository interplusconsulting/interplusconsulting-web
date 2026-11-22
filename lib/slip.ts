'use client';

import jsQR from 'jsqr';

/**
 * Thai bank transfer slips carry a small "slip verification" QR code (EMVCo-style TLV):
 *   00 → { 00: API id "000001", 01: sending bank code, 02: transaction reference }, 51: country "TH", 91: CRC.
 * We read it in the browser to (1) reject images that are not slips and (2) get a reference that may be used only once.
 * This does NOT prove a slip is genuine — always confirm the money arrived in the bank account.
 */

export type SlipQr = { raw: string; transRef: string; bankCode: string };
export type SlipCheck = { ok: true; qr: SlipQr } | { ok: false; reason: string };

function parseTlv(data: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.slice(i, i + 2);
    const length = Number(data.slice(i + 2, i + 4));
    if (!Number.isFinite(length) || i + 4 + length > data.length) break;
    out.set(tag, data.slice(i + 4, i + 4 + length));
    i += 4 + length;
  }
  return out;
}

export function parseSlipQr(raw: string): SlipQr | null {
  const text = raw.trim();
  const top = parseTlv(text);
  const inner = top.get('00');
  if (!inner || top.get('51') !== 'TH') return null;
  const fields = parseTlv(inner);
  const apiId = fields.get('00') ?? '';
  const transRef = fields.get('02') ?? '';
  if (!/^0{0,5}1$|^000001$/.test(apiId) || transRef.length < 6) return null;
  return { raw: text, transRef, bankCode: fields.get('01') ?? '' };
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Try a few scales — slips from phones are large, and the QR is small in one corner. */
export async function readSlip(file: File): Promise<SlipCheck> {
  let image: ImageBitmap | HTMLImageElement;
  try { image = await loadImage(file); } catch { return { ok: false, reason: 'เปิดไฟล์รูปนี้ไม่ได้ กรุณาเลือกรูปสลิปใหม่' }; }
  const width = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const height = 'naturalHeight' in image ? image.naturalHeight : image.height;
  if (width < 200 || height < 200) return { ok: false, reason: 'รูปเล็กเกินไป กรุณาแนบรูปสลิปแบบเต็มใบที่ชัดเจน' };

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { ok: false, reason: 'เบราว์เซอร์นี้ตรวจรูปไม่ได้ กรุณาลองใช้เบราว์เซอร์อื่น' };

  let anyQr = '';
  for (const maxSide of [1400, 1000, 2000, 700]) {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const found = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
    if (found?.data) {
      anyQr = found.data;
      const qr = parseSlipQr(found.data);
      if (qr) return { ok: true, qr };
    }
  }
  if ('close' in image) image.close();
  return anyQr
    ? { ok: false, reason: 'QR ในรูปนี้ไม่ใช่ QR ของสลิปโอนเงิน กรุณาแนบสลิปจากแอปธนาคาร' }
    : { ok: false, reason: 'ไม่พบ QR โค้ดของสลิปในรูปนี้ รูปนี้อาจไม่ใช่สลิปโอนเงิน กรุณาแนบสลิปจากแอปธนาคารแบบเต็มใบ ไม่ครอปหรือตัด QR ออก' };
}

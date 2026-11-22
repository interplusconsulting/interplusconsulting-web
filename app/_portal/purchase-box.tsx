'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { hasAnyPayment, usePaymentSettings } from '../../lib/payment';
import { promptPayPayload } from '../../lib/promptpay';
import { readSlip, type SlipQr } from '../../lib/slip';
import { errorText, formatBaht, safeFileName, supabase } from '../../lib/supabase';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

function basicCheck(file: File): string {
  if (file.type === 'application/pdf') return 'กรุณาแนบสลิปเป็นรูปภาพ (JPG, PNG หรือ WEBP) ระบบต้องอ่าน QR บนสลิป จึงไม่รับไฟล์ PDF';
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return 'รองรับเฉพาะรูปภาพ JPG, PNG หรือ WEBP';
  if (file.size > MAX_BYTES) return 'ไฟล์สลิปต้องมีขนาดไม่เกิน 5 MB';
  return '';
}

function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Picked = { file: File; qr: SlipQr };

/** Drop zone for the transfer slip. The image must contain a Thai bank slip QR code, otherwise it is rejected. */
export function SlipPicker({ picked, onChange }: { picked: Picked | null; onChange: (picked: Picked | null, error: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);
  const preview = useMemo(() => (picked ? URL.createObjectURL(picked.file) : ''), [picked]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const problem = basicCheck(file);
    if (problem) { onChange(null, problem); return; }
    setChecking(true);
    onChange(null, '');
    const result = await readSlip(file);
    setChecking(false);
    if (result.ok) onChange({ file, qr: result.qr }, ''); else onChange(null, result.reason);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void pick(event.dataTransfer.files?.[0]);
  };

  return <div className="ip-slip-field">
    <span className="ip-label">แนบสลิปการโอน</span>
    <input ref={input} id="slip-file" type="file" accept={ACCEPT} className="ip-visually-hidden" onChange={event => { void pick(event.target.files?.[0]); event.target.value = ''; }} />
    {checking ? <div className="ip-dropzone checking" role="status">
      <span className="ip-spinner" aria-hidden="true" />
      <strong>กำลังตรวจสลิป…</strong>
      <span>กำลังอ่าน QR โค้ดบนสลิป</span>
    </div> : picked ? <div className="ip-slip-picked">
      <div className="ip-slip-thumb"><img src={preview} alt="ตัวอย่างสลิป" /></div>
      <div className="ip-slip-info">
        <b title={picked.file.name}>{picked.file.name}</b>
        <small>✓ พบ QR สลิปธนาคาร · {fileSize(picked.file.size)}</small>
        <span className="ip-slip-ref">เลขอ้างอิง {picked.qr.transRef}</span>
        <div className="ip-row">
          <button type="button" className="ip-link-btn" onClick={() => input.current?.click()}>เปลี่ยนไฟล์</button>
          <button type="button" className="ip-link-btn danger" onClick={() => onChange(null, '')}>ลบ</button>
        </div>
      </div>
    </div> : <div
      className={`ip-dropzone ${dragging ? 'dragging' : ''}`}
      role="button"
      tabIndex={0}
      aria-describedby="slip-hint"
      onClick={() => input.current?.click()}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
      <strong>เลือกรูปสลิป</strong>
      <span>แตะเพื่อเลือก หรือลากรูปมาวางที่นี่</span>
      <small id="slip-hint">รูปสลิปจากแอปธนาคารแบบเต็มใบ (ต้องเห็น QR) · JPG, PNG, WEBP · ไม่เกิน 5 MB</small>
    </div>}
  </div>;
}

function PromptPayQr({ id, amount }: { id: string; amount: number }) {
  const [image, setImage] = useState('');
  const payload = useMemo(() => promptPayPayload(id, amount), [id, amount]);
  useEffect(() => {
    if (!payload) return;
    let active = true;
    QRCode.toDataURL(payload, { margin: 1, width: 360, errorCorrectionLevel: 'M' }).then(url => { if (active) setImage(url); });
    return () => { active = false; };
  }, [payload]);
  if (!payload) return null;
  return <div className="ip-ppqr">
    <span className="ip-ppqr-brand">PromptPay</span>
    {image ? <img src={image} alt={`QR พร้อมเพย์ ยอด ${formatBaht(amount)}`} width={200} height={200} /> : <div className="ip-ppqr-placeholder" />}
    <small>สแกนด้วยแอปธนาคาร ยอดเงินจะขึ้นให้อัตโนมัติ</small>
  </div>;
}

/** Exact amount (with satang) + PromptPay QR + bank details + slip upload. The database sets and checks the amount. */
export default function PurchaseBox({ item, price, lastRejectedNote, onSent, children }: {
  item: { courseId: string } | { examId: string };
  price: number;
  lastRejectedNote?: string | null;
  onSent: () => void | Promise<void>;
  children?: ReactNode;
}) {
  const { profile } = useAuth();
  const payment = usePaymentSettings();
  const pay = payment.settings;
  const [picked, setPicked] = useState<Picked | null>(null);
  const [quote, setQuote] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const itemId = 'courseId' in item ? item.courseId : item.examId;
  const isCourse = 'courseId' in item;

  useEffect(() => {
    supabase().rpc('order_quote', isCourse ? { p_course: itemId } : { p_exam: itemId })
      .then(({ data }) => setQuote(typeof data === 'number' ? data : data !== null ? Number(data) : null));
  }, [itemId, isCourse]);

  const amount = quote ?? price;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    if (!picked) { setError('กรุณาแนบรูปสลิปการโอนเงิน'); return; }
    setBusy(true); setError('');
    try {
      const path = `${profile.id}/${safeFileName(picked.file.name)}`;
      const upload = await supabase().storage.from('slips').upload(path, picked.file, { contentType: picked.file.type });
      if (upload.error) throw upload.error;
      const target = isCourse ? { course_id: itemId } : { exam_id: itemId };
      const insert = await supabase().from('orders').insert({ ...target, user_id: profile.id, slip_path: path, slip_ref: picked.qr.transRef });
      if (insert.error) {
        await supabase().storage.from('slips').remove([path]);
        throw insert.error;
      }
      setPicked(null);
      await onSent();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return <>
    <h2>ชำระเงินด้วยการโอน</h2>
    <div className="ip-pay-amount">
      <span>ยอดที่ต้องโอน</span>
      <strong>{formatBaht(amount)}</strong>
      {quote !== null && quote !== Number(price) && <small>กรุณาโอนยอดนี้พอดี รวมเศษสตางค์ เพื่อให้แอดมินตรวจและเปิดสิทธิ์ได้เร็วขึ้น</small>}
    </div>
    {pay.promptpay_id && quote !== null && <PromptPayQr id={pay.promptpay_id} amount={amount} />}
    {payment.ready && (hasAnyPayment(pay) ? <dl className="ip-bank">
      {pay.account_name && <><dt>ชื่อบัญชี</dt><dd>{pay.account_name}</dd></>}
      {pay.bank_name && <><dt>ธนาคาร</dt><dd>{pay.bank_name}</dd></>}
      {pay.account_number && <><dt>เลขบัญชี</dt><dd>{pay.account_number}</dd></>}
    </dl> : <p className="ip-notice">กรุณาติดต่อแอดมินเพื่อขอช่องทางการโอนเงิน</p>)}
    {children}
    {lastRejectedNote !== undefined && lastRejectedNote !== null && <p className="ip-error">สลิปครั้งก่อนไม่ผ่านการตรวจสอบ{lastRejectedNote ? `: ${lastRejectedNote}` : ''} กรุณาแนบสลิปใหม่</p>}
    <form className="ip-form" onSubmit={submit} noValidate>
      <SlipPicker picked={picked} onChange={(next, problem) => { setPicked(next); setError(problem); }} />
      {error && <p className="ip-error" role="alert">{error}</p>}
      <button className="ip-btn wide" type="submit" disabled={busy || !picked}>{busy ? 'กำลังส่ง…' : 'ส่งสลิปและสั่งซื้อ'}</button>
    </form>
  </>;
}

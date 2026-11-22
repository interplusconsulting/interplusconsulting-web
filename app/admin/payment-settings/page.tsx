'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PaymentSettings } from '../../../lib/payment';
import { promptPayPayload } from '../../../lib/promptpay';
import { errorText, supabase } from '../../../lib/supabase';
import { SaveBar } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

function promptPayProblem(value: string): string {
  if (!value) return '';
  if (/^0\d{9}$/.test(value) || /^\d{13}$/.test(value) || /^\d{15}$/.test(value)) return '';
  return 'ใส่เบอร์มือถือ 10 หลัก (ขึ้นต้นด้วย 0), เลขประจำตัวผู้เสียภาษี/บัตรประชาชน 13 หลัก หรือ e-Wallet 15 หลัก';
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [qr, setQr] = useState('');

  useEffect(() => {
    supabase().from('payment_settings').select('promptpay_id, account_name, bank_name, account_number').eq('id', 1).maybeSingle()
      .then(({ data, error }) => {
        if (error) setMessage({ ok: false, text: errorText(error) });
        setSettings((data as PaymentSettings | null) ?? { promptpay_id: '', account_name: '', bank_name: '', account_number: '' });
      });
  }, []);

  const promptPayError = settings ? promptPayProblem(settings.promptpay_id) : '';
  const payload = useMemo(() => (settings && !promptPayError && settings.promptpay_id ? promptPayPayload(settings.promptpay_id, 1) : null), [settings, promptPayError]);

  useEffect(() => {
    if (!payload) return;
    let active = true;
    QRCode.toDataURL(payload, { margin: 1, width: 320 }).then(url => { if (active) setQr(url); });
    return () => { active = false; };
  }, [payload]);

  if (!settings) return <Loading />;
  const update = (patch: Partial<PaymentSettings>) => { setSettings({ ...settings, ...patch }); setMessage(null); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (promptPayError) { setMessage({ ok: false, text: promptPayError }); return; }
    if (!settings.promptpay_id && !settings.account_number) { setMessage({ ok: false, text: 'กรุณาใส่เลขพร้อมเพย์หรือเลขบัญชีอย่างน้อย 1 อย่าง' }); return; }
    if (!settings.account_name.trim()) { setMessage({ ok: false, text: 'กรุณาใส่ชื่อบัญชี ผู้ซื้อจะเห็นชื่อนี้ในหน้าชำระเงิน' }); return; }
    setBusy(true);
    const { error } = await supabase().from('payment_settings').update({
      promptpay_id: settings.promptpay_id, account_name: settings.account_name.trim(), bank_name: settings.bank_name.trim(),
      account_number: settings.account_number.trim(), updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setBusy(false);
    setMessage(error ? { ok: false, text: errorText(error) } : { ok: true, text: 'บันทึกแล้ว หน้าชำระเงินจะใช้ข้อมูลใหม่ทันที' });
  };

  return <>
    <div className="ip-page-head"><div><h1>ตั้งค่าการชำระเงิน</h1><p className="ip-muted">ข้อมูลรับเงินที่ผู้ซื้อเห็นในหน้าชำระเงินของคอร์สและข้อสอบ</p></div></div>
    <div className="ip-editor">
      <form className="ip-card ip-form" onSubmit={save} noValidate>
        <h2>พร้อมเพย์</h2>
        <label>เลขพร้อมเพย์ (เบอร์มือถือ / เลขประจำตัว 13 หลัก)
          <input value={settings.promptpay_id} inputMode="numeric" maxLength={15} onChange={event => update({ promptpay_id: event.target.value.replace(/\D/g, '').slice(0, 15) })} aria-invalid={promptPayError ? true : undefined} />
        </label>
        {promptPayError && <p className="ip-field-error">{promptPayError}</p>}
        <p className="ip-muted ip-small">ผู้ซื้อจะไม่เห็นเลขนี้ จะเห็นแค่ QR พร้อมเพย์ที่ฝังยอดเงินไว้ และชื่อบัญชีด้านล่าง</p>

        <h2>บัญชีรับเงิน</h2>
        <label>ชื่อบัญชี (แสดงให้ผู้ซื้อเห็น)<input value={settings.account_name} maxLength={120} onChange={event => update({ account_name: event.target.value })} placeholder="เช่น บจก. อินเตอร์ พลัส คอนซัลติ้ง" /></label>
        <div className="ip-form-row">
          <label>ธนาคาร (ไม่ใส่ก็ได้)<input value={settings.bank_name} maxLength={120} onChange={event => update({ bank_name: event.target.value })} placeholder="เช่น กสิกรไทย" /></label>
          <label>เลขบัญชี (ไม่ใส่ก็ได้)<input value={settings.account_number} maxLength={40} onChange={event => update({ account_number: event.target.value })} placeholder="เช่น 123-4-56789-0" /></label>
        </div>
        <p className="ip-muted ip-small">ถ้าใส่เลขบัญชี ผู้ซื้อจะโอนผ่านเลขบัญชีได้อีกทาง ถ้าไม่ใส่ จะมีแค่ QR พร้อมเพย์</p>
        <SaveBar busy={busy} message={message} />
      </form>
      <aside className="ip-card ip-pay-preview">
        <h2>ตัวอย่างที่ผู้ซื้อเห็น</h2>
        <div className="ip-pay-amount"><span>ยอดที่ต้องโอน</span><strong>1.00 บาท</strong></div>
        {payload && qr ? <div className="ip-ppqr"><span className="ip-ppqr-brand">PromptPay</span><img src={qr} alt="ตัวอย่าง QR พร้อมเพย์ 1 บาท" width={200} height={200} /><small>QR ตัวอย่าง ยอด 1.00 บาท ลองสแกนเพื่อเช็กชื่อผู้รับได้</small></div>
          : <p className="ip-notice">ใส่เลขพร้อมเพย์เพื่อดูตัวอย่าง QR</p>}
        {(settings.account_name || settings.bank_name || settings.account_number) && <dl className="ip-bank">
          {settings.account_name && <><dt>ชื่อบัญชี</dt><dd>{settings.account_name}</dd></>}
          {settings.bank_name && <><dt>ธนาคาร</dt><dd>{settings.bank_name}</dd></>}
          {settings.account_number && <><dt>เลขบัญชี</dt><dd>{settings.account_number}</dd></>}
        </dl>}
      </aside>
    </div>
  </>;
}

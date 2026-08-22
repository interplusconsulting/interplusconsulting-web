'use client';

import { FormEvent } from 'react';

export default function ContactForm() {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `ขอคำปรึกษา: ${form.get('service') || 'บริการของ Inter Plus Consulting'}`;
    const body = [
      `ชื่อ-นามสกุล: ${form.get('name') || ''}`,
      `เบอร์โทร: ${form.get('phone') || ''}`,
      `อีเมล: ${form.get('email') || ''}`,
      `บริการที่สนใจ: ${form.get('service') || ''}`,
      '',
      `เป้าหมายหรือคำถาม: ${form.get('message') || ''}`,
    ].join('\n');
    window.location.href = `mailto:jewellyji1234@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return <form onSubmit={submit}>
    <label>ชื่อ-นามสกุล<input name="name" autoComplete="name" placeholder="กรอกชื่อของคุณ" required /></label>
    <div className="form-row">
      <label>เบอร์โทร<input name="phone" type="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" required /></label>
      <label>อีเมล<input name="email" type="email" autoComplete="email" placeholder="you@email.com" required /></label>
    </div>
    <label>บริการที่สนใจ<select name="service" defaultValue="" required><option value="" disabled>เลือกบริการ</option><option>เรียนภาษาอังกฤษ</option><option>เรียนต่อประเทศอังกฤษ</option><option>ทำงานต่างประเทศ</option><option>ท่องเที่ยวและวีซ่า</option></select></label>
    <label>เล่าเป้าหมายของคุณ<textarea name="message" rows={4} placeholder="อยากไปประเทศไหน หรือมีคำถามอะไรเพิ่มเติม" required /></label>
    <button className="button" type="submit">ส่งข้อมูลให้ที่ปรึกษา ↗</button>
  </form>;
}

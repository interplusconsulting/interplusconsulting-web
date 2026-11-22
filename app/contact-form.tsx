'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { contact } from '../lib/site';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { formatPhone, sanitizePhone, validateEmail, validatePhone } from '../lib/validation';
import { ValidatedField, useValidatedForm } from './_portal/validated-form';

const serviceOptions = ['เรียนภาษาอังกฤษ', 'เรียนต่อประเทศอังกฤษ', 'ทำงานต่างประเทศ', 'ท่องเที่ยวและวีซ่า', 'บริการอื่นๆ'];

const validators = {
  name: (value: string) => (value.trim().length >= 2 ? (/\d/.test(value) ? 'ชื่อต้องไม่มีตัวเลข' : '') : 'กรุณากรอกชื่อ-นามสกุล'),
  phone: (value: string) => validatePhone(value),
  email: (value: string) => validateEmail(value),
};
const initial = { name: '', phone: '', email: '' };

export default function ContactForm() {
  const form = useValidatedForm(initial, validators);
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fillSelectedProgram = (event: Event) => {
      const detail = (event as CustomEvent<{ service: string; message: string }>).detail;
      setService(serviceOptions.includes(detail.service) ? detail.service : 'บริการอื่นๆ');
      setMessage(detail.message);
      setServiceError('');
      setStatus('idle');
    };
    window.addEventListener('interplus:program-selected', fillSelectedProgram);
    return () => window.removeEventListener('interplus:program-selected', fillSelectedProgram);
  }, []);

  const sendByEmail = () => {
    const body = [`ชื่อ-นามสกุล: ${form.values.name}`, `เบอร์โทร: ${formatPhone(form.values.phone)}`, `อีเมล: ${form.values.email}`, `บริการที่สนใจ: ${service}`, '', `รายละเอียด: ${message}`].join('\n');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(`ขอคำปรึกษา: ${service}`)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    const missingService = !service;
    setServiceError(missingService ? 'กรุณาเลือกบริการที่สนใจ' : '');
    if (invalid || missingService) { document.getElementById(invalid ? `field-${invalid}` : 'contact-service')?.focus(); return; }
    if (honeypot.current?.value) { setStatus('sent'); return; } // Bots fill hidden fields.
    if (!isSupabaseConfigured) { sendByEmail(); return; }
    setStatus('sending'); setError('');
    const { error: insertError } = await supabase().from('contact_requests').insert({
      name: form.values.name.trim().slice(0, 120),
      phone: formatPhone(form.values.phone),
      email: form.values.email.trim().toLowerCase(),
      service,
      message: message.trim().slice(0, 2000),
      source: window.location.pathname,
    });
    if (insertError) { setStatus('error'); setError('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อทางโทรศัพท์/LINE'); return; }
    setStatus('sent');
    form.reset(); setService(''); setMessage('');
  };

  if (status === 'sent') {
    return <div className="contact-success" role="status">
      <span aria-hidden="true">✓</span>
      <h3>ส่งข้อมูลเรียบร้อยแล้ว</h3>
      <p>ขอบคุณที่ติดต่อ Inter Plus Consulting ทีมที่ปรึกษาจะติดต่อกลับโดยเร็ว หากต้องการคุยทันที โทร {contact.phones[0].display} หรือทักทาง LINE ได้เลย</p>
      <button type="button" className="button" onClick={() => setStatus('idle')}>ส่งข้อมูลอีกครั้ง</button>
    </div>;
  }

  return <form onSubmit={submit} noValidate>
    <ValidatedField label="ชื่อ-นามสกุล" {...form.fieldProps('name')} autoComplete="name" maxLength={120} placeholder="กรอกชื่อของคุณ" />
    <div className="form-row">
      <ValidatedField label="เบอร์โทร" {...form.fieldProps('phone')} transform={sanitizePhone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={16} placeholder="08x-xxx-xxxx" />
      <ValidatedField label="อีเมล" {...form.fieldProps('email')} transform={value => value.replace(/\s/g, '')} type="email" inputMode="email" autoComplete="email" maxLength={254} placeholder="you@email.com" />
    </div>
    <div className={`ip-field ${serviceError ? 'has-error' : ''}`}>
      <label htmlFor="contact-service">บริการที่สนใจ</label>
      <select id="contact-service" name="service" value={service} aria-invalid={serviceError ? true : undefined} onChange={event => { setService(event.target.value); setServiceError(''); }}>
        <option value="" disabled>เลือกบริการ</option>
        {serviceOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      {serviceError && <p className="ip-field-error" role="alert">{serviceError}</p>}
    </div>
    <div className="ip-field">
      <label htmlFor="contact-message">แผนที่คุณให้ความสนใจ</label>
      <textarea id="contact-message" name="message" rows={4} maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} placeholder="อยากไปประเทศไหน หรือมีคำถามอะไรเพิ่มเติม" />
    </div>
    <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
    {error && <p className="ip-error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'กำลังส่ง…' : 'ส่งข้อมูลให้ที่ปรึกษา ↗'}</button>
    <small>ข้อมูลของคุณใช้เพื่อติดต่อกลับเรื่องบริการที่สนใจเท่านั้น</small>
  </form>;
}

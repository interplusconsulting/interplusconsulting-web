'use client';

import { useEffect, useState } from 'react';
import { cleanHidden, siteSections, type SectionInfo, type SectionKey } from '../../../lib/site-sections';
import { errorText, supabase } from '../../../lib/supabase';
import { PublishSwitch, SaveBar } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

const groups: { key: SectionInfo['group']; title: string; note: string }[] = [
  { key: 'home', title: 'ส่วนต่าง ๆ บนหน้าแรก', note: 'ปิดแล้วส่วนนั้นจะหายจากหน้าแรก และเมนูที่ลิงก์ไปส่วนนั้นจะถูกซ่อนด้วย' },
  { key: 'site', title: 'เมนูและปุ่มทั้งเว็บ', note: 'มีผลกับทุกหน้าของเว็บไซต์' },
];

export default function AdminSiteSettingsPage() {
  const [hidden, setHidden] = useState<SectionKey[] | null>(null);
  const [saved, setSaved] = useState<SectionKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase().from('site_settings').select('hidden_sections').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) setMessage({ ok: false, text: errorText(error) });
      const value = cleanHidden(data?.hidden_sections);
      setHidden(value);
      setSaved(value);
    });
  }, []);

  if (!hidden) return <Loading />;

  const toggle = (key: SectionKey) => setHidden(current => (current ?? []).includes(key) ? (current ?? []).filter(item => item !== key) : [...(current ?? []), key]);
  const dirty = hidden.length !== saved.length || hidden.some(key => !saved.includes(key));
  const shownCount = siteSections.length - hidden.length;

  const save = async () => {
    setBusy(true); setMessage(null);
    const db = supabase();
    const { error } = await db.from('site_settings').update({ hidden_sections: hidden, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { setBusy(false); setMessage({ ok: false, text: errorText(error) }); return; }
    // Refresh the cached public pages so the change shows right away.
    const token = (await db.auth.getSession()).data.session?.access_token;
    const refreshed = token ? await fetch('/api/admin/revalidate-site', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok).catch(() => false) : false;
    setBusy(false);
    setSaved(hidden);
    setMessage({ ok: true, text: refreshed ? 'บันทึกแล้ว หน้าเว็บอัปเดตทันที' : 'บันทึกแล้ว หน้าเว็บจะอัปเดตภายใน 1 นาที' });
  };

  return <>
    <div className="ip-page-head">
      <div><h1>ตั้งค่าการแสดงหน้าเว็บ</h1><p className="ip-muted">เปิดหรือปิดส่วนต่าง ๆ ของเว็บไซต์ ส่วนที่ปิดไว้จะถูกซ่อน ข้อมูลไม่ถูกลบ เปิดกลับมาเมื่อไหร่ก็แสดงเหมือนเดิม</p></div>
      <a className="ip-btn ghost" href="/" target="_blank" rel="noreferrer">ดูหน้าเว็บ ↗</a>
    </div>
    <p className="admin-settings-summary">แสดงอยู่ <b>{shownCount}</b> จาก {siteSections.length} รายการ{hidden.length > 0 && <> · ซ่อน <b>{hidden.length}</b> รายการ</>}</p>
    {groups.map(group => <section className="ip-card admin-settings-group" key={group.key}>
      <header><h2>{group.title}</h2><p className="ip-muted">{group.note}</p></header>
      <ul className="admin-settings-list">
        {siteSections.filter(section => section.group === group.key).map(section => {
          const visible = !hidden.includes(section.key);
          return <li key={section.key} className={visible ? '' : 'is-hidden'}>
            <div><b>{section.label}</b><small>{section.hint}</small></div>
            <PublishSwitch checked={visible} label={`แสดง ${section.label}`} onToggle={() => toggle(section.key)} />
          </li>;
        })}
      </ul>
    </section>)}
    <div className="admin-settings-save">
      <SaveBar busy={busy} message={message} onSave={() => void save()} />
      {dirty && <span className="ip-muted ip-small">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>}
    </div>
  </>;
}

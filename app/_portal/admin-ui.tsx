'use client';

import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { badgeOptions, discountPercent, priceAfterPercent } from '../../lib/pricing';
import { errorText, formatBaht, uploadPublicImage } from '../../lib/supabase';

/** Upload an image to the public "media" bucket or paste an image URL. */
export function ImageField({ label, value, folder, onChange }: { label: string; value: string; folder: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { setError('รองรับ JPG, PNG, WEBP หรือ GIF'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('ไฟล์รูปต้องไม่เกิน 10 MB'); return; }
    setBusy(true); setError('');
    try { onChange(await uploadPublicImage(file, folder)); } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  };

  return <div className="ip-image-field">
    <span className="ip-label">{label}</span>
    <div className="ip-image-row">
      <div className="ip-thumb">{value ? <img src={value} alt="" /> : <span>ไม่มีรูป</span>}</div>
      <div className="ip-image-actions">
        <label className="ip-btn ghost small ip-file-btn">{busy ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></label>
        {value && <button type="button" className="ip-link-btn" onClick={() => onChange('')}>ลบรูป</button>}
      </div>
    </div>
    <input aria-label={`${label} (ลิงก์รูป)`} placeholder="หรือวางลิงก์รูป https://…" value={value} onChange={event => onChange(event.target.value)} />
    {error && <p className="ip-error">{error}</p>}
  </div>;
}

/**
 * Whole-number field without the "0233" problem of controlled <input type="number">:
 * leading zeros are dropped as you type, and focusing selects the value so typing replaces it.
 */
export function NumberInput({ value, onChange, min = 0, allowNegative = false, ...rest }: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  allowNegative?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min'>) {
  const text = Number.isFinite(value) ? String(value) : '';
  return <input
    {...rest}
    type="text"
    inputMode="numeric"
    value={text}
    onFocus={event => event.currentTarget.select()}
    onChange={event => {
      const raw = event.target.value.trim();
      const negative = allowNegative && raw.startsWith('-');
      const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
      const parsed = digits ? Number(digits) * (negative ? -1 : 1) : 0;
      onChange(allowNegative ? parsed : Math.max(min, parsed));
    }}
  />;
}

export function StatusPill({ on, onText = 'เผยแพร่', offText = 'ฉบับร่าง' }: { on: boolean; onText?: string; offText?: string }) {
  return <span className={`ip-status ${on ? 'approved' : 'draft'}`}>{on ? onText : offText}</span>;
}

/**
 * Regular price plus an optional promotion. The promotion is entered either as the sale price
 * or as a percent off (the sale price is then calculated). Emits `price` (amount charged) and
 * `compare_at_price` (original price, 0 when there is no promotion).
 */
export function PriceEditor({ price, compareAt, zeroHint, onChange }: {
  price: number;
  compareAt: number;
  zeroHint: string;
  onChange: (next: { price: number; compare_at_price: number }) => void;
}) {
  const promo = Number(compareAt) > 0;
  const regular = promo ? Number(compareAt) : Number(price);
  const [mode, setMode] = useState<'price' | 'percent'>('price');
  const [percent, setPercent] = useState(() => (promo ? discountPercent(price, compareAt) : 10));

  const setRegular = (value: number) => {
    if (!promo) { onChange({ price: value, compare_at_price: 0 }); return; }
    onChange({ compare_at_price: value, price: mode === 'percent' ? priceAfterPercent(value, percent) : Math.min(Number(price), value) });
  };
  const togglePromo = () => {
    if (promo) onChange({ price: Number(compareAt), compare_at_price: 0 });
    else onChange({ compare_at_price: Number(price), price: priceAfterPercent(Number(price), percent) });
  };
  const setPercentValue = (value: number) => {
    const next = Math.min(99, value);
    setPercent(next);
    onChange({ compare_at_price: regular, price: priceAfterPercent(regular, next) });
  };
  const invalid = promo && Number(price) >= regular;

  return <fieldset className="ip-price-editor">
    <legend>ราคา</legend>
    <label>ราคาปกติ (บาท){!promo && ` — ${zeroHint}`}<NumberInput value={regular} onChange={setRegular} /></label>
    <label className="ip-check-label"><input type="checkbox" checked={promo} disabled={!promo && regular <= 0} onChange={togglePromo} /> ตั้งราคาโปรโมชั่น</label>
    {promo && <div className="ip-promo-box">
      <div className="ip-segment" role="radiogroup" aria-label="วิธีตั้งราคาโปรโมชั่น">
        <button type="button" role="radio" aria-checked={mode === 'price'} className={mode === 'price' ? 'active' : ''} onClick={() => setMode('price')}>ระบุราคาโปร</button>
        <button type="button" role="radio" aria-checked={mode === 'percent'} className={mode === 'percent' ? 'active' : ''} onClick={() => { setMode('percent'); setPercentValue(discountPercent(price, compareAt) || percent); }}>ลดเป็น %</button>
      </div>
      {mode === 'price'
        ? <label>ราคาโปรโมชั่น (บาท)<NumberInput value={Number(price)} onChange={value => onChange({ compare_at_price: regular, price: value })} /></label>
        : <label>ส่วนลด (%)<NumberInput value={percent} onChange={setPercentValue} /></label>}
      <p className={invalid ? 'ip-error' : 'ip-muted ip-small'}>{invalid
        ? 'ราคาโปรโมชั่นต้องต่ำกว่าราคาปกติ'
        : `จาก ${formatBaht(regular)} เหลือ ${Number(price) > 0 ? formatBaht(price) : 'ฟรี'} (ลด ${discountPercent(price, compareAt)}%)`}</p>
    </div>}
  </fieldset>;
}

const actionIcons = {
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  open: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  delete: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  manage: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0111-7.4M19 15v6M16 18h6',
} as const;
export type ActionIcon = keyof typeof actionIcons;

function ActionSvg({ icon }: { icon: ActionIcon }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={actionIcons[icon]} /></svg>;
}

/** Square icon button for table/card rows (edit, delete…). The label shows as a tooltip and is read by screen readers. */
export function IconButton({ icon, label, onClick, tone = 'default' }: { icon: ActionIcon; label: string; onClick: () => void; tone?: 'default' | 'danger' }) {
  return <button type="button" className={`admin-icon-btn ${tone}`} title={label} aria-label={label} onClick={onClick}><ActionSvg icon={icon} /></button>;
}

/** Icon link; external links open in a new tab. */
export function IconLink({ icon, label, href, external = false }: { icon: ActionIcon; label: string; href: string; external?: boolean }) {
  return external
    ? <a className="admin-icon-btn" href={href} target="_blank" rel="noreferrer" title={label} aria-label={label}><ActionSvg icon={icon} /></a>
    : <Link className="admin-icon-btn" href={href} title={label} aria-label={label}><ActionSvg icon={icon} /></Link>;
}

export function BadgeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <AdminSelect label="ป้ายบนการ์ด" value={value} options={badgeOptions} onChange={onChange} />;
}

export function PublishSwitch({ checked, label, onToggle, showLabel = false }: {
  checked: boolean;
  label: string;
  onToggle: () => void | Promise<void>;
  showLabel?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    setError('');
    try {
      const result = onToggle();
      if (result) {
        setPending(true);
        await result;
      }
    }
    catch (error) { setError(errorText(error)); }
    finally { setPending(false); }
  }

  return <div className="admin-publish-control">
    <button type="button" role="switch" aria-checked={checked} aria-label={label} aria-busy={pending}
      disabled={pending} className="admin-publish-switch" onClick={() => void toggle()}>
      <span className="admin-publish-track" aria-hidden="true" />
      {showLabel && <span aria-hidden="true">{label}</span>}
      <span aria-hidden="true">{pending ? 'กำลังบันทึก…' : checked ? 'เปิด' : 'ปิด'}</span>
    </button>
    {error && <small className="ip-error" role="alert">{error}</small>}
  </div>;
}

export function AdminListHeading({ title, count }: { title: string; count: number }) {
  return <div className="admin-list-heading"><h2>{title}</h2><span>{count.toLocaleString('th-TH')} รายการ</span></div>;
}

export function AdminSelect({ label, value, options, onChange, hideLabel = false }: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.findIndex(item => item.value === value);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useLayoutEffect(() => {
    const menu = list.current;
    const button = trigger.current;
    if (!open || !menu || !button) return;

    function positionMenu() {
      if (!menu || !button) return;
      const rect = button.getBoundingClientRect();
      const below = Math.max(0, window.innerHeight - rect.bottom - 12);
      const above = Math.max(0, rect.top - 12);
      const desiredHeight = Math.min(236, options.length * 40 + 10);
      const openAbove = below < desiredHeight && above > below;
      menu.style.width = `${rect.width}px`;
      menu.style.left = `${rect.left}px`;
      menu.style.maxHeight = `${Math.min(236, openAbove ? above : below)}px`;
      menu.style.top = openAbove ? 'auto' : `${rect.bottom + 6}px`;
      menu.style.bottom = openAbove ? `${window.innerHeight - rect.top + 6}px` : 'auto';
    }

    positionMenu();
    menu.showPopover();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      menu.hidePopover();
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        event.preventDefault();
        setActive(open ? Math.min(Math.max(active + delta, 0), options.length - 1) : Math.max(selected, 0));
        setOpen(true);
        return;
      }
      case 'Home':
      case 'End':
        if (!open) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : options.length - 1);
        return;
      case 'Enter':
      case ' ':
        if (!open) return;
        event.preventDefault();
        choose(active);
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
    }
  }

  return <div ref={root} className="admin-select" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <span id={`${id}-label`} className={hideLabel ? 'admin-visually-hidden' : 'admin-select-label'}>{label}</span>
    <button ref={trigger} type="button" className="admin-select-trigger" role="combobox" aria-labelledby={`${id}-label`}
      aria-expanded={open} aria-controls={`${id}-options`}
      aria-activedescendant={open && options[active] ? `${id}-option-${active}` : undefined}
      disabled={!options.length} onKeyDown={handleKey} onClick={() => {
        if (!open) setActive(Math.max(selected, 0));
        setOpen(!open);
      }}>
      <span>{options[selected]?.label ?? 'เลือก'}</span>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    <ul ref={list} popover="manual" id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} className="admin-select-options">
      {options.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option"
        aria-selected={value === option.value} data-active={active === index}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>
        {value === option.value && <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </li>)}
    </ul>
  </div>;
}

export function SaveBar({ busy, message, onSave, children }: { busy: boolean; message: { ok: boolean; text: string } | null; onSave?: () => void; children?: React.ReactNode }) {
  return <div className="ip-savebar">
    {message && <span className={message.ok ? 'ip-success' : 'ip-error'} role="status">{message.text}</span>}
    {children}
    <button type="submit" className="ip-btn" disabled={busy} onClick={onSave}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
  </div>;
}

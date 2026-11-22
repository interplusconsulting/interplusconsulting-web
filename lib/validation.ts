/** Form validation rules shared by sign-up, sign-in, password reset and profile forms. Each returns '' when valid. */

export function validateFullName(value: string): string {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'กรุณากรอกชื่อ-นามสกุล';
  if (name.length < 4) return 'ชื่อ-นามสกุลสั้นเกินไป';
  if (name.length > 120) return 'ชื่อ-นามสกุลต้องไม่เกิน 120 ตัวอักษร';
  if (/\d/.test(name)) return 'ชื่อ-นามสกุลต้องไม่มีตัวเลข';
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return 'ชื่อ-นามสกุลใช้ได้เฉพาะตัวอักษร เว้นวรรค จุด และขีด';
  if (!name.includes(' ')) return 'กรุณากรอกทั้งชื่อและนามสกุล โดยเว้นวรรคระหว่างกัน';
  return '';
}

/**
 * Keeps only digits, at most 10, so the field never holds more than a Thai mobile number.
 * A pasted international form (+66 81 234 5678 / 66812345678) is converted to 0812345678.
 */
export function sanitizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (/^\s*\+?66/.test(value) && digits.length >= 11) digits = `0${digits.slice(2)}`;
  return digits.slice(0, 10);
}

export function validatePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'กรุณากรอกเบอร์โทรศัพท์';
  if (!digits.startsWith('0')) return 'เบอร์โทรต้องขึ้นต้นด้วย 0';
  if (digits.length !== 10) return `เบอร์มือถือต้องมี 10 หลัก (ตอนนี้ ${digits.length} หลัก)`;
  if (!/^0[689]/.test(digits)) return 'เบอร์มือถือต้องขึ้นต้นด้วย 06, 08 หรือ 09';
  if (/^(\d)\1{9}$/.test(digits)) return 'เบอร์โทรไม่ถูกต้อง';
  return '';
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : digits;
}

const EMAIL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'yahoo.co': 'yahoo.com', 'yaho.com': 'yahoo.com', 'outlook.co': 'outlook.com', 'outlok.com': 'outlook.com',
};

export function validateEmail(value: string): string {
  const email = value.trim();
  if (!email) return 'กรุณากรอกอีเมล';
  if (/\s/.test(email)) return 'อีเมลต้องไม่มีช่องว่าง';
  if (!email.includes('@')) return 'อีเมลต้องมีเครื่องหมาย @';
  if (email.length > 254) return 'อีเมลยาวเกินไป';
  if (/\.\./.test(email)) return 'อีเมลต้องไม่มีจุดติดกันสองตัว';
  if (/[^\x20-\x7E]/.test(email)) return 'อีเมลต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น';
  if (!EMAIL_PATTERN.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com';
  const domain = email.split('@')[1].toLowerCase();
  if (COMMON_TYPOS[domain]) return `หมายถึง @${COMMON_TYPOS[domain]} หรือเปล่า? กรุณาตรวจสอบอีเมลอีกครั้ง`;
  return '';
}

export type PasswordCheck = { label: string; ok: boolean };

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { label: 'อย่างน้อย 8 ตัวอักษร', ok: value.length >= 8 },
    { label: 'มีตัวอักษรภาษาอังกฤษ', ok: /[A-Za-z]/.test(value) },
    { label: 'มีตัวเลข', ok: /\d/.test(value) },
    { label: 'ไม่มีช่องว่าง', ok: value.length > 0 && !/\s/.test(value) },
  ];
}

export function validatePassword(value: string): string {
  if (!value) return 'กรุณากรอกรหัสผ่าน';
  if (value.length > 72) return 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร';
  const failed = passwordChecks(value).find(check => !check.ok);
  return failed ? `รหัสผ่านต้อง${failed.label}` : '';
}

export function validateConfirm(password: string, confirm: string): string {
  if (!confirm) return 'กรุณายืนยันรหัสผ่าน';
  return password === confirm ? '' : 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
}

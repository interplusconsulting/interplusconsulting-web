import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { formatPhone, validateEmail, validateFullName, validatePhone } from '../../../../lib/validation';

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ message: 'ยังไม่ได้ตั้งค่า Supabase' }, { status: 503 });

  const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
  const caller = createClient(url, anonKey, { auth, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: identity, error: identityError } = await caller.auth.getUser(token);
  if (identityError || !identity.user) return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });

  const { data: isAdmin, error: roleError } = await caller.rpc('is_admin');
  if (roleError) return NextResponse.json({ message: 'ตรวจสอบสิทธิ์ผู้ดูแลไม่สำเร็จ' }, { status: 503 });
  if (isAdmin !== true) return NextResponse.json({ message: 'เฉพาะแอดมินที่เปิดใช้งานเท่านั้นที่เพิ่มผู้ใช้ได้' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const role = body?.role;
  const invalid = validateFullName(fullName) || validateEmail(email) || validatePhone(phone);
  if (invalid || (role !== 'student' && role !== 'admin')) {
    return NextResponse.json({ message: invalid || 'กรุณาเลือกบทบาทผู้ใช้' }, { status: 400 });
  }

  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const redirectTo = process.env.SUPABASE_INVITE_REDIRECT_URL
    || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000/reset-password' : '');
  if (!secret || !redirectTo) {
    return NextResponse.json({ message: 'ยังไม่ได้ตั้งค่า Supabase สำหรับส่งอีเมลเชิญผู้ใช้' }, { status: 503 });
  }

  const { count, error: lookupError } = await caller.from('profiles').select('id', { count: 'exact', head: true }).eq('email', email);
  if (lookupError) return NextResponse.json({ message: 'ตรวจสอบอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 503 });
  if (count) return NextResponse.json({ message: 'อีเมลนี้มีบัญชีอยู่แล้ว สามารถแก้ข้อมูลหรือบทบาทจากรายชื่อผู้ใช้ได้' }, { status: 409 });

  const admin = createClient(url, secret, { auth });
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullName, phone: formatPhone(phone) },
  });
  if (error || !data.user) {
    const duplicate = error?.code === 'email_exists' || error?.code === 'user_already_exists';
    const message = duplicate ? 'อีเมลนี้มีบัญชีอยู่แล้ว' : 'ส่งคำเชิญไม่สำเร็จ กรุณาตรวจสอบอีเมลและลองอีกครั้ง';
    return NextResponse.json({ message }, { status: duplicate ? 409 : 502 });
  }

  if (role === 'admin') {
    const { data: updated, error: updateError } = await caller.from('profiles')
      .update({ role }).eq('id', data.user.id).select('id').maybeSingle();
    if (updateError || !updated) {
      return NextResponse.json({ message: 'ส่งคำเชิญแล้ว แต่กำหนดบทบาทแอดมินไม่สำเร็จ กรุณาแก้บทบาทจากรายชื่อผู้ใช้', partial: true }, { status: 201 });
    }
  }

  return NextResponse.json({ message: 'เพิ่มผู้ใช้และส่งอีเมลเชิญแล้ว' }, { status: 201 });
}

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/** Admin-only: refresh the cached public pages right after the display settings are saved. */
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ message: 'ยังไม่ได้ตั้งค่า Supabase' }, { status: 503 });

  const caller = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error } = await caller.rpc('is_admin');
  if (error || isAdmin !== true) return NextResponse.json({ message: 'เฉพาะแอดมินเท่านั้น' }, { status: 403 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAnnouncement } from '../../../lib/announcement-data';
import { isLocalAdminRequest, readAnnouncements, writeAnnouncements } from '../../../lib/local-announcement-store';

export const dynamic = 'force-dynamic';
const unavailable = () => new NextResponse(null, { status: 404 });
const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

export async function GET(request: Request) {
  if (!isLocalAdminRequest(request)) return unavailable();
  return NextResponse.json(await readAnnouncements(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request, true)) return unavailable();
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('ข้อมูลประกาศไม่ถูกต้อง');
  const item = { ...body, id: randomUUID() };
  if (!isAnnouncement(item)) return badRequest('กรุณาตรวจสอบข้อมูลและรูปประกาศ');
  const items = await readAnnouncements();
  items.unshift(item);
  await writeAnnouncements(items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: Request) {
  if (!isLocalAdminRequest(request, true)) return unavailable();
  const body: unknown = await request.json().catch(() => null);
  if (!isAnnouncement(body)) return badRequest('กรุณาตรวจสอบข้อมูลและรูปประกาศ');
  const items = await readAnnouncements();
  const index = items.findIndex(item => item.id === body.id);
  if (index < 0) return unavailable();
  items[index] = body;
  await writeAnnouncements(items);
  return NextResponse.json(body);
}

export async function DELETE(request: Request) {
  if (!isLocalAdminRequest(request, true)) return unavailable();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return badRequest('ไม่พบรหัสประกาศ');
  const items = await readAnnouncements();
  const remaining = items.filter(item => item.id !== id);
  if (remaining.length === items.length) return unavailable();
  await writeAnnouncements(remaining);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!isLocalAdminRequest(request, true)) return unavailable();
  const body: unknown = await request.json().catch(() => null);
  if (!Array.isArray(body) || !body.every(id => typeof id === 'string')) return badRequest('ลำดับประกาศไม่ถูกต้อง');
  const items = await readAnnouncements();
  if (body.length !== items.length || new Set(body).size !== items.length) return badRequest('ลำดับประกาศไม่ครบ');
  const byId = new Map(items.map(item => [item.id, item]));
  if (!body.every(id => byId.has(id))) return badRequest('พบประกาศที่ไม่รู้จัก');
  const ordered = body.map(id => byId.get(id)!);
  await writeAnnouncements(ordered);
  return NextResponse.json(ordered);
}

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isLocalAdminRequest } from '../../../../lib/local-announcement-store';

export const dynamic = 'force-dynamic';

function imageExtension(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return 'png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'webp';
  return null;
}

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request, true)) return new NextResponse(null, { status: 404 });
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'กรุณาเลือกรูปภาพ' }, { status: 400 });
  if (file.size === 0 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'รูปภาพต้องมีขนาดไม่เกิน 10 MB' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) return NextResponse.json({ error: 'รองรับเฉพาะ JPG, PNG และ WebP' }, { status: 400 });
  const directory = path.join(process.cwd(), 'public', 'announcements');
  await mkdir(directory, { recursive: true });
  const filename = `upload-${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), bytes, { flag: 'wx' });
  return NextResponse.json({ url: `/announcements/${filename}` }, { status: 201 });
}

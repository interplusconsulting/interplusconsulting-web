import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initialAnnouncementData, isAnnouncement, type Announcement } from './announcement-data';

const dataPath = path.join(process.cwd(), 'data', 'announcements.json');

export function isLocalAdminRequest(request: Request, mutation = false): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const host = request.headers.get('host') ?? '';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return false;
  if (!mutation) return true;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export async function readAnnouncements(): Promise<Announcement[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(dataPath, 'utf8'));
    if (Array.isArray(parsed) && parsed.every(isAnnouncement)) return parsed;
    throw new Error('ข้อมูลประกาศไม่ถูกต้อง');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return initialAnnouncementData;
    throw error;
  }
}

export async function writeAnnouncements(items: Announcement[]): Promise<void> {
  const tempPath = `${dataPath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  await rename(tempPath, dataPath);
}

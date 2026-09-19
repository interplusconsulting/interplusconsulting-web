import initialAnnouncements from '../data/announcements.json';

export type Announcement = {
  id: string;
  image: string;
  fullImage: string;
  gallery: string[];
  label: string;
  title: string;
  description: string;
  details: string[];
};

export const initialAnnouncementData: Announcement[] = initialAnnouncements;

export function isAnnouncement(value: unknown): value is Announcement {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const imagePath = (path: unknown) => typeof path === 'string' && /^\/announcements\/[a-zA-Z0-9._-]+\.(jpe?g|png|webp)$/.test(path);
  return typeof item.id === 'string' && /^[a-z0-9-]{1,80}$/.test(item.id)
    && typeof item.label === 'string' && item.label.trim().length > 0 && item.label.length <= 120
    && typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 240
    && typeof item.description === 'string' && item.description.length <= 1200
    && imagePath(item.image) && imagePath(item.fullImage)
    && Array.isArray(item.gallery) && item.gallery.length > 0 && item.gallery.length <= 12 && item.gallery.every(imagePath)
    && Array.isArray(item.details) && item.details.length <= 30
    && item.details.every((detail: unknown) => typeof detail === 'string' && detail.length <= 3000);
}

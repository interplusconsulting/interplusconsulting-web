import { cleanHidden, type SectionKey } from './site-sections';

export const SITE_SETTINGS_TAG = 'site-settings';

/**
 * Sections the admin has hidden. Read on the server through Supabase's REST API (public, read-only row)
 * and cached for a minute; saving in admin also clears the cache right away.
 * Any error means "show everything", so the site never breaks because of this setting.
 */
export async function getHiddenSections(): Promise<SectionKey[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const response = await fetch(`${url}/rest/v1/site_settings?id=eq.1&select=hidden_sections`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60, tags: [SITE_SETTINGS_TAG] },
    });
    if (!response.ok) return [];
    const rows = await response.json() as { hidden_sections?: unknown }[];
    return cleanHidden(rows[0]?.hidden_sections);
  } catch {
    return [];
  }
}

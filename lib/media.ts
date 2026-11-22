/** Turns a YouTube or Vimeo page link into an embeddable player URL. Returns '' for unsupported links. */
export function videoEmbedUrl(link: string): string {
  let url: URL;
  try { url = new URL(link.trim()); } catch { return ''; }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  const id = (value: string | null | undefined) => (value && /^[\w-]{6,20}$/.test(value) ? value : '');

  if (host === 'youtu.be') {
    const v = id(url.pathname.slice(1).split('/')[0]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : '';
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const v = id(url.searchParams.get('v')) || (['embed', 'shorts', 'live'].includes(parts[0]) ? id(parts[1]) : '');
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : '';
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const numeric = parts.find(part => /^\d{5,12}$/.test(part));
    if (!numeric) return '';
    const after = parts[parts.indexOf(numeric) + 1];
    const hash = url.searchParams.get('h') ?? (after && /^[a-f0-9]{6,20}$/.test(after) ? after : '');
    return `https://player.vimeo.com/video/${numeric}${hash ? `?h=${hash}` : ''}`;
  }
  return '';
}

/** Only http(s) links are allowed for external quizzes and images. */
export function safeHttpUrl(link: string): string {
  try {
    const url = new URL(link.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

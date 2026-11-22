'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { errorText, supabase } from '../../../lib/supabase';
import type { Post } from '../../../lib/types';
import { ImageField, SaveBar, StatusPill, PublishSwitch } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

function PostEditor() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (id) supabase().from('posts').select('*').eq('id', id).maybeSingle().then(({ data }) => setPost(data as Post | null));
  }, [id]);

  if (post === undefined) return <Loading />;
  if (!post) return <div className="ip-empty"><h2>ไม่พบโพสต์</h2><Link className="ip-btn" href="/admin/posts">กลับ</Link></div>;

  const update = (patch: Partial<Post>) => setPost({ ...post, ...patch });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const slug = post.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) { setMessage({ ok: false, text: 'ลิงก์โพสต์ (slug) ใช้ได้เฉพาะ a-z, 0-9 และขีด -' }); return; }
    setBusy(true); setMessage(null);
    const publishedAt = post.is_published ? post.published_at ?? new Date().toISOString() : post.published_at;
    const { error } = await supabase().from('posts').update({
      title: post.title.trim(), slug, excerpt: post.excerpt, body: post.body, cover_url: post.cover_url.trim(),
      is_published: post.is_published, published_at: publishedAt, updated_at: new Date().toISOString(),
    }).eq('id', post.id);
    setBusy(false);
    if (error) { setMessage({ ok: false, text: /duplicate key/i.test(error.message) ? 'ลิงก์โพสต์นี้ถูกใช้แล้ว' : errorText(error) }); return; }
    update({ slug, published_at: publishedAt });
    setMessage({ ok: true, text: 'บันทึกแล้ว' });
  };

  const remove = async () => {
    if (!window.confirm(`ลบโพสต์ “${post.title}” ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return;
    const { error } = await supabase().from('posts').delete().eq('id', post.id);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    router.replace('/admin/posts');
  };

  return <>
    <Link className="ip-back" href="/admin/posts">← โพสต์ทั้งหมด</Link>
    <div className="ip-page-head"><div><h1>{post.title || 'โพสต์ไม่มีชื่อ'}</h1></div><StatusPill on={post.is_published} /></div>
    <form className="ip-card ip-form ip-narrow-form" onSubmit={save}>
      <label>หัวข้อ<input value={post.title} onChange={event => update({ title: event.target.value })} required maxLength={200} /></label>
      <label>ลิงก์โพสต์ (slug: a-z, 0-9, -)<input value={post.slug} onChange={event => update({ slug: event.target.value })} required maxLength={80} /></label>
      <label>คำโปรย (แสดงในหน้ารวมโพสต์)<textarea rows={2} value={post.excerpt} onChange={event => update({ excerpt: event.target.value })} maxLength={400} /></label>
      <ImageField label="รูปปก" value={post.cover_url} folder="posts" onChange={cover_url => update({ cover_url })} />
      <label>เนื้อหา (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)<textarea rows={14} value={post.body} onChange={event => update({ body: event.target.value })} /></label>
      <PublishSwitch showLabel label="เผยแพร่" checked={post.is_published} onToggle={() => update({ is_published: !post.is_published })} />
      <SaveBar busy={busy} message={message}>{post.is_published && <Link className="ip-link-btn" href={`/blog/post?slug=${post.slug}`} target="_blank">ดูหน้าโพสต์ ↗︎</Link>}</SaveBar>
      <button type="button" className="ip-link-btn danger" onClick={() => void remove()}>ลบโพสต์นี้</button>
    </form>
  </>;
}

export default function AdminPostPage() {
  return <Suspense fallback={<Loading />}><PostEditor /></Suspense>;
}

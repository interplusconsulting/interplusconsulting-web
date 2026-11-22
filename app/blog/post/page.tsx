'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { formatDate, isSupabaseConfigured, supabase } from '../../../lib/supabase';
import type { Post } from '../../../lib/types';
import { TextBlock } from '../../_portal/lesson-content';
import { Loading, NotConfigured } from '../../_portal/shell';

function PostView() {
  const slug = useSearchParams().get('slug') ?? '';
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured || !slug) return;
    supabase().from('posts').select('*').eq('slug', slug).eq('is_published', true).maybeSingle().then(({ data }) => setPost(data as Post | null));
  }, [slug]);

  useEffect(() => { if (post) document.title = `${post.title} | Inter Plus Consulting`; }, [post]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (post === undefined && slug) return <Loading />;
  if (!post) return <div className="ip-empty"><h2>ไม่พบบทความ</h2><Link className="ip-btn" href="/blog">ดูบทความทั้งหมด</Link></div>;

  return <article className="ip-article">
    <Link className="ip-back" href="/blog">← บทความทั้งหมด</Link>
    <small className="ip-muted">{formatDate(post.published_at)}</small>
    <h1>{post.title}</h1>
    {post.excerpt && <p className="ip-lead">{post.excerpt}</p>}
    {post.cover_url && <img className="ip-article-cover" src={post.cover_url} alt="" />}
    <TextBlock text={post.body} />
    <div className="ip-card ip-cta"><div><strong>สนใจเรียนหรือวางแผนไปต่างประเทศ?</strong><p className="ip-muted">ปรึกษาทีม Inter Plus Consulting ได้ฟรี</p></div><Link className="ip-btn" href="/#contact">ปรึกษาฟรี</Link></div>
  </article>;
}

export default function PostPage() {
  return <Suspense fallback={<Loading />}><PostView /></Suspense>;
}

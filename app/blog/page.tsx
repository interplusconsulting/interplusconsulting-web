'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorText, formatDate, isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { Post } from '../../lib/types';
import { Loading, NotConfigured } from '../_portal/shell';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase().from('posts').select('id, title, slug, excerpt, cover_url, published_at').eq('is_published', true).order('published_at', { ascending: false })
      .then(({ data, error: loadError }) => { if (loadError) setError(errorText(loadError)); setPosts((data as Post[]) ?? []); });
  }, []);

  if (!isSupabaseConfigured) return <NotConfigured />;

  return <>
    <div className="ip-page-head"><div><p className="ip-eyebrow">BLOG & NEWS</p><h1>บทความและข่าวสาร</h1><p className="ip-muted">เทคนิคการสอบ ประสบการณ์ทำงานต่างประเทศ และรีวิวการเดินทาง</p></div></div>
    {error && <p className="ip-error">{error}</p>}
    {!posts && !error && <Loading />}
    {posts && posts.length === 0 && <div className="ip-empty"><h2>ยังไม่มีบทความ</h2><p>ติดตามบทความใหม่เร็ว ๆ นี้</p></div>}
    {posts && posts.length > 0 && <div className="ip-course-grid">{posts.map(post => <Link className="ip-course-card ip-post-card" key={post.id} href={`/blog/post?slug=${post.slug}`}>
      <div className="ip-cover">{post.cover_url ? <img src={post.cover_url} alt="" /> : <span>{post.title.slice(0, 1)}</span>}</div>
      <div className="ip-course-body"><small className="ip-muted">{formatDate(post.published_at)}</small><h3>{post.title}</h3><p>{post.excerpt}</p><span className="ip-link-btn">อ่านต่อ →</span></div>
    </Link>)}</div>}
  </>;
}

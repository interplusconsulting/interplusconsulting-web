'use client';

import PaginatedList from '../../_portal/paginated-list';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { errorText, formatDate, supabase } from '../../../lib/supabase';
import type { Post } from '../../../lib/types';
import { IconLink, StatusPill } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase().from('posts').select('*').order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => { if (loadError) setError(errorText(loadError)); setPosts((data as Post[]) ?? []); });
  }, []);

  const create = async () => {
    const { data, error: insertError } = await supabase().from('posts').insert({ title: 'โพสต์ใหม่', slug: `post-${Date.now().toString(36)}` }).select('id').single();
    if (insertError) { setError(errorText(insertError)); return; }
    router.push(`/admin/post?id=${data.id}`);
  };

  return <>
    <div className="ip-page-head"><div><h1>จัดการโพสต์</h1><p className="ip-muted">บทความและข่าวสาร โพสต์ที่เผยแพร่จะแสดงที่หน้า <Link href="/blog">/blog</Link></p></div><button type="button" className="ip-btn" onClick={() => void create()}>+ เขียนโพสต์ใหม่</button></div>
    {error && <p className="ip-error">{error}</p>}
    {!posts && <Loading />}
    {posts && posts.length === 0 && <div className="ip-empty"><h2>ยังไม่มีโพสต์</h2></div>}
    <PaginatedList items={posts ?? []}>{pageItems => <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>หัวข้อ</th><th>สถานะ</th><th>เผยแพร่เมื่อ</th><th /></tr></thead>
      <tbody>{pageItems.map(post => <tr key={post.id}>
        <td data-label="หัวข้อ"><b>{post.title}</b><br /><small className="ip-muted">/blog/post?slug={post.slug}</small></td>
        <td data-label="สถานะ"><StatusPill on={post.is_published} /></td>
        <td data-label="เผยแพร่เมื่อ">{formatDate(post.published_at)}</td>
        <td><div className="admin-row-actions">
          <IconLink icon="edit" label="แก้ไขโพสต์" href={`/admin/post?id=${post.id}`} />
          {post.is_published && <IconLink icon="open" label="ดูหน้าโพสต์" href={`/blog/post?slug=${post.slug}`} external />}
        </div></td>
      </tr>)}</tbody>
    </table></div>}</PaginatedList>
  </>;
}

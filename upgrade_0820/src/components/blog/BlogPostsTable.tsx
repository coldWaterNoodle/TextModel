'use server';

import { PostsTableClientWrapper } from './PostsTableClientWrapper';

async function getPosts(subject: string = '전체') {
  const params = new URLSearchParams();
  if (subject !== '전체') params.append('subject', subject);
  const url = `http://localhost:3000/api/blog/posts${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.posts || [];
}

export async function BlogPostsTable() {
  const initialPosts = await getPosts();

  return <PostsTableClientWrapper initialPosts={initialPosts} />;
}

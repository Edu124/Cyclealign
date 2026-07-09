import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * File a report against a community post. Stored in Supabase for the founder
 * to review; in local/demo mode the report is accepted silently so the user
 * experience is identical.
 */
export async function reportPost(postId: string, reason = 'inappropriate'): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Locally-seeded demo posts don't exist in the cloud — nothing to file.
  if (postId.startsWith('demo-') || postId.startsWith('local-')) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('post_reports')
    .upsert(
      { post_id: postId, reporter_id: user.id, reason },
      { onConflict: 'post_id,reporter_id' },
    );
}

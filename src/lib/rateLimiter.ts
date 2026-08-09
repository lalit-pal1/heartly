import { createAdminClient } from '@/utils/supabase/server';

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  try {
    const supabase = createAdminClient();
    const now = new Date();
    
    // 1. Delete expired rate limit records first to save space
    await supabase
      .from('rate_limits')
      .delete()
      .lt('expire_at', now.toISOString());

    // 2. Fetch current record
    const { data, error } = await supabase
      .from('rate_limits')
      .select('points, expire_at')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error("Rate limit query error:", error);
      return { success: true, remaining: 1 }; // fail open on database query failures
    }

    if (!data) {
      // Create new record
      const expireAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();
      await supabase
        .from('rate_limits')
        .insert({ key, points: 1, expire_at: expireAt });
      return { success: true, remaining: limit - 1 };
    }

    if (data.points >= limit) {
      return { success: false, remaining: 0 };
    }

    // Increment points
    await supabase
      .from('rate_limits')
      .update({ points: data.points + 1 })
      .eq('key', key);

    return { success: true, remaining: limit - (data.points + 1) };
  } catch (err) {
    console.error("Rate limiting exception:", err);
    return { success: true, remaining: 1 }; // fail open
  }
}

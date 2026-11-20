import { supabase } from "@/lib/supabase-client";

export async function ensureUserTask(userId: string): Promise<void> {
  const { data: task, error: taskFetchError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (taskFetchError) throw taskFetchError;
  if (task) return;

  const { error: taskInsertError } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      key: false,
    });

  if (taskInsertError) throw taskInsertError;
}

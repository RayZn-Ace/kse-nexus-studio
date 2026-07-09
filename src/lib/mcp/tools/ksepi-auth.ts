import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function redacted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redacted);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        /token|secret|password|authorization|api[_-]?key|encrypted|jwks/i.test(key)
          ? "[REDACTED]"
          : redacted(child),
      ]),
    );
  }
  return value;
}

export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Not authenticated");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend environment is not configured");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function requireKseAdmin(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) throw new Error("Not authenticated");
  const userId = ctx.getUserId();
  if (!userId) throw new Error("No user id in token");
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(`Admin check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: KSEPI requires an admin account");
  return { supabase, userId, email: ctx.getUserEmail() };
}
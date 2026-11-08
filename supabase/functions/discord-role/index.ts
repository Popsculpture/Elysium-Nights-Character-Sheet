// discord-role: the playtest gate for the Freelancer's Companion (EN1101).
//
// Called by the app right after a Discord sign-in, with the Discord access token Supabase hands
// back for that one sign-in (session.provider_token). It asks Discord for the player's membership
// in the Elysium Nights server and, when the Play tester role is there, writes the EN1101 grant
// (source 'discord_role'); when the role is gone it removes that grant. A grant from any other
// source (a backer, a comp) is never touched.
//
// Secrets (Supabase dashboard, Edge Functions, Secrets; never in the app or the repo):
//   DISCORD_GUILD_ID   the server's ID
//   DISCORD_ROLE_ID    the Play tester role's ID
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
//
// The answer is { checked, granted } on a check, or { checked: false, reason } when nothing was
// decided (a token Discord refuses, a rate limit, the secrets missing): then the grants stay as
// they were.

const SKU = "EN1101";
const SOURCE = "discord_role";
const DISCORD = "https://discord.com/api/v10";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// the platform's service role key, or its first secret key on a project that uses the newer keys
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const first = Object.keys(keys)[0];
    return first ? String(keys[first]) : "";
  } catch (_e) { return ""; }
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { checked: false, reason: "method" });

  const url = Deno.env.get("SUPABASE_URL");
  const service = serviceKey();
  const guild = Deno.env.get("DISCORD_GUILD_ID");
  const role = Deno.env.get("DISCORD_ROLE_ID");
  if (!url || !service || !guild || !role) return reply(500, { checked: false, reason: "not configured" });
  // the app's own publishable key, as it sent it; the platform's anon key otherwise
  const apikey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";

  // 1. the Supabase account behind the request
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return reply(401, { checked: false, reason: "no session" });
  const who = await fetch(url + "/auth/v1/user", { headers: { Authorization: "Bearer " + jwt, apikey } });
  if (!who.ok) return reply(401, { checked: false, reason: "no session" });
  const user = await who.json();

  let token = "";
  try { token = String((await req.json()).token || ""); } catch (_e) { /* no body */ }
  if (!token) return reply(400, { checked: false, reason: "no token" });

  // 2. the Discord account behind the token, which must be the one linked to this Supabase account
  const me = await fetch(DISCORD + "/users/@me", { headers: { Authorization: "Bearer " + token } });
  if (!me.ok) return reply(200, { checked: false, reason: "discord " + me.status });
  const discordId = String((await me.json()).id || "");
  const linked = (user.identities || []).some((i: { provider?: string; id?: string; identity_data?: { provider_id?: string; sub?: string } }) =>
    i.provider === "discord" && [i.id, i.identity_data && i.identity_data.provider_id, i.identity_data && i.identity_data.sub].indexOf(discordId) !== -1);
  if (!discordId || !linked) return reply(403, { checked: false, reason: "not this account's Discord" });

  // 3. membership and roles in the server: 404 means not a member
  const mem = await fetch(DISCORD + "/users/@me/guilds/" + guild + "/member", { headers: { Authorization: "Bearer " + token } });
  let has = false;
  if (mem.ok) has = ((await mem.json()).roles || []).indexOf(role) !== -1;
  else if (mem.status !== 404) return reply(200, { checked: false, reason: "discord " + mem.status });

  // 4. the grant: written (leaving any existing grant as it is) or removed (only our own source)
  const rest = url + "/rest/v1/entitlements";
  // a newer secret key (sb_secret_...) goes in apikey alone; the legacy service role JWT goes in both
  const auth: Record<string, string> = { apikey: service, "Content-Type": "application/json" };
  if (!service.startsWith("sb_")) auth.Authorization = "Bearer " + service;
  const w = has
    ? await fetch(rest + "?on_conflict=user_id,sku", { method: "POST", headers: { ...auth, Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id, sku: SKU, source: SOURCE }) })
    : await fetch(rest + "?user_id=eq." + user.id + "&sku=eq." + SKU + "&source=eq." + SOURCE, { method: "DELETE", headers: { ...auth, Prefer: "return=minimal" } });
  if (!w.ok) { console.error("grant write failed", w.status, await w.text()); return reply(500, { checked: false, reason: "write" }); }

  return reply(200, { checked: true, granted: has });
});

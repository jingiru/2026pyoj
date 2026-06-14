import { createHash } from "crypto";

export function hashGuestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashGuestIp(ipAddress: string | null) {
  if (!ipAddress) return null;
  const secret =
    process.env.GUEST_IP_HASH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "pyoj-guest-ip";
  return createHash("sha256").update(`${secret}:${ipAddress}`).digest("hex");
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export function guestDisplayCode(tokenHash: string) {
  return tokenHash.slice(0, 12).toUpperCase();
}

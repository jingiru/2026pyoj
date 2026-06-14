export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export function guestDisplayCode(token: string) {
  return token.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
}

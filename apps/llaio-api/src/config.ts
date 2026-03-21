export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,https://llaio.vercel.app";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

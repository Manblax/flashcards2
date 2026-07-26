interface JwtPayload {
  exp?: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  try {
    const normalizedPayload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(normalizedPayload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthTokenExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token);

  if (
    !payload ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp)
  ) {
    return null;
  }

  return payload.exp * 1000;
}

export function isAuthTokenActive(token: string, now = Date.now()) {
  const expiration = getAuthTokenExpiration(token);

  return expiration !== null && expiration > now;
}

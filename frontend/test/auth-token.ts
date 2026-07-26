export function createTestAuthToken(
  expiresAt = Date.now() + 60 * 60 * 1000,
) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({
      sub: "user-1",
      username: "demo",
      exp: Math.floor(expiresAt / 1000),
    }),
    "test-signature",
  ].join(".");
}

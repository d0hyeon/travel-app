import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const APPLE_AUDIENCE = "https://appleid.apple.com";
const MAX_LIFETIME_SECONDS = 15777000;

const [privateKeyPath, teamId, keyId, servicesId] = process.argv.slice(2);

if (!privateKeyPath || !teamId || !keyId || !servicesId) {
  console.error(
    "사용법: node tools/apple-client-secret.mjs <AuthKey.p8 경로> <Team ID> <Key ID> <Services ID>",
  );
  process.exit(1);
}

const encodeBase64Url = (value) =>
  Buffer.from(value).toString("base64url");

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + MAX_LIFETIME_SECONDS;

const header = { alg: "ES256", kid: keyId };
const payload = {
  iss: teamId,
  iat: issuedAt,
  exp: expiresAt,
  aud: APPLE_AUDIENCE,
  sub: servicesId,
};

const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
const privateKey = createPrivateKey(readFileSync(privateKeyPath, "utf8"));
const signature = sign("sha256", Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: "ieee-p1363",
});

console.log(`${signingInput}.${signature.toString("base64url")}`);
console.error(`만료: ${new Date(expiresAt * 1000).toISOString()}`);

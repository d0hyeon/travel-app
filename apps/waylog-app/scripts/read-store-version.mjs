import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

if (process.env.CI && !(process.env.ASC_KEY_ID && process.env.ASC_ISSUER_ID && process.env.ASC_PRIVATE_KEY)) {
  console.error("ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY 시크릿이 필요합니다.");
  process.exit(1);
}

const readline = createInterface({ input: process.stdin, output: process.stdout });
const keyId = process.env.ASC_KEY_ID || (await readline.question("Key ID: ")).trim();
const issuerId = process.env.ASC_ISSUER_ID || (await readline.question("Issuer ID: ")).trim();
const privateKey =
  process.env.ASC_PRIVATE_KEY ||
  readFileSync((await readline.question(".p8 파일 경로: ")).trim().replace(/^~/, process.env.HOME), "utf8");
const listAll = process.env.CI ? false : (await readline.question("최근 버전 10개를 상태와 함께 볼까요? (y/N) ")).trim() === "y";
readline.close();

const { submit } = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const appId = submit.production.ios.ascAppId;

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const issuedAt = Math.floor(Date.now() / 1000);
const unsigned = [
  encode({ alg: "ES256", kid: keyId, typ: "JWT" }),
  encode({ iss: issuerId, iat: issuedAt, exp: issuedAt + 600, aud: "appstoreconnect-v1" }),
].join(".");
const signature = createSign("SHA256")
  .update(unsigned)
  .sign({ key: privateKey, dsaEncoding: "ieee-p1363" })
  .toString("base64url");

const query = listAll
  ? "filter[platform]=IOS&limit=10"
  : "filter[platform]=IOS&filter[appStoreState]=READY_FOR_SALE&limit=1";
const response = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?${query}`, {
  headers: { Authorization: `Bearer ${unsigned}.${signature}` },
});
if (!response.ok) {
  console.error(response.status, await response.text());
  process.exit(1);
}

const { data } = await response.json();
if (listAll) {
  for (const { attributes } of data) {
    console.log(attributes.versionString, attributes.appStoreState);
  }
} else {
  console.log(data[0]?.attributes.versionString ?? "");
}

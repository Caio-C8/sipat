import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pnpmStore = join(repositoryRoot, "node_modules", ".pnpm");

function requireDependencyFrom(consumerName, consumerVersion, dependencyName) {
  const encodedConsumerName = consumerName.replace("/", "+");
  const prefix = `${encodedConsumerName}@${consumerVersion}`;
  const packageDirectory = readdirSync(pnpmStore).find((entry) =>
    entry.startsWith(prefix),
  );

  assert.ok(
    packageDirectory,
    `${consumerName}@${consumerVersion} não está instalado`,
  );

  const consumerManifest = join(
    pnpmStore,
    packageDirectory,
    "node_modules",
    ...consumerName.split("/"),
    "package.json",
  );

  return createRequire(consumerManifest)(dependencyName);
}

const braces = requireDependencyFrom("micromatch", "4.0.8", "braces");

assert.doesNotThrow(() => braces("src/{api,web}/**/*.ts"));
assert.throws(
  () => braces(`${"{".repeat(101)}value${"}".repeat(101)}`),
  /Brace nesting depth \(101\), exceeds max depth \(100\)/,
);

const decodeUriComponent = requireDependencyFrom(
  "query-string",
  "7.1.3",
  "decode-uri-component",
);

assert.equal(decodeUriComponent("hello+world"), "hello world");
assert.equal(decodeUriComponent("%E2%82%AC"), "€");
assert.doesNotThrow(() => decodeUriComponent("%C2".repeat(5_000)));

const forge = requireDependencyFrom("@expo/cli", "57.0.31", "node-forge");
const keyPair = forge.pki.rsa.generateKeyPair({ bits: 512, e: 0x10001 });
const message = "sipat-security-regression";
const signingDigest = forge.md.sha256.create();
signingDigest.update(message, "utf8");
const validSignature = keyPair.privateKey.sign(signingDigest);
const verificationDigest = forge.md.sha256.create();
verificationDigest.update(message, "utf8");
const digestBytes = verificationDigest.digest().getBytes();

assert.equal(keyPair.publicKey.verify(digestBytes, validSignature), true);

const malformedDigestInfo = forge.asn1.create(
  forge.asn1.Class.UNIVERSAL,
  forge.asn1.Type.SEQUENCE,
  true,
  [
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.OID,
          false,
          forge.asn1.oidToDer(forge.oids.sha256).getBytes(),
        ),
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.NULL,
          false,
          "",
        ),
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.NULL,
          false,
          "",
        ),
      ],
    ),
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.OCTETSTRING,
      false,
      digestBytes,
    ),
  ],
);
const malformedSignature = keyPair.privateKey.sign(
  forge.asn1.toDer(malformedDigestInfo).getBytes(),
  "NONE",
);

assert.throws(
  () => keyPair.publicKey.verify(digestBytes, malformedSignature),
  /DigestInfo value/,
);

console.log("Patches de segurança das dependências verificados.");

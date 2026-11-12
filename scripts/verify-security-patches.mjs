import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRequire = createRequire(
  join(repositoryRoot, "apps", "mobile", "package.json"),
);
const webRequire = createRequire(
  join(repositoryRoot, "apps", "web", "package.json"),
);
const apiRequire = createRequire(
  join(repositoryRoot, "apps", "api", "package.json"),
);
const expoRequire = createRequire(mobileRequire.resolve("expo/package.json"));
const expoCliRequire = createRequire(
  expoRequire.resolve("@expo/cli/package.json"),
);
const expoCliManifest = expoCliRequire("./package.json");
const expoConfigRequire = createRequire(
  expoCliRequire.resolve("@expo/config/package.json"),
);
const shadcnRequire = createRequire(webRequire.resolve("shadcn"));
const dotenvxRequire = createRequire(shadcnRequire.resolve("@dotenvx/dotenvx"));
const nestCliRequire = createRequire(
  apiRequire.resolve("@nestjs/cli/package.json"),
);
const jestRequire = createRequire(apiRequire.resolve("jest/package.json"));
const jestCoreRequire = createRequire(
  jestRequire.resolve("@jest/core/package.json"),
);
const jestTransformRequire = createRequire(
  jestCoreRequire.resolve("@jest/transform/package.json"),
);
const babelIstanbulRequire = createRequire(
  jestTransformRequire.resolve("babel-plugin-istanbul/package.json"),
);
const testExcludeRequire = createRequire(
  babelIstanbulRequire.resolve("test-exclude/package.json"),
);

assert.match(expoCliManifest.version, /^58\./);
assert.equal(expoCliRequire("node-forge/package.json").version, "1.4.3");
assert.equal(expoConfigRequire("deepmerge/package.json").version, "4.3.1");
assert.equal(shadcnRequire("zod/package.json").version, "4.6.7");
assert.equal(dotenvxRequire("systeminformation").version(), "5.33.18");

for (const [globRequire, expectedVersion] of [
  [testExcludeRequire, "10.5.0"],
  [nestCliRequire, "13.0.6"],
]) {
  const globManifestPath = globRequire.resolve("glob/package.json");
  assert.equal(globRequire(globManifestPath).version, expectedVersion);

  const walkerSource = readFileSync(
    join(dirname(globManifestPath), "dist", "commonjs", "walker.js"),
    "utf8",
  );
  assert.equal(
    walkerSource.match(/if \(this\.signal\?\.aborted\)\s+return cb\(\);/gu)
      ?.length,
    4,
  );
}

const forge = expoCliRequire("node-forge");
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

const deepmerge = expoConfigRequire("deepmerge");
const maliciousDefaults = { session: null };
const maliciousSource = JSON.parse(
  '{"session":{"__proto__":{"isAdmin":true}}}',
);
const merged = deepmerge(maliciousDefaults, maliciousSource);

assert.equal(Object.getPrototypeOf(merged.session), Object.prototype);
assert.equal(merged.session.isAdmin, undefined);
assert.equal(Object.hasOwn(merged.session, "__proto__"), false);

console.log("Correções de segurança das dependências verificadas.");

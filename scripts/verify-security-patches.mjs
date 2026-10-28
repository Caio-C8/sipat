import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRequire = createRequire(
  join(repositoryRoot, "apps", "mobile", "package.json"),
);
const expoRequire = createRequire(mobileRequire.resolve("expo/package.json"));
const expoCliRequire = createRequire(
  expoRequire.resolve("@expo/cli/package.json"),
);
const expoCliManifest = expoCliRequire("./package.json");

assert.equal(expoCliManifest.version, "58.1.16");

const { z: zodV3 } = expoCliRequire("zod");
let parsedArrayElements = 0;
const arrayElement = zodV3.string().superRefine(() => {
  parsedArrayElements += 1;
});

assert.equal(
  zodV3.array(arrayElement).max(1).safeParse(["first", "second"]).success,
  false,
);
assert.equal(parsedArrayElements, 0);
assert.equal(
  zodV3.array(arrayElement).length(1).safeParse(["first", "second"]).success,
  false,
);
assert.equal(parsedArrayElements, 0);

let parsedSetElements = 0;
const setElement = zodV3.string().superRefine(() => {
  parsedSetElements += 1;
});

assert.equal(
  zodV3
    .set(setElement)
    .max(1)
    .safeParse(new Set(["first", "second"])).success,
  false,
);
assert.equal(parsedSetElements, 0);

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

console.log("Patches de segurança das dependências verificados.");

import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

test("bundled Netlify function and Firebase JWKS dependency work without require(ESM)", async () => {
  const outfile = resolve(
    `node_modules/.cache/netlify-runtime-${process.pid}.mjs`,
  );
  await mkdir(resolve("node_modules/.cache"), { recursive: true });
  try {
    await build({
      entryPoints: ["netlify/functions/storefront.mts"],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      packages: "external",
      logLevel: "silent",
    });
    const script = `
      import assert from 'node:assert/strict';
      import {createRequire} from 'node:module';
      import {generateKeyPairSync,sign,verify} from 'node:crypto';
      const {default:handler}=await import(${JSON.stringify(pathToFileURL(outfile).href)});
      const response=await handler(new Request('https://shop.example.test/.netlify/functions/storefront?endpoint=missing-runtime-fixture'));
      assert.equal(response.status,404);
      assert.ok(response.headers.get('Content-Security-Policy'));
      const require=createRequire(${JSON.stringify(pathToFileURL(resolve("package.json")).href)});
      const jwks=require('jwks-rsa');
      const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
      const jwk={...publicKey.export({format:'jwk'}),kid:'unit-key',alg:'RS256',use:'sig'};
      const client=jwks({jwksUri:'https://not-requested.example.test/jwks',getKeysInterceptor:async()=>[jwk]});
      const key=await client.getSigningKey('unit-key');
      const data=Buffer.from('runtime compatibility fixture');
      assert.ok(verify('RSA-SHA256',data,key.getPublicKey(),sign('RSA-SHA256',data,privateKey)));
      console.log('Netlify bundle and RSA key conversion passed');
    `;
    const output = execFileSync(
      process.execPath,
      ["--no-experimental-require-module", "--input-type=module", "-e", script],
      { encoding: "utf8", timeout: 20000 },
    );
    assert.match(output, /Netlify bundle and RSA key conversion passed/);
  } finally {
    await rm(outfile, { force: true });
  }
});

import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
const source = "dist-android";
const destination = "android/app/src/main/assets/www";
const html = await readFile(`${source}/index.html`, "utf8");
if (/https?:\/\//.test(html))
  throw new Error("Native index must not reference a remote origin.");
const policy =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
await writeFile(
  `${source}/index.html`,
  html.replace(
    "<head>",
    `<head>\n<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
  ),
);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.log(
  "Bundled offline Android assets and a restrictive content security policy.",
);

const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const outFolder = args.length ? args[0] : path.resolve(__dirname, "../src");
const envConfigOutFile = path.resolve(outFolder, "env-config.js");
const validEnvs = Object.keys(process.env)
  .filter((key) => key.startsWith("PAYLOAD_PUBLIC_") || key == "TENANT")
  .reduce((obj, key) => {
    return Object.assign(obj, { [key]: process.env[key] });
  }, {});
fs.writeFileSync(
  envConfigOutFile,
  `window._env_ = ${JSON.stringify(validEnvs)};`
);
console.log(`Wrote "${envConfigOutFile}"`);

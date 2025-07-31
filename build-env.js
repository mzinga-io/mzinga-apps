const fs = require("fs");
const path = require("path");
require("dotenv").config();
const envConfigOutFile = path.resolve(__dirname, "./src/env-config.js");
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

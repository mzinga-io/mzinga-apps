const path = require("path");
const fs = require("fs");
const args = process.argv.slice(2);
const tenantToCopy = args[0] || "ecday2023";

const tenantToCopyRepoPath = path.join(__dirname, `../mzinga-${tenantToCopy}`);
if (!fs.existsSync(tenantToCopyRepoPath)) {
  console.error(`No tenant repository found at ${tenantToCopyRepoPath}`);
  process.exit(1);
}
const configsPath = path.join(tenantToCopyRepoPath, "configs");
const localConfigsPath = path.join(
  __dirname,
  process.env.TENANT || "local-tenant"
);
console.log(`Copying files from ${configsPath} to ${localConfigsPath}`);
fs.cpSync(configsPath, localConfigsPath, {
  recursive: true,
  force: true,
});

console.log(`Copied all files`);

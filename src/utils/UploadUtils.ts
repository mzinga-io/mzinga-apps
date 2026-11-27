// Kept as require: this file is also bundled in the admin UI, where "path" is replaced.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
export const UploadUtils = {
  GetStaticDir(outPath: string = "media"): string {
    return path.resolve(
      process.cwd(),
      process.env.TENANT || "",
      path.join("./uploads", (outPath || "media").toLowerCase()),
    );
  },
};

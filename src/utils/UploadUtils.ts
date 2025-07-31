import path from "path";
export const UploadUtils = {
  GetStaticDir(outPath: string = "media"): string {
    return path.resolve(
      process.cwd(),
      process.env.TENANT || "",
      path.join("./uploads", (outPath || "media").toLowerCase())
    );
  },
};

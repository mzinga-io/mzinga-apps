import path from "path";
import fs from "fs";
import type { LoadResult } from "../types";
import { MZingaLogger } from "./MZingaLogger";
export class FSUtils {
  constructor(private readonly tenant?: string) {
    if (!this.tenant) {
      this.tenant = process.env.TENANT;
    }
  }
  GetBaseDir(dirName: string = "custom-entities"): string {
    return path.join(__dirname, "../../", this.tenant, dirName);
  }
  GetBaseDirByType(type: string = "definitions", rootDir?: string): LoadResult {
    const baseDir = path.join(this.GetBaseDir(rootDir), type);
    return {
      result: fs.existsSync(baseDir),
      strData: baseDir,
    };
  }
  SaveToFolder = (
    folder: string,
    fileName: string,
    content: string,
    rootDir?: string
  ) => {
    const baseDir = this.GetBaseDirByType(folder, rootDir);
    if (!baseDir.result) {
      fs.mkdirSync(baseDir.strData, { recursive: true });
      MZingaLogger.Instance?.debug(
        `[FSUtils.SaveToFolder]: Created base directory: ${baseDir.strData}`
      );
    }
    const fullPath = path.join(baseDir.strData, fileName);
    fs.writeFileSync(fullPath, content);
    MZingaLogger.Instance?.debug(
      `[FSUtils.SaveToFolder]: Wrote file: ${fullPath}`
    );
    return fullPath;
  };
  DeleteFromFolder = (folder: string, fileName: string) => {
    const baseDir = this.GetBaseDirByType(folder);
    if (!baseDir.result) {
      MZingaLogger.Instance?.debug(
        `[FSUtils.DeleteFromFolder]: No ${folder} found. Skipping..`
      );
      return;
    }
    const fullPath = path.join(baseDir.strData, fileName);
    fs.rmSync(fullPath, {
      force: true,
      recursive: true,
    });
    MZingaLogger.Instance?.debug(
      `[FSUtils.DeleteFromFolder]: Deleted file ${fullPath}`
    );
  };
  EmptyFolder = (folder: string, rootDir?: string) => {
    const baseDir = this.GetBaseDirByType(folder, rootDir);
    if (!baseDir.result) {
      MZingaLogger.Instance?.debug(
        `[FSUtils.EmptyFolder]: No folder found: ${baseDir.strData}`
      );
      return;
    }
    fs.rmdirSync(baseDir.strData, {
      recursive: true,
    });
    MZingaLogger.Instance?.debug(
      `[FSUtils.EmptyFolder]: Deleted all file(s) from ${baseDir.strData}`
    );
  };
}

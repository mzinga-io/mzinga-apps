import { ConfigLoader } from "../configs/ConfigLoader";
import { MZingaLogger } from "./MZingaLogger";
import pino from "pino";
const placeholderRe = new RegExp(/_{(\w*)}_/gi);
const Env = ConfigLoader.LoadEnv();

export class CollectionUtils {
  private readonly logger: pino.Logger;
  private readonly PREVIEW_URL: string;
  constructor(private readonly collectionSlug) {
    this.logger = MZingaLogger.Instance;
    this.PREVIEW_URL =
      Env[`PAYLOAD_PUBLIC_${collectionSlug?.toUpperCase()}_PREVIEW_URL`];
    if (this.PREVIEW_URL) {
      this.logger?.debug(
        `[${collectionSlug}] Preview URL: ${this.PREVIEW_URL}`
      );
    }
  }
  GeneratePreviewConfig() {
    if (!this.PREVIEW_URL) {
      return {};
    }
    return {
      preview: (doc, { locale }) => this.GeneratePreviewURL(doc, { locale }),
    };
  }
  GeneratePreviewURL(doc, { locale }) {
    placeholderRe.lastIndex = 0;
    let m = null;
    const enrichedDocument = {
      ...doc,
      collectionSlug: this.collectionSlug,
      locale,
    };
    let replacedUrl = this.PREVIEW_URL;
    while ((m = placeholderRe.exec(replacedUrl))) {
      const placeholder = m[0];
      const propToFind = m[1];

      replacedUrl = replacedUrl.replace(
        placeholder,
        enrichedDocument[propToFind] || ""
      );
      placeholderRe.lastIndex = 0;
    }
    return replacedUrl;
  }
}

import { Slugs } from "../collections/Slugs";
import type { EnvConfig, InstanceConfig } from "../types";
import { SlugUtils } from "../utils";
export class ConfigLoader {
  private enabledCollections;
  private customComponents;
  env: EnvConfig;
  constructor(additionalConfig?: InstanceConfig) {
    this.enabledCollections =
      additionalConfig && additionalConfig.EnabledCollections
        ? additionalConfig.EnabledCollections
        : ({} as InstanceConfig["EnabledCollections"]);
    this.enabledCollections[Slugs.Users] = true;
    this.customComponents =
      additionalConfig && additionalConfig.CustomComponents
        ? additionalConfig.CustomComponents
        : ({} as InstanceConfig["CustomComponents"]);
    this.env =
      additionalConfig && additionalConfig.Env
        ? additionalConfig.Env
        : ConfigLoader.LoadEnv();
  }
  static LoadEnv(): EnvConfig {
    const _w = typeof window !== "undefined" ? window : process;
    const _env_ = (_w as any)._env_ || (_w as any).env || {};
    return _env_;
  }
  Load(): InstanceConfig {
    const disabledEntitiesSlugs = (
      this.env.PAYLOAD_PUBLIC_DISABLED_ENTITIES_SLUGS || ""
    ).split(",");
    for (const key of Object.keys(Slugs)) {
      const slugKey = SlugUtils.GetValidSlugs(Slugs[key]);
      if (!slugKey) {
        continue;
      }
      this.enabledCollections[slugKey] =
        disabledEntitiesSlugs.indexOf(slugKey) === -1;
    }
    this.customComponents = {
      Graphics: {
        Icon: {
          src: this.env.PAYLOAD_PUBLIC_CUSTOM_ICON_SRC || "/assets/logo.png",
        },
        Logo: {
          src: this.env.PAYLOAD_PUBLIC_CUSTOM_LOGO_SRC || "/assets/logo.png",
        },
      },
    };
    return {
      Env: this.env,
      EnabledCollections: this.enabledCollections,
      CustomComponents: this.customComponents,
      Meta: {
        TitleSuffix: "- Mzinga.io",
      },
    };
  }
}

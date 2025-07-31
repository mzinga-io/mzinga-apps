import type { EnvConfig } from "../types";

export const RolesUtils = {
  GetRolesFieldOptions(env: EnvConfig, defaultRoles: string[]): string[] {
    const additionalRolesFromEnv = env?.["PAYLOAD_PUBLIC_ADDITIONAL_ROLES"];
    return additionalRolesFromEnv
      ? additionalRolesFromEnv.split(",").concat(defaultRoles || [])
      : defaultRoles || [];
  },
};

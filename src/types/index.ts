import { CollectionAdminOptions } from "payload/dist/collections/config/types";
import { CollectionConfig, Field } from "payload/types";

export type SendGridTransportOptions = {
  apiKey: string;
};
export type EnvConfig = {
  [key: string]: string;
};
export type CustomComponents = {
  UnauthorizedUploadField?: any;
};
export type InstanceConfig = {
  Env?: EnvConfig;
  EnabledCollections?: {
    [key: string]: boolean;
  };
  CustomComponents?: {
    Graphics: {
      Icon: {
        src: string;
      };
      Logo: {
        src: string;
      };
    };
  };
  Meta?: {
    TitleSuffix: string;
  };
};
export type SafeAccess = {
  admin?: string;
  read?: string;
  delete?: string;
  update?: string;
  create?: string;
  readVersions?: string;
  unlock?: string;
};
export type AccessByRoles = {
  admin?: string[];
  read?: string[];
  delete?: string[];
  update?: string[];
  create?: string[];
  readVersions?: string[];
  unlock?: string[];
};
export type FieldSafeAccess = {
  read?: string;
  update?: string;
  create?: string;
};
export type CollectionConfigWithExtends = CollectionConfig & {
  extends?: {
    collection: string;
    accessByRoles?: AccessByRoles;
    access?: SafeAccess;
    hiddenFields?: string[];
    fields?: FieldWithSafeAccess[] | Field[];
    admin?: CollectionAdminOptions;
    safeAdminHidden?: string;
    labels?: CollectionConfig["labels"];
  };
  safeAccess?: SafeAccess;
  accessByRoles?: AccessByRoles;
  fields: FieldWithSafeAccess[] | Field[];
};
export type FieldWithSafeAccess = Field & {
  safeAccess?: FieldSafeAccess;
  safeAdminCondition?: string;
  safeHooksBeforeChange?: string[];
  safeFilterOptions?: string;
  readValueFromField?: string;
};
export type LoadResult = {
  result: boolean;
  cause?: string;
  data?: any[];
  strData?: string;
};
export type ExportCollectionsPluginConfig = {
  disabledCollections?: string[];
};

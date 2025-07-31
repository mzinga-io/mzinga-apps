import fs from "fs";
import path from "path";
import { CollectionConfig } from "payload/types";
import { LoadResult, SafeAccess } from "../types";
import { FSUtils } from "../utils/FSUtils";

const traverseDataObject = (inputData) => {
  let result = [];
  const keys = Object.keys(inputData);

  keys.forEach((key) => {
    const value = inputData[key];
    if (typeof value === "string") {
      result.push({
        name: key,
        type: "text",
      });
      return;
    }
    if (typeof value === "number") {
      result.push({
        name: key,
        type: "number",
      });
      return;
    }
    if (typeof value === "boolean") {
      result.push({
        name: key,
        type: "checkbox",
      });
      return;
    }

    // if it's an array
    if (
      typeof value === "object" &&
      value.toString() !== "[object Object]" &&
      value.hasOwnProperty("length")
    ) {
      if (!value.length) {
        return;
      }
      result.push({
        name: key,
        type: "array",
        fields: traverseDataObject(value[0]),
      });
      return;
    }
    if (typeof value === "object") {
      result.push({
        name: key,
        type: "group",
        fields: traverseDataObject(value),
      });
      return;
    }
  });
  return result;
};

const stringified = (fn?: Function) => fn?.toString();
const transformToJSON = (field: any) => {
  return {
    ...field,
    ...(field.fields ? { fields: field.fields.map(transformToJSON) } : {}),
    tabs: field.tabs
      ? field.tabs.map((tab) => {
          return {
            ...tab,
            safeAdminCondition: stringified(tab.safeAdminCondition),
            fields: tab.fields.map(transformToJSON),
          };
        })
      : undefined,
    safeAdminCondition: stringified(field.safeAdminCondition),
    safeAdminHidden: stringified(field.safeAdminHidden),
    safeAccess: transformToSafeAccess(field.safeAccess),
    safeFilterOptions: stringified(field.safeFilterOptions),
    safeHooksBeforeChange: field.safeHooksBeforeChange?.map(stringified),
  };
};

export class CustomEntities {
  private readonly fsUtils: FSUtils;
  constructor(private readonly tenant?: string) {
    if (!this.tenant) {
      this.tenant = process.env.TENANT;
    }
    this.fsUtils = new FSUtils(this.tenant);
  }
  async LoadFromDefinitions(): Promise<LoadResult> {
    const baseDir = this.fsUtils.GetBaseDirByType("definitions");
    if (!baseDir.result) {
      return Promise.resolve({
        result: false,
        cause: `Cannot find '${baseDir.strData}'`,
      });
    }
    return await getResult(baseDir.strData, undefined);
  }
  async LoadFromPayloads(): Promise<LoadResult> {
    const baseDir = this.fsUtils.GetBaseDirByType("payloads");
    if (!baseDir.result) {
      return Promise.resolve({
        result: false,
        cause: `Cannot find '${baseDir.strData}'`,
      });
    }
    return await getResult(baseDir.strData, traverseDataObject);
  }
  async GetAll() {
    const promises = [] as Promise<LoadResult>[];
    promises.push(this.LoadFromDefinitions());
    promises.push(this.LoadFromPayloads());
    return await Promise.all(
      promises
        .map((p) =>
          p.catch((e) => {
            return {
              result: false,
              cause: e.message,
            };
          })
        )
        .filter(Boolean)
    );
  }
}
const transformToSafeAccess = (
  access: Partial<CollectionConfig["access"]>
): SafeAccess => {
  return access
    ? {
        admin: access.admin?.toString(),
        create: access.create?.toString(),
        read: access.read?.toString(),
        delete: access.delete?.toString(),
        update: access.update?.toString(),
      }
    : undefined;
};
const getResult = async function (
  baseDir: string,
  manipulateFn: Function
): Promise<LoadResult> {
  const files = fs.readdirSync(baseDir);
  const validFiles = files.filter(
    (f) => f.endsWith(".json") || f.endsWith(".js")
  );
  return {
    result: true,
    data: await Promise.all(
      validFiles.map(async (f) => {
        let data = null;
        try {
          data = await import(path.join(baseDir, f));
          if (data.default) {
            data = data.default;
          }
        } catch (e) {
          return Promise.reject(e);
        }
        let fields = data.fields || (manipulateFn ? manipulateFn(data) : []);
        let labels = data.labels || undefined;
        let admin = data.admin || undefined;
        return {
          slug: data.slug || path.parse(f).name,
          safeAccess: transformToSafeAccess(data.safeAccess),
          accessByRoles: data.accessByRoles,
          versions: data.versions,
          extends: data.extends
            ? {
                ...data.extends,
                safeAdminHidden: (data.extends.admin?.hidden || "").toString(),
                access: transformToSafeAccess(data.extends.access),
              }
            : undefined,
          labels,
          admin: {
            ...admin,
            useAsTitle: admin?.useAsTitle || "title",
          },
          upload: data.upload,
          fields: fields.map(transformToJSON),
        };
      })
    ),
  };
};

import { CollectionConfig } from "mzinga/types";
import { bySlugEndpoints } from "../endpoints";
import { SlugField, TagsField } from "../fields";
import { AuthorField } from "../fields/AuthorField";
import { CopyrightField } from "../fields/CopyrightField";
import { IsPrivateField } from "../fields/IsPrivateField";
import { OwnerField } from "../fields/OwnerField";
import { PublishDateField } from "../fields/PublishDateField";
import { ThumbField } from "../fields/ThumbField";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { UploadUtils } from "../utils/UploadUtils";
import { Slugs } from "./Slugs";
const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Files);
const Files: CollectionConfig = {
  slug: Slugs.Files,
  access: {
    ...access.GetReadWithWheres([
      access.GetPublishDateWhere(),
      access.GetIsPrivateWhere(),
    ]),
    ...access.GetEdit(),
  },
  admin: {
    ...collectionUtils.GeneratePreviewConfig(),
    useAsTitle: "title",
    defaultColumns: [
      "title",
      PublishDateField.Name,
      IsPrivateField.Name,
      SlugField.Name,
    ],
    listSearchableFields: [SlugField.Name],
    group: "Content",
  },
  upload: {
    staticURL: "/uploads/files",
    staticDir: UploadUtils.GetStaticDir("files"),
    mimeTypes: [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/vnd.oasis.opendocument.presentation",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.text",
      "application/rtf",
      "application/zip",
      "application/xml",
      "text/xml",
      "application/octet-stream",
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
    },
    ThumbField.Get(),
    TagsField.Get(),
    {
      name: "excerpt",
      type: "textarea",
      localized: true,
    },
    AuthorField.Get(),
    PublishDateField.Get(),
    IsPrivateField.Get(),
    CopyrightField.Get(),
    SlugField.Get(),
    OwnerField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default Files;

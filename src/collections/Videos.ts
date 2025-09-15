import { CollectionConfig } from "mzinga/types";
import { bySlugEndpoints } from "../endpoints";
import { SlugField, TagsField } from "../fields";
import { AuthorField } from "../fields/AuthorField";
import { CopyrightField } from "../fields/CopyrightField";
import { IsPrivateField } from "../fields/IsPrivateField";
import { OwnerField } from "../fields/OwnerField";
import { PublishDateField } from "../fields/PublishDateField";
import { RelatedItemsField } from "../fields/RelatedItemsField";
import { ThumbField } from "../fields/ThumbField";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { UploadUtils } from "../utils/UploadUtils";
import { Slugs } from "./Slugs";
const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Videos);
const Videos: CollectionConfig = {
  slug: Slugs.Videos,
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
    staticURL: "/uploads/videos",
    staticDir: UploadUtils.GetStaticDir("videos"),
    mimeTypes: ["video/x-msvideo", "video/*"],
    filesRequiredOnCreate: false,
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
    {
      name: "body",
      type: "richText",
      localized: true,
    },
    {
      name: "externalURL",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Video-on-Demand", value: "vod" },
        { label: "Live", value: "live" },
      ],
      hasMany: false,
    },
    RelatedItemsField.Get(),
    AuthorField.Get(),
    PublishDateField.Get(),
    IsPrivateField.Get(),
    CopyrightField.Get(),
    SlugField.Get(),
    OwnerField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default Videos;

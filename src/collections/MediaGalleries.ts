import { CollectionConfig } from "payload/types";
import { Slugs } from "./Slugs";
import { AccessUtils } from "../utils";
import {
  TitleField,
  ThumbField,
  TagsField,
  SummaryField,
  SlugField,
  IsPrivateField,
  PublishDateField,
  AuthorField,
  CopyrightField,
} from "../fields";
import { bySlugEndpoints } from "../endpoints";
import { CollectionUtils } from "../utils/CollectionUtils";
const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.MediaGalleries);
const MediaGalleries: CollectionConfig = {
  slug: Slugs.MediaGalleries,
  access: {
    ...access.GetReadWithWheres([
      access.GetPublishDateWhere(),
      access.GetIsPrivateWhere(),
    ]),
    ...access.GetEdit(),
  },
  versions: {
    drafts: true,
  },
  admin: {
    ...collectionUtils.GeneratePreviewConfig(),
    useAsTitle: TitleField.Name,
    defaultColumns: [
      TitleField.Name,
      IsPrivateField.Name,
      PublishDateField.Name,
      SlugField.Name,
      TagsField.Name,
      "status",
    ],
    listSearchableFields: [SlugField.Name],
    group: "Content",
  },
  fields: [
    TitleField.Get(),
    ThumbField.Get(),
    TagsField.Get(),
    SummaryField.Get(),
    {
      name: "relatedMedia",
      type: "relationship",
      relationTo: [Slugs.Media, Slugs.Videos],
      hasMany: true,
    },
    AuthorField.Get(),
    PublishDateField.Get(),
    IsPrivateField.Get(),
    CopyrightField.Get(),
    SlugField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default MediaGalleries;

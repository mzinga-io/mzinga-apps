import { CollectionConfig } from "mzinga/types";
import { bySlugEndpoints } from "../endpoints";
import {
  AuthorField,
  CopyrightField,
  IsPrivateField,
  PublishDateField,
  SlugField,
  SummaryField,
  TagsField,
  ThumbField,
  TitleField,
} from "../fields";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { Slugs } from "./Slugs";
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

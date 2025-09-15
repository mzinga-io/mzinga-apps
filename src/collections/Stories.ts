import { CollectionConfig } from "mzinga/types";
import { SlugField, SummaryField, TagsField } from "../fields";
import { AccessUtils } from "../utils";
import { Slugs } from "./Slugs";

import ContentBlock from "../blocks/ContentBlock";
import { FormBlock } from "../blocks/FormBlock";
import { MediaBlock } from "../blocks/MediaBlock";
import { oEmbedBlock } from "../blocks/oEmbedBlock";
import { bySlugEndpoints, oEmbedEndpoints } from "../endpoints";
import {
  AuthorField,
  CopyrightField,
  IsPrivateField,
  PublishDateField,
  RelatedItemsField,
  ThumbField,
  TitleField,
} from "../fields";
import { ContentBlockHooks } from "../hooks/ContentBlockHooks";
import { CollectionUtils } from "../utils/CollectionUtils";
const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Stories);
const Stories: CollectionConfig = {
  slug: Slugs.Stories,
  hooks: {
    beforeChange: [].concat(ContentBlockHooks.beforeChange),
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
  access: {
    ...access.GetReadWithWheres([
      access.GetPublishedStatusWhere(),
      access.GetPublishDateWhere(),
      access.GetIsPrivateWhere(),
    ]),
    ...access.GetEdit(),
  },
  // versioning with drafts enabled tells Payload to save documents to a separate collection in the database and allow publishing
  versions: {
    drafts: true,
  },
  fields: [
    TitleField.Get(),
    ThumbField.Get(),
    TagsField.Get(),
    SummaryField.Get(),
    {
      name: "body",
      type: "blocks",
      minRows: 1,
      required: true,
      localized: true,
      blocks: [ContentBlock, MediaBlock, oEmbedBlock, FormBlock],
    },
    RelatedItemsField.Get(),
    AuthorField.Get(),
    PublishDateField.Get(),
    IsPrivateField.Get(),
    CopyrightField.Get(),
    SlugField.Get(),
  ],
  endpoints: [].concat(oEmbedEndpoints, bySlugEndpoints),
};
export default Stories;

import { CollectionConfig } from "mzinga/types";
import { ConfigLoader } from "../configs/ConfigLoader";
import { bySlugEndpoints } from "../endpoints";
import { SlugField } from "../fields";
import { IsPrivateField } from "../fields/IsPrivateField";
import { PublishDateField } from "../fields/PublishDateField";
import { ThumbField } from "../fields/ThumbField";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { EnvUtils } from "../utils/EnvUtils";
import { Slugs } from "./Slugs";
const Env = ConfigLoader.LoadEnv();
const myselfSlug = Slugs.GetCollections();
const collectionUtils = new CollectionUtils(myselfSlug);
const overrideRelationTo = (Env.PAYLOAD_PUBLIC_COLLECTIONS_RELATION_TO || "")
  .split(",")
  .filter((r) => Boolean(r));

const relationTo = overrideRelationTo?.length
  ? overrideRelationTo
  : (Env.PAYLOAD_PUBLIC_COLLECTIONS_ADDITIONAL_RELATION_TO || "")
      .split(",")
      .concat([
        Slugs.Stories,
        Slugs.Alerts,
        Slugs.Files,
        Slugs.Media,
        Slugs.Videos,
        Slugs.MediaGalleries,
      ])
      .filter((r) => Boolean(r));
const access = new AccessUtils();
const Collections: CollectionConfig = {
  slug: myselfSlug,
  labels: {
    plural: Env.PAYLOAD_PUBLIC_COLLECTIONS_LABELS_PLURAL || myselfSlug,
    singular: Env.PAYLOAD_PUBLIC_COLLECTIONS_LABELS_SINGULAR || myselfSlug,
  },
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
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    ThumbField.Get(),
    {
      name: "summary",
      type: "textarea",
      localized: true,
      required: true,
    },
    {
      name: "items",
      type: "relationship",
      relationTo: relationTo,
      localized: true,
      required: true,
      hasMany: true,
      admin: {
        isSortable: true,
        allowCreate: EnvUtils.GetAsBoolean(
          Env.PAYLOAD_PUBLIC_COLLECTIONS_ITEMS_ALLOW_CREATE
        ),
      },
    },
    PublishDateField.Get(),
    IsPrivateField.Get(),
    SlugField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default Collections;

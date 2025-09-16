import { CollectionConfig } from "mzinga/types";
import { bySlugEndpoints } from "../endpoints";
import { IsPrivateField } from "../fields/IsPrivateField";
import { PublishDateField } from "../fields/PublishDateField";
import { ThumbField } from "../fields/ThumbField";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { Slugs } from "./Slugs";
const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Alerts);
const Alerts: CollectionConfig = {
  slug: Slugs.Alerts,
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
    defaultColumns: ["title", PublishDateField.Name, IsPrivateField.Name],
    group: "Notifications",
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
      name: "alertType",
      type: "relationship",
      relationTo: Slugs.AlertTypes,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "content",
      type: "textarea",
      maxLength: 150,
      localized: true,
      required: true,
    },
    {
      name: "destinationURL",
      type: "text",
    },
    PublishDateField.Get(),
    IsPrivateField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default Alerts;

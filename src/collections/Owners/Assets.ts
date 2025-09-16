import { CollectionConfig } from "mzinga/types";
import { ByField } from "../../fields";
import { AccessUtils } from "../../utils";
import { UploadUtils } from "../../utils/UploadUtils";
import { Slugs } from "../Slugs";
const access = new AccessUtils();
const Assets: CollectionConfig = {
  slug: Slugs.Assets,
  access: access.GetIsAdminOrBy(),
  admin: {
    group: "Owners",
  },
  fields: [ByField.Get()],
  upload: {
    adminThumbnail: "thumbnail",
    staticURL: "/uploads/assets",
    staticDir: UploadUtils.GetStaticDir("assets"),
    mimeTypes: ["image/png", "image/jpeg"],
    crop: false,
    focalPoint: false,
  },
};
export default Assets;

import type { CollectionConfig } from "mzinga/types";

import { ConfigLoader } from "../configs/ConfigLoader";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { EnvUtils } from "../utils/EnvUtils";
import { RolesUtils } from "../utils/RolesUtils";
import { Media } from "./Media";
import { Slugs } from "./Slugs";
const Env = ConfigLoader?.LoadEnv() || {};

const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Users);
const Users: CollectionConfig = {
  slug: Slugs.Users,
  auth: {
    // useAPIKey will add a generated token visible to the user in the admin UI that can then be used to make API requests
    useAPIKey: true,
    ...(EnvUtils.GetAsBoolean(Env["PAYLOAD_PUBLIC_DISABLE_LOCAL_STRATEGY"])
      ? { disableLocalStrategy: true }
      : {}),
  },
  admin: {
    ...collectionUtils.GeneratePreviewConfig(),
    useAsTitle: "email",
    group: "Admin",
  },
  access: {
    ...access.GetIsAdminOrSelf(),
  },
  fields: [
    {
      name: "email",
      type: "email",
      admin: {
        readOnly: true,
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          required: true,
          admin: {
            width: "50%",
          },
        },
        {
          name: "lastName",
          type: "text",
          required: true,
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      name: "twitter",
      type: "text",
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Changes will reflect at next login operation",
      },
    },
    {
      name: "photo_url",
      type: "text",
      saveToJWT: true,
      hidden: true,
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (!data.photo) {
              return;
            }
            const media = await req.payload.findByID({
              collection: Slugs.Media,
              id: data.photo,
            });
            if (!media) {
              return;
            }
            const _sizes = media.sizes as any;
            if (_sizes?.profile) {
              return _sizes.profile.url;
            }
            if (_sizes?.thumbnail) {
              return _sizes.thumbnail.url;
            }
            return media.url;
          },
        ],
      },
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["public"],
      required: true,
      saveToJWT: true,
      access: {
        ...access.GetIsAdminOrSelfFieldLevel(),
      },
      options: RolesUtils.GetRolesFieldOptions(Env, [
        "admin",
        "public",
        "mzinga-owner",
      ]),
    },
  ],
};

export default Users;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  twitter?: string;
  photo?: string | Media;
  roles: string[];
  email?: string;
  resetPasswordToken?: string;
  resetPasswordExpiration?: string;
  loginAttempts?: number;
  lockUntil?: string;
  createdAt: string;
  updatedAt: string;
}

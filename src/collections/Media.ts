import { CollectionConfig } from "payload/types";
import { Slugs } from "./Slugs";
import { SlugField, TagsField } from "../fields";
import { AccessUtils } from "../utils";
import { PublishDateField } from "../fields/PublishDateField";
import { IsPrivateField } from "../fields/IsPrivateField";
import { CopyrightField } from "../fields/CopyrightField";
import { UploadUtils } from "../utils/UploadUtils";
import { bySlugEndpoints } from "../endpoints";
import { OwnerField } from "../fields/OwnerField";
import { CollectionUtils } from "../utils/CollectionUtils";
import pictureHelper from "../utils/pictureHelper";

const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Media);
const Media: CollectionConfig = {
  slug: Slugs.Media,
  access: {
    ...access.GetReadWithWheres([
      access.GetPublishDateWhere(),
      access.GetIsPrivateWhere(),
    ]),
    ...access.GetEdit(),
  },
  // versioning with drafts enabled tells Payload to save documents to a separate collection in the database and allow publishing
  versions: {
    drafts: true,
  },
  admin: {
    ...collectionUtils.GeneratePreviewConfig(),
    useAsTitle: "filename",
    defaultColumns: [
      "filename",
      PublishDateField.Name,
      IsPrivateField.Name,
      SlugField.Name,
    ],
    listSearchableFields: [SlugField.Name],
    group: "Content",
    preview: pictureHelper.GetPreview,
  },
  upload: {
    adminThumbnail: "thumbnail",
    staticURL: "/uploads/media",
    staticDir: UploadUtils.GetStaticDir("media"),
    mimeTypes: ["image/png", "image/jpeg"],
    imageSizes: [
      {
        name: "thumbnail",
        width: 480,
        height: 320,
      },
      {
        name: "portrait",
        width: 768,
        height: 1024,
      },
      {
        name: "hero",
        width: 1920,
        height: 1080,
      },
      {
        name: "profile",
        width: 100,
        height: 100,
      },
    ],
  },

  fields: [
    {
      name: "alt",
      label: "Alt Text",
      localized: true,
      type: "text",
      required: true,
    },
    {
      name: "fit",
      label: "Fit resizing modes (preserve aspect ratio)",
      type: "select",
      localized: false,
      defaultValue: "cover",
      required: true,
      hasMany: false,
      unique: false,
      options: [
        {
          label:
            "cover - Resizes (shrinks or enlarges) to fill the entire area of width and height. If the image has an aspect ratio different from the ratio of width and height, it will be cropped to fit",
          value: "cover",
        },
        {
          label:
            "crop - Image will be shrunk and cropped to fit within the area specified by width and height. The image will not be enlarged",
          value: "crop",
        },
        {
          label:
            "scale-down - If the image is larger than given width or height, it will be resized. Otherwise its original size will be kept",
          value: "scale-down",
        },
        {
          label:
            "contain - Image will be resized (shrunk or enlarged) to be as large as possible within the given width or height while preserving the aspect ratio",
          value: "contain",
        },
        {
          label:
            "pad - Resizes to the maximum size that fits within the given width and height, and then fills the remaining area with a background color (white by default)",
          value: "pad",
        },
      ],
    },
    {
      name: "gravity",
      label:
        "Gravity for resizing modes: values can be 'auto' (automatic detection) or N.NxN.N , coordinates specified on a scale from 0.0 (top or left) to 1.0 (bottom or right), 0.5 being the center; the X and Y coordinates are separated by lowercase x. For example, 0x1 means left and bottom, 0.5x0.5 is the center, 0.5x0.33 is a point in the top third of the image",
      type: "text",
      localized: false,
      defaultValue: "auto",
      required: true,
      unique: false,
      minLength: 4,
      maxLength: 7,
    },
    {
      name: "trim",
      label:
        "Pixels to cut off on each side - use as four numbers in pixels separated by a semicolon, in the form of top;right;bottom;left",
      type: "text",
      localized: false,
      defaultValue: "0;0;0;0",
      required: true,
      unique: false,
      minLength: 7,
      maxLength: 15,
    },
    {
      name: "background",
      label:
        "Background color to add underneath the image. Applies to images with transparency (for example, PNG) and images resized with fit=pad.",
      type: "text",
      localized: false,
      defaultValue: "transparent",
      required: true,
      unique: false,
      minLength: 1,
      maxLength: 20,
    },
    {
      name: "rotate",
      label: "Number of degrees (0, 90, 180, or 270) to rotate the image by",
      type: "select",
      localized: false,
      defaultValue: "0",
      required: true,
      hasMany: false,
      unique: false,
      options: [
        {
          label: "none",
          value: "0",
        },
        {
          label: "90",
          value: "90",
        },
        {
          label: "180",
          value: "180",
        },
        {
          label: "270",
          value: "270",
        },
      ],
    },
    {
      name: "previewFormat",
      label:
        "Format to be used for the Preview Button (you must save to apply the change on the preview)",
      type: "select",
      localized: false,
      defaultValue: "original",
      required: true,
      hasMany: false,
      unique: false,
      options: [
        {
          label: "original",
          value: "original",
        },
        {
          label: "hero",
          value: "hero",
        },
        {
          label: "portrait",
          value: "portrait",
        },
        {
          label: "thumbnail",
          value: "thumbnail",
        },
      ],
    },
    PublishDateField.Get(),
    IsPrivateField.Get(),
    TagsField.Get(),
    CopyrightField.Get(),
    SlugField.Get(),
    OwnerField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default Media;

export interface Media {
  id: string;
  alt: string;
  darkModeFallback?: string | Media;
  url?: string;
  filename?: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  fit?: string;
  gravity?: string;
  trim?: string;
  rotate?: string;
  createdAt: string;
  updatedAt: string;
}

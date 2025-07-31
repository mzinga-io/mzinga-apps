import type { FieldBase } from "payload/types";
import Users from "../../../src/collections/Users";

describe("collections", () => {
  describe("Users", () => {
    const photoUrlField = Users.fields.find((field) => {
      return (field as any).name === "photo_url";
    });
    const profileUrl = "http://my-profile-url.com";
    const thumbUrl = "http://my-thumb-url.com";
    const mediaUrl = "http://my-media-url.com";

    it("photo_url.hooks.beforeChange should return undefined for falsy data.photo", async () => {
      const result = await (photoUrlField as any).hooks.beforeChange[0]({
        data: {},
      });
      expect(result).toBeUndefined();
    });
    it("photo_url.hooks.beforeChange should return undefined for not-found data.photo", async () => {
      const result = await (photoUrlField as any).hooks.beforeChange[0]({
        data: {
          photo: "https://my-photo.com",
        },
        req: {
          payload: {
            findByID: function () {
              return undefined;
            },
          },
        },
      });
      expect(result).toBeUndefined();
    });
    it("photo_url.hooks.beforeChange should return media.sizes.profile.url for the found data.photo", async () => {
      const result = await (photoUrlField as any).hooks.beforeChange[0]({
        data: {
          photo: "https://my-photo.com",
        },
        req: {
          payload: {
            findByID: function () {
              return {
                sizes: {
                  profile: {
                    url: profileUrl,
                  },
                  thumbnail: thumbUrl,
                },
                url: mediaUrl,
              };
            },
          },
        },
      });
      expect(result).toBe(profileUrl);
    });
    it("photo_url.hooks.beforeChange should return media.sizes.thumbnail.url for the found data.photo", async () => {
      const result = await (photoUrlField as any).hooks.beforeChange[0]({
        data: {
          photo: "https://my-photo.com",
        },
        req: {
          payload: {
            findByID: function () {
              return {
                sizes: {
                  profile: null,
                  thumbnail: {
                    url: thumbUrl,
                  },
                },
                url: mediaUrl,
              };
            },
          },
        },
      });
      expect(result).toBe(thumbUrl);
    });
    it("photo_url.hooks.beforeChange should return media.url for the found data.photo", async () => {
      const expectedResult = "http://my-thumb-url.com";
      const result = await (photoUrlField as any).hooks.beforeChange[0]({
        data: {
          photo: "https://my-photo.com",
        },
        req: {
          payload: {
            findByID: function () {
              return {
                sizes: {
                  profile: null,
                  thumbnail: null,
                },
                url: mediaUrl,
              };
            },
          },
        },
      });
      expect(result).toBe(mediaUrl);
    });
  });
});

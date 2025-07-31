import { AccessUtils } from "../../../src/utils/AccessUtils";
import type { PayloadRequest } from "payload/types";

describe("utils", () => {
  describe("AccessUtils", () => {
    const accessUtils = new AccessUtils();
    const user = {
      id: "test",
      firstName: "test",
      lastName: "test",
      roles: ["admin"],
    };
    const args = {
      req: {
        user: {
          ...user,
          collection: "users",
        },
      } as PayloadRequest,
    };
    it("GetIsAdmin|GetIsAdminFieldLevelAccess should return 'false' for non valid input", () => {
      let invalidInput = {
        req: { user: undefined } as PayloadRequest,
      };
      expect(accessUtils.GetIsAdminFieldLevelAccess(invalidInput))
        .toBeUndefined;
      expect(accessUtils.GetIsAdmin(invalidInput)).toBeUndefined;
      invalidInput = {
        req: {
          user: { roles: undefined },
        } as PayloadRequest,
      };
      expect(accessUtils.GetIsAdminFieldLevelAccess(invalidInput))
        .toBeUndefined;
      expect(accessUtils.GetIsAdmin(invalidInput)).toBeUndefined;
    });
    it("GetIsAdmin|GetIsAdminFieldLevelAccess should return 'true' for 'admin' role", () => {
      expect(accessUtils.GetIsAdminFieldLevelAccess(args)).toBe(true);
      expect(accessUtils.GetIsAdmin(args)).toBe(true);
    });
    it("GetIsAdminOrSelfAccess should return 'true' for 'admin' role", () => {
      expect(accessUtils.GetIsAdminOrSelfAccess(args)).toBe(true);
    });
    it("GetIsAdminOrSelfAccess should return 'false' for invalid input", () => {
      expect(
        accessUtils.GetIsAdminOrSelfAccess({
          req: { user: undefined } as PayloadRequest,
        })
      ).toBe(false);
      expect(
        JSON.stringify(
          accessUtils.GetIsAdminOrSelfAccess({
            req: { user: { id: 42, roles: undefined } } as PayloadRequest,
          })
        )
      ).toBe(
        JSON.stringify({
          id: {
            equals: 42,
          },
        })
      );
    });
    it("GetIsAdminOrSelfAccess should return 'where' condition for self-check", () => {
      expect(
        (
          accessUtils.GetIsAdminOrSelfAccess({
            ...args,
            req: {
              user: {
                ...user,
                roles: ["public"],
              },
            } as PayloadRequest,
          }) as any
        ).id.equals
      ).toBe(user.id);
    });
    it("GetIsAdminOrByAccess should return 'true' for 'admin' role", () => {
      expect(accessUtils.GetIsAdminOrByAccess(args)).toBe(true);
    });
    it("GetIsAdminOrByAccess should return 'false' for invalid input", () => {
      expect(
        accessUtils.GetIsAdminOrByAccess({
          req: { user: undefined } as PayloadRequest,
        })
      ).toBe(false);
      expect(
        JSON.stringify(
          accessUtils.GetIsAdminOrByAccess({
            req: { user: { id: 42, roles: undefined } } as PayloadRequest,
          })
        )
      ).toBe(
        JSON.stringify({
          by: {
            equals: 42,
          },
        })
      );
    });
    it("GetIsAdminOrByAccess should return 'where' condition for self-check", () => {
      expect(
        (
          accessUtils.GetIsAdminOrByAccess({
            ...args,
            req: {
              user: {
                ...user,
                roles: ["public"],
              },
            } as PayloadRequest,
          }) as any
        ).by.equals
      ).toBe(user.id);
    });
    it("GetIsAdminOrSelfFieldLevelAccess should return 'true' for 'admin' role", () => {
      expect(accessUtils.GetIsAdminOrSelfFieldLevelAccess(args)).toBe(true);
    });
    it("GetIsAdminOrSelfFieldLevelAccess should return 'false' for invalid input", () => {
      expect(
        accessUtils.GetIsAdminOrSelfFieldLevelAccess({
          ...args,
          id: "another-id",
          req: {
            user: undefined,
          } as PayloadRequest,
        })
      ).toBe(false);
      expect(
        accessUtils.GetIsAdminOrSelfFieldLevelAccess({
          ...args,
          req: {
            user: {
              ...args.req.user,
              roles: ["public"],
            },
          } as PayloadRequest,
          id: "another-id",
        })
      ).toBe(false);
    });
    it("IsEnabledIfAuth should return 'true' for valid input", () => {
      expect(
        accessUtils.IsEnabledIfAuth({
          id: "any-user",
        })
      ).toBe(true);
    });
    it("IsEnabledIfAuth should return 'false' for non valid input", () => {
      expect(accessUtils.IsEnabledIfAuth(null)).toBe(false);
    });
    it("GetReadAll should always return 'true'", () => {
      expect(accessUtils.GetReadAll().read(null)).toBe(true);
    });
    it("GetPublishedStatusWhere should always return 'published' status where condition", () => {
      expect(
        (accessUtils.GetPublishedStatusWhere() as any)._status.equals
      ).toBe("published");
    });
    it("GetPublishDateWhere should always return 'less_than' publishDate where condition", () => {
      expect(
        (accessUtils.GetPublishDateWhere() as any)().publishDate.less_than
      ).toBeDefined();
    });
    it("GetReadWithWheres should always return 'true' for authenticated user", () => {
      expect((accessUtils.GetReadWithWheres([]) as any).read(args)).toBe(true);
    });
    it("GetReadWithWheres should return 'where' condition for non authenticated user", () => {
      const readResult = (
        accessUtils.GetReadWithWheres([
          {
            customField: {
              equals: "this-is-a-test",
            },
          },
          () => {
            return {
              customFieldFromFn: {
                equals: "this-is-a-test-from-custom-fn",
              },
            };
          },
        ]) as any
      ).read({
        ...args,
        req: {} as PayloadRequest,
      });
      expect(readResult.and[0].customField.equals).toBe("this-is-a-test");
      expect(readResult.and[1].customFieldFromFn.equals).toBe(
        "this-is-a-test-from-custom-fn"
      );
    });
  });
});

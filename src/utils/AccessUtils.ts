import type {
  Access,
  CollectionConfig,
  FieldAccess,
  Where,
} from "payload/types";
import { User } from "../collections/Users";
import type { FieldBase } from "payload/dist/fields/config/types";

export class AccessUtils {
  GetIsAdmin: Access<any, User> = ({ req: { user } }) => {
    return user?.roles?.includes("admin");
  };

  GetIsAdminFieldLevelAccess: FieldAccess<{ id: string }, unknown, User> = ({
    req: { user },
  }) => {
    return user?.roles?.includes("admin");
  };

  GetIsAdminOrSelfAccess({ req: { user } }) {
    if (user) {
      if (user.roles?.includes("admin")) {
        return true;
      }
      return {
        id: {
          equals: user.id,
        },
      };
    }
    return false;
  }

  GetIsAdminOrByAccess({ req: { user } }) {
    if (user) {
      if (user.roles?.includes("admin")) {
        return true;
      }
      return {
        by: {
          equals: user.id,
        },
      };
    }
    return false;
  }

  GetIsAdminOrSelfFieldLevelAccess: FieldAccess = ({ req: { user }, id }) => {
    if (user?.roles?.includes("admin")) {
      return true;
    }
    return user?.id === id;
  };

  GetIsAdminOnly(
    customAccessIsAdminOnly?: CollectionConfig["access"]
  ): CollectionConfig["access"] {
    return {
      create: this.GetIsAdmin,
      read: this.GetIsAdmin,
      update: this.GetIsAdmin,
      delete: this.GetIsAdmin,
      ...customAccessIsAdminOnly,
    };
  }
  GetIsAdminOrSelf(
    customAccessIsAdminOrSelf?: CollectionConfig["access"]
  ): CollectionConfig["access"] {
    return {
      create: this.GetIsAdmin,
      read: this.GetIsAdminOrSelfAccess,
      readVersions: this.GetIsAdminOrSelfAccess,
      update: this.GetIsAdminOrSelfAccess,
      delete: this.GetIsAdminOrSelfAccess,
      ...customAccessIsAdminOrSelf,
    };
  }
  GetIsAdminOrBy(
    customAccessIsAdminOrBy?: CollectionConfig["access"]
  ): CollectionConfig["access"] {
    return {
      create: this.GetIsAdminOrByAccess,
      read: this.GetIsAdminOrByAccess,
      readVersions: this.GetIsAdminOrByAccess,
      update: this.GetIsAdminOrByAccess,
      delete: this.GetIsAdminOrByAccess,
      unlock: this.GetIsAdmin,
      ...customAccessIsAdminOrBy,
    };
  }
  GetIsAdminOrSelfFieldLevel(
    customAccessIsAdminOrSelfFieldLevel?: FieldBase["access"]
  ): FieldBase["access"] {
    return {
      read: this.GetIsAdminOrSelfFieldLevelAccess,
      create: this.GetIsAdminFieldLevelAccess,
      update: this.GetIsAdminFieldLevelAccess,
      ...customAccessIsAdminOrSelfFieldLevel,
    };
  }
  IsEnabledIfAuth(user?: User | Partial<User>): boolean {
    return Boolean(user);
  }
  GetEdit(
    customAccessEdit?: CollectionConfig["access"]
  ): CollectionConfig["access"] {
    return {
      create: ({ req: { user } }) => this.IsEnabledIfAuth(user),
      update: ({ req: { user } }) => this.IsEnabledIfAuth(user),
      delete: ({ req: { user } }) => this.IsEnabledIfAuth(user),
      ...customAccessEdit,
    };
  }
  GetReadAll(): CollectionConfig["access"] {
    return {
      read: () => true,
    };
  }
  GetPublishedStatusWhere(): Where {
    return {
      _status: {
        equals: "published",
      },
    };
  }
  GetPublishDateWhere(): Function {
    return () => {
      return {
        publishDate: {
          less_than: new Date().toJSON(),
        },
      };
    };
  }
  GetIsPrivateWhere(): Where {
    return {
      or: [
        {
          isPrivate: {
            exists: true,
            equals: false,
          },
        },
        {
          isPrivate: {
            exists: false,
          },
        },
      ],
    };
  }

  GetReadWithWheres(
    wheres: (Where | Function)[],
    customAccess?: CollectionConfig["access"]
  ): CollectionConfig["access"] {
    return {
      read: ({ req: { user } }) => {
        if (user) {
          return true;
        }
        const expandedWheres = wheres.map((w) => {
          if (typeof w === "function") {
            return w();
          }
          return w;
        });
        return {
          and: expandedWheres,
        };
      },
      ...customAccess,
    };
  }

  AdminOrMineFilterOptions({ user }) {
    if (user?.roles?.includes("admin")) {
      return true;
    }
    return {
      by: {
        equals: user?.id,
      },
    };
  }
}

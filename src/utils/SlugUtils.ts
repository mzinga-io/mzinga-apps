export const SlugUtils = {
  IsValidSlug(slug: string): boolean {
    return this.Slugify(slug) === slug;
  },
  Slugify(value: string) {
    return value
      ? value
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-")
      : "";
  },
  GetValidSlugs(slug: string | object | Function): string {
    if (typeof slug === "object") {
      return null;
    }
    if (typeof slug === "function") {
      return slug();
    }
    return slug;
  },
};

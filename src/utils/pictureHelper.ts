function pictureHelper() {
  const Transform = (
    url: string,
    width: number,
    height: number,
    gravity: string,
    fit: string,
    rotate: string,
    trim: string,
    background: string
  ): string => {
    return url.replace(
      "/uploads/media",
      `/cdn-cgi/image/h=${height},w=${width},g=${gravity},fit=${fit},rotate=${rotate},trim=${trim},background=${background}/uploads/media`
    );
  };
  const TransformMedia = (media: any, size: any): string => {
    const picture = { width: 500, height: 500 };
    if (size === "original") {
      picture.width = media.width;
      picture.height = media.height;
    } else if (media.sizes[size].width && media.sizes[size].height) {
      picture.width = media.sizes[size].width;
      picture.height = media.sizes[size].height;
    } else if (size === "hero") {
      picture.width = 1920;
      picture.height = 1080;
    } else if (size === "portrait") {
      picture.width = 768;
      picture.height = 1024;
    } else if (size === "thumbnail") {
      picture.width = 480;
      picture.height = 320;
    }
    return Transform(
      media.url,
      picture.width,
      picture.height,
      media.gravity,
      media.fit,
      media.rotate,
      media.trim,
      media.background
    );
  };
  const GetPreview = (doc) => {
    if (doc.previewFormat) {
      return TransformMedia(doc, doc.previewFormat);
    }
    return null;
  };
  return {
    Transform,
    TransformMedia,
    GetPreview,
  };
}
export default pictureHelper();

import https from "https";
import { MZingaLogger } from "../utils/MZingaLogger";
export const oEmbedEndpoints = [
  {
    method: "get",
    path: "/oembed",
    handler: async function (req, res) {
      const {
        user,
        query: { url },
      } = req;
      if (!user) {
        res.status(401);
        return;
      }
      if (!url) {
        res.status(400);
      }
      const _url = (url as string) || "";
      let requestUrl = `https://publish.twitter.com/oembed?hide_thread=true&align=center&url=${encodeURIComponent(
        _url
      )}&limit=3`;
      if (_url.indexOf("vimeo.com") > -1) {
        requestUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
          _url
        )}&width=480&height=360`;
      }
      if (_url.indexOf("flickr.com") > -1) {
        requestUrl = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(
          _url
        )}`;
      }
      if (_url.indexOf("youtube.com") > -1) {
        requestUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
          _url
        )}&maxwidth=640&maxheight=400`;
      }
      https
        .get(requestUrl, (httpsRes) => {
          if (httpsRes.statusCode !== 200) {
            res.status(500);
            return;
          }
          httpsRes.setEncoding("utf8");

          const chunks = [] as any[];

          httpsRes.on("data", (data) => {
            chunks.push(data);
          });
          httpsRes.on("end", () => {
            const body = chunks.join("");
            res.json(JSON.parse(body));
          });
        })
        .on("error", (e) => {
          MZingaLogger.Instance?.error(e);
          res.status(500);
        });
    },
  },
];

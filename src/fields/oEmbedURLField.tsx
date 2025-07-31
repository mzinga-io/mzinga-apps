import React, { useState, useEffect } from "react";
import { useFormFields } from "payload/components/forms";

const externalScriptsRe = new RegExp(
  /<script.*src=\"([\S]*)\".*>.*<\/script>/gi
);
declare type oEmbedResponse = {
  url: string;
  title?: string;
  html: string;
  sanitized_html: string;
  width?: number;
  height?: number;
  type?: string;
  provider_name: string;
  provider_url: string;
  version?: string;
};
const loadScript = (d, s, id, onFound, onLoad?) => {
  const fjs = d.getElementsByTagName("script")[0];
  let found = undefined;
  if (!id) {
    found = document.querySelector(`script[src*="${s}"]`);
  }
  if (!found) {
    found = d.getElementById(id);
  }
  if (found) {
    return (onFound || function () {})(found);
  }
  const js = d.createElement("script");
  js.id = id;
  js.src = s;
  (fjs as any).parentNode.insertBefore(js, fjs);
  return (onLoad || function () {})();
};
export default function oEmbedURLField({ path }) {
  const oEmbedURL = useFormFields(([fields]) => fields[`${path}.oEmbedURL`]);
  if (!(oEmbedURL && oEmbedURL.value)) {
    return null;
  }
  (window as any).twttr = loadScript(
    document,
    "https://platform.twitter.com/widgets.js",
    "twitter-wjs",
    () => {
      ((window as any).twttr || {}).ready = function () {
        (window as any).twttr.widgets.load();
      };
    },
    () => {
      const t = (window as any).twttr || {};
      t._e = [];
      t.ready = function (f) {
        t._e.push(f);
      };
    }
  );

  const [apiResponse, setApiResponse] = useState(
    null as unknown as oEmbedResponse
  );
  useEffect(() => {
    const getApiResponse = async () => {
      const oEmbedResponse = (await (
        await fetch(
          `/api/stories/oembed?url=${encodeURIComponent(
            oEmbedURL.value as string
          )}`
        )
      ).json()) as oEmbedResponse;
      externalScriptsRe.lastIndex = 0;
      const reExec = externalScriptsRe.exec(oEmbedResponse.html);
      if (reExec && reExec.length) {
        oEmbedResponse.sanitized_html = oEmbedResponse.html.replace(
          reExec[0],
          ""
        );
        if (reExec[1]) {
          loadScript(document, reExec[1], null, (found) => {
            document.removeChild(found);
          });
        }
      } else {
        oEmbedResponse.sanitized_html = oEmbedResponse.html;
      }
      setApiResponse(oEmbedResponse);
    };
    getApiResponse();
  }, [oEmbedURL.value]);
  return (
    apiResponse && (
      <div>
        <label className="field-label">Preview</label>
        <div
          dangerouslySetInnerHTML={{ __html: apiResponse.sanitized_html }}
        ></div>
      </div>
    )
  );
}

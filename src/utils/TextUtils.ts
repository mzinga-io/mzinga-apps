import type { FormattedEmail } from "@mzinga/plugin-form-builder/dist/types";
import escapeHTML from "escape-html";
import { Text } from "slate";

type Node = {
  bold?: boolean;
  code?: boolean;
  italic?: boolean;
  type?: string;
  url?: string;
  newTab?: boolean;
  linkType?: string;
  doc?: any;
  value?: any;
  children?: Node[];
};
export const TextUtils = {
  Serialize(children?: Node[]): string | undefined {
    return children
      ?.map((node: Node) => {
        if (Text.isText(node)) {
          const nodeText = node.text || "";
          if (nodeText !== nodeText.trim()) {
            return "&nbsp;";
          }
          if (!nodeText.trim()) {
            return null;
          }
          let text = `<span>${escapeHTML(nodeText).replace(
            /\n/gm,
            "<br/>",
          )}</span>`;

          if (node.bold) {
            text = `<strong>${text}</strong>`;
          }

          if (node.code) {
            text = `<code>${text}</code>`;
          }

          if (node.italic) {
            text = `<em>${text}</em>`;
          }

          return text;
        }

        if (!node) {
          return null;
        }
        if (node.type === "upload" && node.value.url) {
          return `<p><a href="${node.value.url}">${
            node.value.title || node.value.url
          }</a></p>`;
        }
        const childrenText = TextUtils.Serialize(node.children);
        if (!childrenText) {
          return null;
        }
        switch (node.type) {
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            const hType = node.type.match(/h[\d]/);
            return `<${hType}>${childrenText}</${hType}>`;
          case "quote":
            return `<blockquote>${childrenText}</blockquote>`;
          case "ul":
            return `<ul>${childrenText}</ul>`;
          case "ol":
            return `<ol>${childrenText}</ol>`;
          case "li":
            return `<li>${childrenText}</li>`;
          case "indent":
            return `<p style="padding-left: 20px">${childrenText}</p>`;
          case "link":
            if (node.linkType === "internal") {
              return `<a data-doc-id="${node.doc?.value?.id}"${
                node.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""
              }>${childrenText}</a>`;
              ``;
            }
            return `<a href="${node.url}"${
              node.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""
            }>${childrenText}</a>`;
          case "upload":
            return `<p><a href="${node.value.url}">${node.value?.title}</a></p>`;
          default:
            return `<p>${childrenText}</p>`;
        }
      })
      .filter((x) => {
        return Boolean(x);
      })
      .join("");
  },
  GetInternalLinks(children?: Node[]): any[] | undefined {
    return children
      ?.map((node: Node) => {
        if (Text.isText(node)) {
          return null;
        }
        if (!node) {
          return null;
        }
        const childrenLinks = TextUtils.GetInternalLinks(node.children);
        if (!(node.type === "link" && node.linkType === "internal")) {
          return [].concat(childrenLinks || []);
        }
        return [].concat(childrenLinks || [], [node.doc]);
      })
      .filter(Boolean)
      .flat()
      .filter((c) => c);
  },
  FormatEmailHTML(email: FormattedEmail): FormattedEmail {
    const regex = new RegExp(/<a href=\{(.*)\}/gim);
    let m;
    while ((m = regex.exec(email.html))) {
      regex.lastIndex = 0;
      const fullMatch = m[0];
      const link = m[1];
      email.html = email.html.replace(fullMatch, `<a href="${link}"`);
    }
    email.html = email.html
      .replace(/\\n/gm, "")
      .replace(/\s+/gm, " ")
      .replace(/(?<=>)\s+(?=<)/gm, ""); // remove spaces between tags
    return email;
  },
};

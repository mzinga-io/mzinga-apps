import dataMock from "../../../__mocks__/dataMock";
import { TextUtils } from "../../../src/utils/TextUtils";
describe("utils", () => {
  describe("TextUtils", () => {
    describe("Formattings", () => {
      const formattingsResult = TextUtils.Serialize(
        dataMock.TextUtils.formattingText as any,
      );
      it("Should return headings tags", () => {
        expect(formattingsResult).toContain("<h1><span>sample_h1</span></h1>");
      });
      it("Should return bold tags", () => {
        expect(formattingsResult).toContain(
          "<strong><span>sample_bold</span></strong>",
        );
      });
      it("Should return 'code' tags", () => {
        expect(formattingsResult).toContain(
          "<code><span>sample_code</span></code>",
        );
      });
      it("Should return 'em' tags", () => {
        expect(formattingsResult).toContain(
          "<em><span>sample_italic</span></em>",
        );
      });
      it("Should return <br/> tag instead of \\n char", () => {
        expect(formattingsResult).toContain(
          `<span>sample_with<br/>_breaking_line</span>`,
        );
      });
      it("Should return <br/> tag instead of \\n char (even with multiline)", () => {
        expect(formattingsResult).toContain(
          `<span>sample_with<br/><br/>        _multiple<br/><br/><br/>        _breaking<br/>_line</span>`,
        );
      });
      it("Should return 'blockquote' tags", () => {
        expect(formattingsResult).toContain(
          "<blockquote><span>sample_quote</span></blockquote>",
        );
      });
      it("Should return indented p", () => {
        expect(formattingsResult).toContain(
          '<p style="padding-left: 20px"><span>sample_indent</span></p>',
        );
      });
      it("Should return custom link", () => {
        expect(formattingsResult).toContain(
          '<a href="https://github.com/"><span>sample_link</span></a>',
        );
      });
      it("Should return copied link", () => {
        expect(formattingsResult).toContain(
          '<a href="https://copied-link.com/"><span>copied_link</span></a>',
        );
      });
      it("Should return 'ul' with 'li'", () => {
        expect(formattingsResult).toContain(
          "<ul><li><span>sample_ul_li</span></li></ul>",
        );
      });
      it("Should return 'ol' with 'li'", () => {
        expect(formattingsResult).toContain(
          "<ol><li><span>sample_ol_li</span></li></ol>",
        );
      });
    });
    it("Should serialize content to html", () => {
      const result = TextUtils.Serialize(dataMock.TextUtils.richText as any);
      expect(result).toMatch(/<\/?[a-z][\s\S]*>/i);
    });
    it("Should return list of docs for internal links", () => {
      const result = TextUtils.GetInternalLinks(
        dataMock.TextUtils.richText as any,
      );
      expect(result).toHaveLength(1);
      if (result?.length) {
        expect(result[0].value.id).toBe("63fc6a65d3ba75978a04509e");
      }
    });
    it("should serialize content and keep white-spaces", () => {
      const result = TextUtils.Serialize(dataMock.TextUtils.richText as any);
      expect(result).toContain(
        'Write to</span></strong>&nbsp;<a href="mailto:',
      );
    });
    it("Should return data-doc-id attribute for cross-reference", () => {
      const result = TextUtils.Serialize(dataMock.TextUtils.richText as any);
      expect(result).toContain('<a data-doc-id="63fc6a65d3ba75978a04509e">');
    });
    it("Should return 'link' to related item", () => {
      const result = TextUtils.Serialize(dataMock.TextUtils.richText as any);
      expect(result).toContain(
        '<a href="http://my-backoffice.com/uploads/files/template_ppt.pptx">',
      );
    });
    it("Should format email content to html", () => {
      console.log(dataMock.TextUtils.formattedEmail);
      const result = TextUtils.FormatEmailHTML(
        dataMock.TextUtils.formattedEmail as any,
      );
      expect(result.html).toContain('<a href="https://www.mzinga.io"><span');
    });
  });
});

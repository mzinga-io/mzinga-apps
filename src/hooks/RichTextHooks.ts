import { TextUtils } from "../utils/TextUtils";

export class RichTextHooks {
  beforeChange: [({ data }: { data: any }) => Promise<any>];
  constructor(
    private readonly richTextProperty: string,
    private readonly richTextChildProperty: string
  ) {
    this.beforeChange = [
      async ({ data }) => {
        const propValue = data[this.richTextProperty];
        if (!propValue) {
          return data;
        }
        for (const part of propValue) {
          part.serialized = {
            html: TextUtils.Serialize(part[this.richTextChildProperty]),
            internalLinks: TextUtils.GetInternalLinks(
              part[this.richTextChildProperty]
            ),
          };
        }
        return data;
      },
    ];
  }
}

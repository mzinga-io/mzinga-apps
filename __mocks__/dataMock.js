module.exports = {
  ContentBlockHooks: {
    incomingPayload: {
      data: {
        id: "63fc6a56d3ba75978a045076",
        title: "sample",
        body: [
          {
            columns: [
              {
                width: "full",
                alignment: "left",
                richText: [
                  {
                    children: [
                      { text: "here's an external " },
                      {
                        type: "link",
                        linkType: "custom",
                        url: "https://www.google.com",
                        newTab: true,
                        children: [{ text: "link" }],
                      },
                      { text: "" },
                    ],
                  },
                  {
                    children: [
                      { text: "here's an " },
                      {
                        type: "link",
                        linkType: "internal",
                        doc: {
                          value: {
                            id: "63fc6a65d3ba75978a04509e",
                            title: "story as link",
                            body: [
                              {
                                columns: [
                                  {
                                    width: "full",
                                    alignment: "left",
                                    richText: [
                                      { children: [{ text: "hello" }] },
                                    ],
                                    serialized: {
                                      html: "<p><span>hello</span></p>",
                                    },
                                    id: "63fc6a6254a3d371cf6111be",
                                  },
                                ],
                                id: "63fc6a6154a3d371cf6111bd",
                                blockType: "content",
                              },
                            ],
                            author: {
                              id: "63fc6a3dd3ba75978a04504d",
                              firstName: "Alberto",
                              lastName: "Maghini",
                              roles: ["admin"],
                              enableAPIKey: false,
                              email: "a.maghini@gmail.com",
                              createdAt: "2023-02-27T08:30:53.719Z",
                              updatedAt: "2023-02-27T08:30:53.799Z",
                            },
                            publishDate: "2023-02-27T08:31:23.653Z",
                            isPrivate: false,
                            slug: "story-as-link",
                            _status: "published",
                            createdAt: "2023-02-27T08:31:33.066Z",
                            updatedAt: "2023-02-27T08:31:33.066Z",
                            meta: {},
                          },
                          relationTo: "stories",
                        },
                        children: [{ text: "internal link" }],
                      },
                      { text: "" },
                    ],
                  },
                  { children: [{ text: "" }] },
                  { children: [{ text: "" }] },
                ],
                serialized: {
                  html: '<p><span>here&#39;s an external</span><a href="https://www.google.com" target="_blank" rel="noopener noreferrer"><span>link</span></a></p><p><span>here&#39;s an</span><p><span>internal link</span></p></p>',
                },
                id: "63fc6a4554a3d371cf6111bc",
              },
            ],
            id: "63fc6a4454a3d371cf6111bb",
            blockType: "content",
          },
        ],
        author: {
          id: "63fc6a3dd3ba75978a04504d",
          firstName: "Alberto",
          lastName: "Maghini",
          roles: ["admin"],
          enableAPIKey: false,
          email: "a.maghini@gmail.com",
          createdAt: "2023-02-27T08:30:53.719Z",
          updatedAt: "2023-02-27T08:30:53.799Z",
        },
        publishDate: "2023-02-27T08:30:56.311Z",
        isPrivate: false,
        slug: "sample",
        _status: "published",
        createdAt: "2023-02-27T08:31:18.779Z",
        updatedAt: "2023-02-27T08:52:35.215Z",
        meta: {},
      },
    },
  },
  RichTextHooks: {
    incomingPayload: {
      data: {
        id: "63fc90d601f158f3d2fbe834",
        title: "new form",
        fields: [],
        confirmationType: "message",
        emails: [],
        publishDate: "2023-02-27T11:15:28.277Z",
        isPrivate: false,
        slug: "new-form",
        _status: "published",
        createdAt: "2023-02-27T11:15:34.395Z",
        updatedAt: "2023-02-27T15:30:50.815Z",
        confirmationMessage: [{ children: [{ text: "sample_text" }] }],
        emails: [
          {
            message: [
              {
                children: [
                  {
                    text: "Title text",
                  },
                ],
                type: "h2",
              },
              {
                children: [
                  {
                    text: "\Dear  {{name}} {{surname}}, ",
                  },
                ],
              },
              {
                children: [
                  {
                    text: "we're happy to confirm your registration",
                  },
                ],
              },
              {
                children: [
                  {
                    text: "You'll soon receive more info about the event schedule and the speakers. In the meantime, we suggest you ",
                  },
                  {
                    children: [
                      {
                        text: "insert the event among your favorites ",
                      },
                    ],
                    linkType: "custom",
                    type: "link",
                    url: "https://www.mzinga.io/",
                  },
                  {
                    text: " to not miss any updates.",
                  },
                ],
              },
            ],
          },
        ],
        redirect: {},
      },
    },
  },
  TextUtils: {
    formattingText: [
      {
        type: "h1",
        children: [{ text: "sample_h1" }],
      },
      { text: "sample_bold", bold: true },
      { text: "sample_code", code: true },
      { text: "sample_italic", italic: true },
      {
        text: `sample_with\n_breaking_line`,
      },
      {
        text: `sample_with\n
        _multiple\n\n
        _breaking\n_line`,
      },
      {
        type: "quote",
        children: [
          {
            text: "sample_quote",
          },
        ],
      },
      {
        type: "indent",
        children: [
          {
            text: "sample_indent",
          },
        ],
      },
      {
        type: "ul",
        children: [
          {
            type: "li",
            children: [{ text: "sample_ul_li" }],
          },
        ],
      },
      {
        type: "ol",
        children: [
          {
            type: "li",
            children: [{ text: "sample_ol_li" }],
          },
        ],
      },
      null,
      { type: "h6" },
      {
        type: "link",
        linkType: "custom",
        url: "https://github.com/",
        children: [
          {
            text: "sample_link",
          },
        ],
      },
      {
        type: "link",
        url: "https://copied-link.com/",
        children: [
          {
            text: "copied_link",
          },
        ],
      },
    ],
    richText: [
      {
        children: [
          { text: "here's an external " },
          {
            type: "link",
            linkType: "custom",
            url: "https://www.google.com",
            newTab: true,
            children: [{ text: "link" }],
          },
          { text: "" },
        ],
      },
      null,
      {
        children: [
          { text: "here's an " },
          {
            type: "link",
            linkType: "internal",
            doc: {
              value: {
                id: "63fc6a65d3ba75978a04509e",
                title: "story as link",
                body: [
                  {
                    columns: [
                      {
                        width: "full",
                        alignment: "left",
                        richText: [{ children: [{ text: "hello" }] }],
                        serialized: {
                          html: "<p><span>hello</span></p>",
                        },
                        id: "63fc6a6254a3d371cf6111be",
                      },
                    ],
                    id: "63fc6a6154a3d371cf6111bd",
                    blockType: "content",
                  },
                ],
                author: {
                  id: "63fc6a3dd3ba75978a04504d",
                  firstName: "Alberto",
                  lastName: "Maghini",
                  roles: ["admin"],
                  enableAPIKey: false,
                  email: "a.maghini@gmail.com",
                  createdAt: "2023-02-27T08:30:53.719Z",
                  updatedAt: "2023-02-27T08:30:53.799Z",
                },
                publishDate: "2023-02-27T08:31:23.653Z",
                isPrivate: false,
                slug: "story-as-link",
                _status: "published",
                createdAt: "2023-02-27T08:31:33.066Z",
                updatedAt: "2023-02-27T08:31:33.066Z",
                meta: {},
              },
              relationTo: "stories",
            },
            children: [{ text: "internal link" }],
          },
        ],
      },
      { children: [{ text: "sample text" }] },
      {
        type: "upload",
        value: {
          id: "6449327218d9676c0e18cdb0",
          title: "template powerpoint",
          author: {
            id: "6449322e18d9676c0e18cd28",
            firstName: "Alberto",
            lastName: "Maghini",
            roles: ["admin"],
            enableAPIKey: false,
            email: "a.maghini@gmail.com",
            createdAt: "2023-04-26T14:16:14.228Z",
            updatedAt: "2023-04-26T14:16:14.304Z",
          },
          publishDate: "2023-04-26T14:17:09.179Z",
          isPrivate: false,
          slug: "template-powerpoint",
          filename: "template_ppt.pptx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          filesize: 1891204,
          createdAt: "2023-04-26T14:17:22.550Z",
          updatedAt: "2023-04-26T14:17:22.550Z",
          url: "http://my-backoffice.com/uploads/files/template_ppt.pptx",
        },
      },
      {
        children: [
          {
            type: "link",
            linkType: "internal",
            doc: null,
          },
        ],
      },
      {
        children: [
          {
            type: "link",
            linkType: "external",
            doc: null,
          },
        ],
      },
      {
        children: [
          {
            text: "Write to",
            bold: true,
          },
          {
            text: " ",
          },
          {
            newTab: true,
            type: "link",
            url: "mailto:admin@mzinga.io",
            children: [
              {
                text: "admin@mzinga.io",
              },
            ],
          },
          {
            text: " telling us other info",
          },
        ],
      },
    ],
    formattedEmail: {
      bcc: "",
      cc: "",
      from: "admin@mzinga.io",
      html:
        "<div>\n" +
        "        <h2>\n" +
        "          <span>Sample title!</span>\n" +
        "        </h2>\n" +
        "      \n" +
        "        <p>\n" +
        "          <a href={https://www.mzinga.io}>\n" +
        "          <span>sample link</span>\n" +
        "        </a>\n" +
        "      <span> more text later</span>\n" +
        "        </p>\n" +
        "      \n" +
        "      </div>",
      replyTo: "admin@mzinga.io",
      subject: "You've received a new message.",
      to: "admin@mzinga.io",
    },
  },
  ConfigUtils: {
    incomingCollections: [
      {
        slug: "users",
        fields: [],
        extends: {
          collection: "users",
          access: {
            create: function (args) {
              return true;
            }.toString(),
          },
          hiddenFields: ["twitter"],
          fields: [
            {
              name: "jobTitle",
              type: "text",
            },
          ],
        },
      },
      {
        slug: "speeches",
        safeAccess: {
          update: function () {
            return "can-update";
          }.toString(),
        },
        fields: [
          {
            name: "owner",
            type: "text",
            safeHooksBeforeChange: [
              ((_) => {
                return "before-change";
              }).toString(),
            ],
          },
          {
            name: "status",
            type: "select",
            hasMany: false,
            required: true,
            defaultValue: "created",
            options: ["created", "informed", "approved"],
            safeAccess: {
              create: function () {
                return "can-create";
              }.toString(),
            },
            safeAdminCondition: function (data, _) {
              return "safe-admin-condition";
            },
          },
        ],
      },
      {
        slug: "external-pipelines",
        fields: [
          {
            name: "pipeline_id",
            type: "number",
            readValueFromField: "object_attributes.id",
          },
          {
            name: "object_attributes",
            type: "json",
          },
          {
            name: "non_existing_prop",
            type: "text",
            readValueFromField: "object_attributes.non_existing_prop",
          },
        ],
      },
    ],
    sortableCollections: [
      {
        admin: {
          group: "Custom",
          useAsTitle: "title",
          defaultColumns: ["name", "owner"],
        },
        fields: [
          {
            name: "name",
            type: "text",
            localized: true,
            required: true,
          },
          {
            name: "owner",
            type: "relationship",
            relationTo: "users",
            required: true,
            hasMany: false,
          },
          {
            name: "description",
            type: "textarea",
            maxLength: 120,
            localized: false,
            required: false,
          },
        ],
        slug: "testleagues",
      },
      {
        admin: {
          group: "Custom",
          useAsTitle: "title",
          defaultColumns: ["name", "owner", "league"],
        },
        fields: [
          {
            name: "name",
            type: "text",
            localized: true,
            required: true,
          },
          {
            name: "owner",
            type: "relationship",
            relationTo: "users",
            required: true,
            hasMany: false,
          },
          {
            name: "description",
            type: "textarea",
            maxLength: 120,
            localized: false,
            required: false,
          },
          {
            name: "league",
            type: "relationship",
            relationTo: "testleagues",
            required: true,
            hasMany: true,
          },
        ],
        slug: "testteams",
      },
      {
        fields: [
          {
            name: "name",
            type: "text",
            localized: true,
            required: true,
          },
          {
            name: "owner",
            type: "relationship",
            relationTo: "users",
            required: true,
            hasMany: false,
          },
          {
            name: "relation-non-existing",
            type: "relationship",
            relationTo: "relation-to-non-existing",
            required: true,
            hasMany: true,
          },
        ],
        slug: "with-invalid-relation",
      },
    ],
  },
};

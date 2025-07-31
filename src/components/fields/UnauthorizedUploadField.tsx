import React, { useState, useEffect } from "react";
import { fieldTypes } from "payload/dist/admin/components/forms/field-types";
import FileDetails from "payload/dist/admin/components/elements/FileDetails";
import { useConfig } from "payload/components/utilities";
import { useField } from "payload/components/forms";

const UnauthorizedUploadField: React.FC = (props: any) => {
  const {
    collections,
    serverURL,
    routes: { api },
  } = useConfig();
  const [file, setFile] = useState(undefined);
  const { path, relationTo } = props;
  const { value } = useField({ path });

  useEffect(() => {
    if (typeof value === "string" && value !== "") {
      const fetchFile = async () => {
        const response = await fetch(
          `${serverURL}${api}/${relationTo}/${value}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const json = await response.json();
          setFile(json);
        }
      };

      fetchFile();
    } else {
      setFile(undefined);
    }
  }, [value, relationTo, api, serverURL]);
  const collection = collections.find((coll) => coll.slug === relationTo);
  return props.permissions.create.permission ||
    props.permissions.update.permission ? (
    <>
      <fieldTypes.upload {...props} />
    </>
  ) : (
    file && (
      <FileDetails
        {...props}
        doc={file}
        collection={collection}
        handleRemove={null}
      />
    )
  );
};
export default UnauthorizedUploadField;

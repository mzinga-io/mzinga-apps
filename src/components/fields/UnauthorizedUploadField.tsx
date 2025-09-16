import { useField } from "mzinga/components/forms";
import { useConfig } from "mzinga/components/utilities";
import FileDetails from "mzinga/dist/admin/components/elements/FileDetails";
import { fieldTypes } from "mzinga/dist/admin/components/forms/field-types";
import React, { useEffect, useState } from "react";

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

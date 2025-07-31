import React from "react";
import { useFormFields } from "payload/components/forms";

export default function IconURLField() {
  const iconURL = useFormFields(([fields]) => fields.iconURL);
  return (
    iconURL?.value && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <img
          src={iconURL.value as string}
          width={50}
          height={50}
          style={{
            border: "1px solid #fff",
            background: "#fff",
            alignSelf: "flex-end",
          }}
        />
      </div>
    )
  );
}

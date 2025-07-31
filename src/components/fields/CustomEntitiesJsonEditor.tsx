import React, { useState, useEffect, useCallback } from "react";
import {
  SimpleEntity,
  AdvancedEntity,
  ExtensionEntity,
} from "../../statics/custom-entities";
import { CodeEditor } from "payload/dist/admin/components/elements/CodeEditor";
import { json } from "payload/dist/fields/validations";
import SelectInput from "payload/dist/admin/components/forms/field-types/Select/Input";
import Label from "payload/dist/admin/components/forms/Label";
import Error from "payload/dist/admin/components/forms/Error";
import { useField } from "payload/components/forms";
import { Slugs } from "../../collections/Slugs";
import { useConfig } from "payload/components/utilities";
const baseClass = "json-field";
const CustomEntitiesJsonEditorCell = function ({ cellData }) {
  return cellData ? (
    <span>
      Kind: "{cellData.kind}"<br />
      Slug: "{cellData.json.slug || cellData.json.extends?.slug}"
    </span>
  ) : (
    <span>{`<Unknown value>`}</span>
  );
};
declare type JSONDefinition = {
  kind: string;
  extensionCollection?: string;
  json: any;
};
const CustomEntitiesJsonEditorField = function (props) {
  const toJSON = (value) => value;
  const config = useConfig();
  const getExtensionCollection = (kind, extensionCollection) => {
    return kind?.toLowerCase() === "extensionentity"
      ? extensionCollection
      : undefined;
  };

  const fallbackEditorValue = {
    kind: "",
    json: {},
  };
  const [kind, setKind] = useState("");
  const [extensionCollection, setExtensionCollection] = useState("");
  const { path: pathFromProps, name, required, validate = json } = props;
  const path = pathFromProps || name;
  const [jsonError, setJsonError] = useState<string>();
  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required, jsonError });
    },
    [validate, required, jsonError]
  );
  const { value, showError, errorMessage, setValue } = useField<JSONDefinition>(
    { path, validate: memoizedValidate }
  );
  useEffect(() => {
    if (value) {
      setKind(value.kind);
      if (value.extensionCollection) {
        setExtensionCollection(value.extensionCollection);
      }
      delete value.json?.slug;
      return;
    }
    setValue(fallbackEditorValue);
  }, [fallbackEditorValue, value, setExtensionCollection, setKind]);
  const onExtensionSelectChange = useCallback(
    (option) => {
      setExtensionCollection(option.value);
      const _extensionCollection = option.value;
      const { json, kind: _kind } = value || {};
      if (json?.extends) {
        json.extends.collection = option.value;
      }
      setValue({
        kind: _kind,
        extensionCollection: getExtensionCollection(
          _kind,
          _extensionCollection
        ),
        json,
      });
    },
    [setValue, setExtensionCollection, getExtensionCollection]
  );
  const onSelectChange = useCallback(
    (option) => {
      const { value: val } = option;
      let editorValue = fallbackEditorValue.json;
      switch (val?.toLowerCase()) {
        case "simpleentity":
          editorValue = toJSON(SimpleEntity);
          break;
        case "advancedentity":
          editorValue = toJSON(AdvancedEntity);
          break;
        case "extensionentity":
          editorValue = toJSON(ExtensionEntity);
          break;
      }
      setKind(val);
      const _extensionCollection = getExtensionCollection(
        val,
        extensionCollection
      );
      setExtensionCollection(_extensionCollection);
      setValue({
        kind: val,
        extensionCollection: _extensionCollection,
        json: editorValue,
      });
    },
    [setValue, toJSON, setExtensionCollection, getExtensionCollection, setKind]
  );
  const onEditorChange = useCallback(
    (editorValue) => {
      try {
        const jsonValue = JSON.parse(editorValue.trim() || "{}");
        setValue({
          kind,
          extensionCollection: getExtensionCollection(
            kind,
            extensionCollection
          ),
          json: jsonValue,
        });
        setJsonError(undefined);
      } catch (e) {
        setJsonError(e);
      }
    },
    [setValue, kind, extensionCollection]
  );
  const classes = [baseClass, "field-type", showError && "error"]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      <SelectInput
        {...{
          path: `${path}-kind`,
          name: `${path}-kind`,
          label: "Kind",
          hasMany: false,
          isClearable: false,
          isSortable: false,
          value: kind,
          onChange: onSelectChange,
          options: [
            {
              label: "Simple entity",
              value: "SimpleEntity",
            },
            {
              label: "Advanced entity",
              value: "AdvancedEntity",
            },
            {
              label: "Extension entity",
              value: "ExtensionEntity",
            },
          ],
        }}
      ></SelectInput>
      {kind === "ExtensionEntity" ? (
        <SelectInput
          {...{
            path: `${path}-extension`,
            name: `${path}-extension`,
            label: "Which custom entity you want to extend?",
            hasMany: false,
            isClearable: false,
            isSortable: false,
            value: extensionCollection,
            onChange: onExtensionSelectChange,
            options: config.collections
              .filter(
                (c) =>
                  c.slug !== Slugs.CustomEntities &&
                  !c.slug.startsWith("payload-")
              )
              .map((c) => {
                return { label: c.slug, value: c.slug };
              }),
          }}
        />
      ) : null}
      {kind &&
      (kind !== "ExtensionEntity" ||
        (kind === "ExtensionEntity" && extensionCollection)) ? (
        <div className={classes}>
          <Error showError={showError} message={errorMessage} />
          <Label htmlFor={`field-${path}`} label="JSON definition" />

          <CodeEditor
            defaultLanguage="json"
            height={"70vh"}
            value={JSON.stringify((value || fallbackEditorValue).json, null, 2)}
            path={path}
            onChange={onEditorChange}
            options={{
              autoClosingBrackets: "always",
              language: "json",
              "semanticHighlighting.enabled": false,
              autoSurround: "quotes",
              autoClosingQuotes: "always",
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      ) : null}
    </>
  );
};

export { CustomEntitiesJsonEditorField, CustomEntitiesJsonEditorCell };

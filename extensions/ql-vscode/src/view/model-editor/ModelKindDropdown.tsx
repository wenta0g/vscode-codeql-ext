import * as React from "react";
import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import type {
  ModeledMethod,
  ModeledMethodKind,
} from "../../model-editor/modeled-method";
import { modeledMethodSupportsKind } from "../../model-editor/modeled-method";
import { Dropdown } from "../common/Dropdown";
import { Method } from "../../model-editor/method";
import { getModelsAsDataLanguage } from "../../model-editor/languages";
import { QueryLanguage } from "../../common/query-language";

type Props = {
  language: QueryLanguage;
  method: Method;
  modeledMethod: ModeledMethod | undefined;
  onChange: (modeledMethod: ModeledMethod) => void;
};

export const ModelKindDropdown = ({
  language,
  method,
  modeledMethod,
  onChange,
}: Props) => {
  const predicate = useMemo(() => {
    const modelsAsDataLanguage = getModelsAsDataLanguage(language);

    return modeledMethod?.type && modeledMethod.type !== "none"
      ? modelsAsDataLanguage.predicates[modeledMethod.type]
      : undefined;
  }, [language, modeledMethod?.type]);

  const kinds = useMemo(() => predicate?.supportedKinds || [], [predicate]);

  const disabled = useMemo(
    () => !predicate?.supportedKinds,
    [predicate?.supportedKinds],
  );

  const options = useMemo(
    () => kinds.map((kind) => ({ value: kind, label: kind })),
    [kinds],
  );

  const onChangeKind = useCallback(
    (kind: ModeledMethodKind) => {
      if (!modeledMethod || !modeledMethodSupportsKind(modeledMethod)) {
        return;
      }

      onChange({
        ...modeledMethod,
        kind,
      });
    },
    [modeledMethod, onChange],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const target = e.target as HTMLSelectElement;
      const kind = target.value;

      onChangeKind(kind);
    },
    [onChangeKind],
  );

  const value =
    modeledMethod && modeledMethodSupportsKind(modeledMethod)
      ? modeledMethod.kind
      : undefined;

  useEffect(() => {
    if (!modeledMethod || !modeledMethodSupportsKind(modeledMethod)) {
      return;
    }

    if (kinds.length === 0 && value !== "") {
      onChangeKind("");
    } else if (kinds.length > 0 && !kinds.includes(value ?? "")) {
      onChangeKind(kinds[0]);
    }
  }, [modeledMethod, value, kinds, onChangeKind]);

  return (
    <Dropdown
      value={value ?? undefined}
      options={options}
      disabled={disabled}
      onChange={handleChange}
      aria-label="Kind"
    />
  );
};

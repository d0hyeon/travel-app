import { useForm, useFormContext } from "react-hook-form";
import { PostVisibility } from "../post.types";
import type { DraftPostPhoto } from "./postDraftPhoto";
import type { PostPlaceSelection } from "./PostPlacesField";
import { useCallback, useState } from "react";
import { assert } from "~shared/utils/types";
import { useVariation } from "~shared/hooks/extends/useVariation";
import { usePreservedCallback } from "~shared/hooks/extends/usePreservedCallback";
import { useLoading } from "~shared/hooks/useLoading";

export type PostFormValues = {
  photos: DraftPostPhoto[];
  visibility: PostVisibility;
  places: PostPlaceSelection[];
  description: string;
}

interface UsePostFormOptions {
  onSubmit: (value: PostFormValues) => void | (Promise<void>);
}

export function usePostForm(options: UsePostFormOptions) {
  const [getForm, setForm] = useVariation<Partial<PostFormValues>>({
    photos: [],
    visibility: PostVisibility.PUBLIC,
    places: [],
    description: ''
  })
  const [_, setVersion] = useState(0);

  const getIsValid = useCallback(() => Object.values(getForm()).every(x => x != null), []);

  const update = useCallback((values: Partial<PostFormValues>) => {
    const prev = getForm();
    setForm(({ ...prev, ...values }));
    setVersion(prev => prev + 1);
  }, [])

  const handleSubmit = usePreservedCallback(options.onSubmit);
  const [isSubmitting, startTransition] = useLoading();
  const submit = useCallback(() => {
    assert(getIsValid(), '값이 누락 되었습니다.');
    startTransition(() => {
      handleSubmit(getForm() as PostFormValues)
    });
  }, []);


  return {
    form: getForm(),
    isValid: getIsValid(),
    isSubmitting,
    update,
    submit,
  };
}

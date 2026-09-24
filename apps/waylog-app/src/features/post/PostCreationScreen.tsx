import { PostVisibility, useCreatePost } from '@waylog/domains/modules/post'
import { useEffect, useState } from 'react'
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import { uploadPostPhoto } from '../photo/photo.api'
import { PostFormFunnel } from './post-form-funnel/PostFormFunnel'
import type { PostFormStep, PostFormValues } from './post-form-funnel/postFormFunnel.types'

export function PostCreationScreen() {
  const navigation = useAppNavigation()
  const { params } = useAppRoute<'PostNew'>()
  const fixedTripId = params.tripId
  const { mutateAsync: createPost } = useCreatePost()
  const startStep: PostFormStep = fixedTripId == null ? 'trip' : 'photo'
  const [step, setStep] = useState<PostFormStep>(startStep);

  // 퍼널이 자체 스택을 갖는다. 두 스택에 제스처를 함께 열어두면 같은 스와이프를
  // 다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다. 첫 스텝에서만 부모가 받는다.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === startStep })
  }, [navigation, step, startStep])

  const uploadPhotos = (values: PostFormValues) => {
    return Promise.all(
      values.photos.map(async (photo) => {
        const result = await uploadPostPhoto(values.tripId, photo.uri);

        return {
          ...result,
          placeId: photo.placeId,
          savedPhotoId: photo.savedPhotoId,
          isPublic: values.visibility !== PostVisibility.PRIVATE,
        }
      })
    )
  }

  const handleSubmit = async (formValues: PostFormValues) => {
    const uploadedPhotos = await uploadPhotos(formValues);
    const post = await createPost({
      ...formValues,
      placeIds: formValues.places.map((place) => place.placeId),
      photos: uploadedPhotos,
    })
    navigation.replace('PostDetail', { postId: post.id })
  }

  return (
    <PostFormFunnel
      startStep={startStep}
      defaultValue={{ tripId: fixedTripId ?? null }}
      onStepChange={setStep}
      onSubmit={handleSubmit}
    />
  )
}

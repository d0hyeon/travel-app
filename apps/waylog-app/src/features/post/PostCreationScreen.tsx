import { updatePhoto } from '@waylog/domains/modules/photo'
import { PostVisibility, useCreatePost } from '@waylog/domains/modules/post'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { uploadPostPhoto } from '../photo/photo.api'
import { PostFormFunnel } from './post-form-funnel/PostFormFunnel'
import type { PostFormStep, PostFormValues } from './post-form-funnel/postFormFunnel.types'

export function PostCreationScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tripId?: string | string[] }>()
  const fixedTripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId
  const { mutateAsync: createPost } = useCreatePost()
  const startStep: PostFormStep = fixedTripId == null ? 'trip' : 'photo'
  const [step, setStep] = useState<PostFormStep>(startStep)

  const create = async ({ tripId, photos, places, visibility, description }: PostFormValues) => {
    const isPublic = visibility !== PostVisibility.PRIVATE
    const uploadedPhotos = await Promise.all(
      photos.map(async (photo) => ({ ...(await uploadPostPhoto(tripId, photo.uri)), placeId: photo.placeId, isPublic })),
    )
    const post = await createPost({
      tripId,
      description,
      visibility,
      placeIds: places.map((place) => place.placeId),
      photos: uploadedPhotos,
    })
    if (visibility === PostVisibility.PUBLIC) {
      await Promise.all(photos.flatMap((photo) => photo.savedPhotoId == null ? [] : [updatePhoto(photo.savedPhotoId, { isPublic: true })]))
    }
    router.replace(`/post/${post.id}`)
  }

  return (
    <>
      {/* 퍼널이 자체 스택을 갖는다. 두 스택에 제스처를 함께 열어두면 같은 스와이프를
          다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다. 첫 스텝에서만 부모가 받는다. */}
      <Stack.Screen options={{ gestureEnabled: step === startStep }} />
      <PostFormFunnel
        startStep={startStep}
        defaultValue={{ tripId: fixedTripId ?? null }}
        onStepChange={setStep}
        onSubmit={create}
      />
    </>
  )
}

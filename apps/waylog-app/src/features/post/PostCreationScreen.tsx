import { AuthGuard } from '@waylog/domains/clients'
import { PostVisibility, useCreatePost } from '@waylog/domains/modules/post'
import { useEffect, useState } from 'react'
import { useAppNavigation, useAppRoute } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { Photo, uploadPostPhoto } from '~features/photo/photo.api'
import { PostFormFunnel } from './post-form-funnel/PostFormFunnel'
import type { PostFormStep, PostFormValues } from './post-form-funnel/postFormFunnel.types'
import { RequireAuthRedirect } from '~features/auth/auth-redirect'
import { queryClient } from '~shared/query-client'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { resolvePhotoUri } from '~shared/modules/photo-library/usePhotoLibrary'

export type PostNewParams = { tripId?: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.포스트_생성]: PostNewParams
  }
}

export function PostCreationScreen() {
  return (
    <AuthGuard fallback={<RequireAuthRedirect />}>
      <ResolvedPostCreationScreen />
    </AuthGuard>
  )
}

function ResolvedPostCreationScreen() {
  const navigation = useAppNavigation()
  const { params } = useAppRoute<typeof AppRoute.포스트_생성>()
  const fixedTripId = params.tripId
  const { mutateAsync: createPost } = useCreatePost()
  const startStep: PostFormStep = fixedTripId == null ? 'trip' : 'photo'
  const [step, setStep] = useState<PostFormStep>(startStep);

  // 퍼널이 자체 스택을 갖는다. 두 스택에 제스처를 함께 열어두면 같은 스와이프를
  // 다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다. 첫 스텝에서만 부모가 받는다.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === startStep })
  }, [navigation, step, startStep])

  const uploadPhotos = async (values: PostFormValues) => {
    const [tripPhotos, uploadResults] = await Promise.all([
      values.tripId != null ? getTripPhotos(values.tripId) : [],
      Promise.all(
        values.photos.map(async (photo) => {
          const fileURI = await resolvePhotoUri(photo.uri);
          return uploadPostPhoto(values.tripId, fileURI);
        })
      ),
    ]);

    return uploadResults.map((result, index) => {
      const savedPhoto = tripPhotos.find(tripPhoto => tripPhoto.id === values.photos[index]?.id);

      return {
        ...result,
        placeId: savedPhoto?.placeId,
        savedPhotoId: savedPhoto?.id,
        isPublic: values.visibility !== PostVisibility.PRIVATE,
      }
    })
  }

  const handleSubmit = async (formValues: PostFormValues) => {
    const uploadedPhotos = await uploadPhotos(formValues);
    const post = await createPost({
      ...formValues,
      placeIds: formValues.places.map((place) => place.placeId),
      photos: uploadedPhotos,
    })
    navigation.replace(AppRoute.포스트_상세, { postId: post.id })
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

function getTripPhotos(tripId: string) {
  return queryClient.ensureQueryData<Photo[]>({
    queryKey: useTripPhotos.key(tripId)
  })
}
import { MaterialIcons } from '@expo/vector-icons'
import { updatePhoto } from '@waylog/domains/modules/photo'
import { PostVisibility, useCreatePost } from '@waylog/domains/modules/post'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Suspense, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearProgress, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { uploadPostPhoto } from '../../photo/photo.api'
import { MetaStep } from './MetaStep'
import { PhotoStep } from './PhotoStep'
import { TripStep } from './TripStep'
import { usePostForm } from './usePostForm'
import type { DraftPostPhoto, PostMetaValue } from './postForm.types'

const STEPS = ['trip', 'photo', 'meta'] as const
type PostFormStep = typeof STEPS[number]

const STEP_TITLE: Record<PostFormStep, string> = { trip: '여행 선택', photo: '이미지 선택', meta: '상세 설정' }

export function PostFormScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ tripId?: string | string[] }>()
  const initialTripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId
  const steps: readonly PostFormStep[] = initialTripId == null ? STEPS : STEPS.filter((candidate) => candidate !== 'trip')
  const [step, setStep] = useState<PostFormStep>(initialTripId == null ? 'trip' : 'photo')
  const [tripId, setTripId] = useState<string | null>(initialTripId ?? null)
  const { mutateAsync: createPost } = useCreatePost()
  const stepIndex = steps.indexOf(step)

  const { form, error, update, submit } = usePostForm({
    onSubmit: async (value) => {
      const isPublic = value.visibility !== PostVisibility.PRIVATE
      const uploadedPhotos = await Promise.all(
        value.photos.map(async (photo) => ({ ...(await uploadPostPhoto(tripId, photo.uri)), placeId: photo.placeId, isPublic })),
      )
      const post = await createPost({
        tripId,
        description: value.description,
        visibility: value.visibility,
        placeIds: value.places.map((place) => place.placeId),
        photos: uploadedPhotos,
      })
      if (value.visibility === PostVisibility.PUBLIC) {
        void Promise.all(value.photos.flatMap((photo) => photo.savedPhotoId == null ? [] : [updatePhoto(photo.savedPhotoId, { isPublic: true })]))
      }
      router.replace(`/post/${post.id}`)
    },
  })

  const goBack = () => {
    if (stepIndex <= 0) return router.back()
    setStep(steps[stepIndex - 1] ?? steps[0])
  }

  // 스와이프 백 제스처·하드웨어 뒤로가기도 헤더의 <- 버튼과 같이 동작해야 한다.
  // 막지 않으면 중간 스텝에서도 곧장 퍼널을 벗어난다.
  useEffect(() => {
    if (stepIndex <= 0) return

    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault()
      goBack()
    })
  }, [navigation, stepIndex])

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: palette.background }}>
      <View style={{ height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: palette.divider }}>
        <Pressable onPress={goBack} hitSlop={8}><MaterialIcons name="chevron-left" size={28} color={palette.text} /></Pressable>
        <View style={{ flex: 1 }}><Typography sx={{ fontSize: 11.5, color: palette.textSecondary }}>새 포스트 · {stepIndex + 1}/{steps.length}</Typography><Typography sx={{ fontSize: 17, fontWeight: '700' }}>{STEP_TITLE[step]}</Typography></View>
        <View style={{ flexDirection: 'row', gap: 4 }}>{steps.map((candidate, index) => <View key={candidate} style={{ width: index === stepIndex ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: index <= stepIndex ? palette.primary : 'rgba(0,0,0,0.12)' }} />)}</View>
      </View>
      <LinearProgress value={((stepIndex + 1) / steps.length) * 100} />
      {error != null && <View style={{ padding: 12, backgroundColor: '#FFEBEE' }}><Typography color="error">{error instanceof Error ? error.message : '포스트를 등록하지 못했어요'}</Typography></View>}
      <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
        {step === 'trip' && <TripStep defaultValue={tripId} onNext={(nextTripId) => { setTripId(nextTripId); setStep('photo') }} />}
        {step === 'photo' && (
          <PhotoStep
            tripId={tripId}
            defaultValue={form.photos ?? []}
            onNext={(selectedPhotos: DraftPostPhoto[]) => {
              update({ photos: selectedPhotos })
              setStep('meta')
            }}
          />
        )}
        {step === 'meta' && !!form.photos && (
          <MetaStep
            tripId={tripId}
            photos={form.photos}
            onNext={async (values: PostMetaValue) => {
              update(values)
              await submit()
            }}
          />
        )}
      </Suspense>
    </View>
  )
}

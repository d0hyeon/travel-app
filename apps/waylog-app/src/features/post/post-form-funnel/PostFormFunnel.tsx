import { useFocusEffect } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Suspense, useCallback } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { PostFormFunnelHeader } from './PostFormFunnelHeader'
import { MetaStep, type PostMetaValue } from './steps/MetaStep'
import { PhotoStep } from './steps/PhotoStep'
import { TripStep } from './steps/TripStep'
import { usePostForm } from './usePostForm'
import type { PostFormPhoto, PostFormStep, PostFormValues } from './postFormFunnel.types'

// 퍼널을 자체 스택으로 세운다. 부모 스택에서 이 화면은 엔트리 하나이므로
// 소비자가 replace 한 번만 해도 스텝 전체가 함께 걷힌다.
const Funnel = createNativeStackNavigator()

interface Props {
  /** 여행이 정해진 채로 진입하면 'photo' 를 넘겨 여행 선택을 건너뛴다. */
  startStep?: PostFormStep
  defaultValue?: Partial<PostFormValues>
  onStepChange?: (step: PostFormStep) => void
  onSubmit: (value: PostFormValues) => Promise<void>
}

export function PostFormFunnel({ startStep = 'trip', defaultValue, onStepChange, onSubmit }: Props) {
  const insets = useSafeAreaInsets()
  const { values, error, update, submit } = usePostForm({ defaultValue, onSubmit })

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: palette.background }}>
      {error != null && (
        <View style={{ padding: 12, backgroundColor: palette.errorContainer }}>
          <Typography color="error">{error instanceof Error ? error.message : '포스트를 등록하지 못했어요'}</Typography>
        </View>
      )}
      <Funnel.Navigator
        initialRouteName={startStep}
        screenOptions={{
          header: (props) => <PostFormFunnelHeader {...props} startStep={startStep} />,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Funnel.Screen name="trip" options={{ title: '여행 선택' }}>
          {({ navigation }) => (
            <StepBoundary step="trip" onFocus={onStepChange}>
              <TripStep
                defaultValue={values.tripId}
                onNext={(tripId) => {
                  update({ tripId })
                  navigation.navigate('photo')
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
        <Funnel.Screen name="photo" options={{ title: '이미지 선택' }}>
          {({ navigation }) => (
            <StepBoundary step="photo" onFocus={onStepChange}>
              <PhotoStep
                tripId={values.tripId}
                defaultValue={values.photos}
                onNext={(photos: PostFormPhoto[]) => {
                  update({ photos })
                  navigation.navigate('meta')
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
        <Funnel.Screen name="meta" options={{ title: '상세 설정' }}>
          {() => (
            <StepBoundary step="meta" onFocus={onStepChange}>
              <MetaStep
                tripId={values.tripId}
                photos={values.photos}
                onNext={async (meta: PostMetaValue) => {
                  update(meta)
                  await submit()
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
      </Funnel.Navigator>
    </View>
  )
}

function StepBoundary({ step, onFocus, children }: { step: PostFormStep; onFocus?: (step: PostFormStep) => void; children: React.ReactNode }) {
  // Navigator 바깥에서는 현재 스텝을 읽을 수 없어 스텝이 스스로 알린다.
  useFocusEffect(useCallback(() => onFocus?.(step), [step, onFocus]))
  return <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>{children}</Suspense>
}

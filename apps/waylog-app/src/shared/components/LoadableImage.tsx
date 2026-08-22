import { useState } from 'react'
import {
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type NativeSyntheticEvent,
  type ImageErrorEventData,
} from 'react-native'
import { Skeleton } from './mui/Skeleton'

export type LoadableImageProps = ImageProps

export function LoadableImage({ style, onLoadStart, onLoadEnd, onError, ...props }: LoadableImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadStart: NonNullable<ImageProps['onLoadStart']> = () => {
    setIsLoading(true)
    setHasError(false)
    onLoadStart?.()
  }

  const handleLoadEnd: NonNullable<ImageProps['onLoadEnd']> = () => {
    setIsLoading(false)
    onLoadEnd?.()
  }

  const handleError = (event: NativeSyntheticEvent<ImageErrorEventData>) => {
    setHasError(true)
    setIsLoading(false)
    onError?.(event)
  }

  return (
    <View style={[style, styles.container]}>
      {(isLoading || hasError) && <Skeleton variant="rectangular" width="100%" height="100%" />}
      {!hasError && (
        <Image
          {...props}
          style={StyleSheet.absoluteFill}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})

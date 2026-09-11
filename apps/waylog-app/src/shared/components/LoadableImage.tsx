import { MaterialIcons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import {
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type NativeSyntheticEvent,
  type ImageErrorEventData,
} from 'react-native'
import { Skeleton } from '~/shared/components/design-system/Skeleton'
import { palette } from '../config/tokens'

export interface LoadableImageProps extends ImageProps {
  /** 로딩에 실패했을 때 스켈레톤 대신 보여 줄 내용. */
  fallback?: ReactNode
}

export function LoadableImage({ style, fallback, onLoadStart, onLoadEnd, onError, ...props }: LoadableImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadEnd: NonNullable<ImageProps['onLoadEnd']> = () => {
    setIsLoading(false)
    onLoadEnd?.()
  }

  const handleError = (event: NativeSyntheticEvent<ImageErrorEventData>) => {
    setHasError(true)
    setIsLoading(false)
    onError?.(event)
  }

  if (hasError) {
    return (
      <View style={[style, styles.container, styles.fallback]}>
        {fallback ?? <MaterialIcons name="broken-image" size={20} color={palette.textSecondary} />}
      </View>
    )
  }

  return (
    <View style={[style, styles.container]}>
      {isLoading && <Skeleton variant="rectangular" width="100%" height="100%" />}
      <Image
        {...props}
        source={toSecureSource(props.source)}
        style={StyleSheet.absoluteFill}
        onLoadStart={onLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
    </View>
  )
}

/**
 * iOS ATS 와 Android cleartext 정책은 http 이미지를 막는다. 웹 브라우저는 그대로 열려
 * 웹에서만 보이는 차이가 생기므로, 원격 이미지는 https 로 올려 보낸다.
 */
function toSecureSource(source: ImageProps['source']): ImageProps['source'] {
  if (source == null || typeof source === 'number' || Array.isArray(source)) return source
  const { uri } = source
  if (uri == null || !uri.startsWith('http://')) return source

  return { ...source, uri: `https://${uri.slice('http://'.length)}` }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
})

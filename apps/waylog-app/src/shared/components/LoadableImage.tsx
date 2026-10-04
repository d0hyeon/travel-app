import { MaterialIcons } from '@expo/vector-icons'
import { Image, type ImageErrorEventData, type ImageProps } from 'expo-image'
import { useState, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Skeleton } from '~shared/components/design-system/Skeleton'
import { palette } from '~shared/config/tokens'

export interface LoadableImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 로딩에 실패했을 때 스켈레톤 대신 보여 줄 내용. */
  fallback?: ReactNode;
}

export function LoadableImage({ style, source, cachePolicy = 'disk', fallback, onLoadEnd, onError, ...props }: LoadableImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadEnd = () => {
    setIsLoading(false)
    onLoadEnd?.()
  }

  const handleError = (event: ImageErrorEventData) => {
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
        source={toSecureSource(source)}
        cachePolicy={cachePolicy}
        style={StyleSheet.absoluteFill}
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
  if (typeof source === 'string') return toSecureUri(source)
  if (source == null || typeof source !== 'object' || !('uri' in source) || source.uri == null) return source

  return { ...source, uri: toSecureUri(source.uri) }
}

function toSecureUri(uri: string) {
  return uri.startsWith('http://') ? `https://${uri.slice('http://'.length)}` : uri
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

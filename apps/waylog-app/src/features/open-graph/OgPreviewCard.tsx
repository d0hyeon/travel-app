import { useOpenGraph } from '@waylog/domains/modules/open-graph'
import { Suspense } from 'react'
import { StyleSheet, Linking, Pressable } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../shared/config/tokens'
import { LoadableImage } from '../../shared/components/LoadableImage'

interface Props {
  url: string
}

export function OgPreviewCard(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ url }: Props) {
  const { data } = useOpenGraph(url)

  return (
    <Pressable onPress={() => void Linking.openURL(data.url)}>
      <Box style={styles.card}>
        {data.image ? (
          <Stack direction="row" gap={1.5} style={styles.content}>
            <LoadableImage
              source={{ uri: data.image }}
              style={styles.thumbnail}
            />
            <Stack style={styles.description}>
              {data.title && (
                <Typography variant="body2" numberOfLines={1}>
                  {data.title}
                </Typography>
              )}
              {data.description && (
                <Typography variant="caption" color="text.secondary" numberOfLines={2}>
                  {data.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {getDomain(data.url)}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack style={styles.fallbackContent}>
            {data.title && (
              <Typography variant="body2" numberOfLines={1}>
                {data.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {getDomain(data.url)}
            </Typography>
          </Stack>
        )}
      </Box>
    </Pressable>
  )
}

function Pending() {
  return (
    <Box style={styles.card}>
      <Stack direction="row" gap={1} style={styles.content}>
        <Skeleton variant="rectangular" width={80} height={60} />
        <Stack style={styles.loadingDescription}>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </Stack>
      </Stack>
    </Box>
  )
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: palette.divider, borderRadius: radius.md },
  content: { padding: 12 },
  thumbnail: { width: 80, height: 80, borderRadius: radius.sm, backgroundColor: 'rgba(0,0,0,0.08)' },
  description: { flex: 1, gap: 2 },
  fallbackContent: { padding: 12, gap: 2 },
  loadingDescription: { flex: 1, gap: 4 },
})

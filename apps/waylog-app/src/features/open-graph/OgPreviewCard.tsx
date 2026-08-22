import { useOpenGraph } from '@waylog/domains/modules/open-graph'
import { Suspense } from 'react'
import { Linking, Pressable } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '../../shared/components/mui'
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
      <Box sx={{ borderWidth: 1, borderColor: palette.divider, borderRadius: radius.md }}>
        {data.image ? (
          <Stack direction="row" gap={1.5} sx={{ padding: 12 }}>
            <LoadableImage
              source={{ uri: data.image }}
              style={{
                width: 80,
                height: 80,
                borderRadius: radius.sm,
                backgroundColor: 'rgba(0,0,0,0.08)',
              }}
            />
            <Stack sx={{ flex: 1, gap: 2 }}>
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
          <Stack sx={{ padding: 12, gap: 2 }}>
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
    <Box sx={{ borderWidth: 1, borderColor: palette.divider, borderRadius: radius.md }}>
      <Stack direction="row" gap={1} sx={{ padding: 12 }}>
        <Skeleton variant="rectangular" width={80} height={60} />
        <Stack sx={{ flex: 1, gap: 4 }}>
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

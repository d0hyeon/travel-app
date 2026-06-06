import { Box, Card, CardActionArea, Skeleton, Stack, Typography, type CardProps } from '@mui/material'
import { Suspense } from 'react';
import { useOgPreview, type OgPreviewData } from '~shared/hooks/useOgPreview'

interface Props {
  url: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function OgPreviewCard(props: Props & CardProps) {
  return (
    <Suspense fallback={<Pending {...props} />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ url, ...props }: Props & CardProps) {
  const { data } = useOgPreview(url);

  return (
    <Card variant="outlined" {...props}>
      <CardActionArea
        component="a"
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {data.image ? (
          <Stack direction="row" gap={1.5} p={1.5}>
            <Box
              component="img"
              src={data.image}
              alt={data.title ?? ''}
              sx={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: 1,
                flexShrink: 0,
                bgcolor: 'grey.100',
              }}
              onError={(e) => {
                ; (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <Stack gap={0.25} flex={1} minWidth={0}>
              {data.title && (
                <Typography variant="body2" fontWeight={600} noWrap>
                  {data.title}
                </Typography>
              )}
              {data.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {data.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                {getDomain(data.url)}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={0.25} p={1.5}>
            {data.title && (
              <Typography variant="body2" fontWeight={600} noWrap>
                {data.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              {getDomain(data.url)}
            </Typography>
          </Stack>
        )}
      </CardActionArea>
    </Card>
  )
}
function Pending(props: Props) {
  return (
    <Card variant="outlined" {...props}>
      <Stack direction="row" gap={1} p={1.5}>
        <Skeleton variant="rectangular" width={80} height={60} sx={{ borderRadius: 1, flexShrink: 0 }} />
        <Stack gap={0.5} flex={1}>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Stack>
      </Stack>
    </Card>
  )
}
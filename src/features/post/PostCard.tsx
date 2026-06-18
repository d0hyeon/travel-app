import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import { generatePath, Link } from 'react-router'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PostLikeButton } from './PostLikeButton'
import { PostVisibility, type Post } from './post.types'
import { AppRoute } from '~app/routes'
import { Swiper, SwiperSlide } from 'swiper/react'
import { UserProfile } from '~features/user-profile/UserProfile'
import { Pagination, Virtual } from 'swiper/modules'
import LocationPin from '@mui/icons-material/LocationPin'
import LockIcon from '@mui/icons-material/Lock';

// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/pagination'
import { useAuth } from '~features/auth/useAuth'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const { data: auth } = useAuth({ required: false });

  return (
    <Box key={post.id} bgcolor="white" borderRadius={4} overflow="hidden">
      <Box sx={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
        <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })} viewTransition>
          <Swiper
            slidesPerView={1}
            modules={[Virtual, Pagination]}
            loop
            pagination
          >
            {post.photos.map((photo) => (
              <SwiperSlide key={photo.url}>
                <Box component="img" src={photo.url} sx={{ aspectRatio: '1', objectFit: 'cover' }} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Link>
      </Box>
      <Stack paddingX={1.5} paddingTop={1} paddingBottom={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={-0.5}>
          <Stack direction="row" gap={0.5} alignItems="center">
            <Link to={`/u/${post.authorId}`} viewTransition>
              <UserProfile id={post.authorId} size="small" marginRight={0.5} />
            </Link>
            {post.places.length > 0 && (
              <>
                <Box width="2px" height="2px" bgcolor={t => t.palette.text.secondary} borderRadius="100%" />

                <Typography
                  component="button"
                  variant="caption"
                  color="textSecondary"
                >
                  <LocationPin sx={{ fontSize: 'inherit', verticalAlign: 'middle' }} />
                  {post.places[0].name}
                  {post.places.length > 1 && ` 외 ${post.places.length - 1}`}
                </Typography>
              </>
            )}
          </Stack>
          {auth == null
            ? <PostLikeButton.Readonly postId={post.id} />
            : <PostLikeButton postId={post.id} />
          }
        </Stack>
        <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })} viewTransition>

          {post.description && (
            <Typography variant="body2" color="textSecondary" paddingTop={1.5} paddingX={0.5}>
              {post.description}
            </Typography>
          )}
          {post.visibility !== PostVisibility.PUBLIC && (
            <Stack direction="row" marginTop={1} alignItems="center" gap={0.5} >
              <LockIcon fontSize="small" color="disabled" sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: 11 }}>
                비공개
              </Typography>
            </Stack>
          )}
        </Link>
      </Stack>
    </Box>
  )
}

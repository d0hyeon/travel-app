import { Box, Stack, Typography } from '@mui/material'
import { Pagination, Virtual } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useFeed } from './useFeed'

import LocationPin from '@mui/icons-material/LocationPin'
import { UserProfile } from '~features/user-profile/UserProfile'
import { PostLikeButton } from './PostLikeButton'
import { AppRoute } from '~app/routes'
import { generatePath, Link } from 'react-router'
import LockIcon from '@mui/icons-material/Lock';

// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/pagination'
import { PostVisibility } from './post.types'




export function PostFeed() {
  const { data: posts } = useFeed()

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <Box key={post.id} bgcolor="white" borderRadius={4} overflow="hidden">
          <Box sx={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
            <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })}>
              <Swiper
                slidesPerView={1}
                modules={[Virtual, Pagination]}
                virtual
                loop
                pagination={{

                }}
              >
                {post.photos.map((photo) => (
                  <SwiperSlide key={photo.url}>
                    <Box component="img" src={photo.url} loading="lazy" sx={{ aspectRatio: '1', objectFit: 'cover' }} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </Link>
          </Box>
          <Stack paddingX={1.5} paddingTop={1} paddingBottom={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={-0.5}>
              <Stack direction="row" gap={0.5} alignItems="center">
                <Link to={`/u/${post.authorId}`}>
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

              <PostLikeButton postId={post.id} />
            </Stack>
            <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })}>

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
      ))}

    </Stack >
  )
}

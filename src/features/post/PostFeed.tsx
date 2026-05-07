import { Box, Stack, Typography } from '@mui/material'
import { Pagination, Virtual } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useFeed } from './useFeed'

import LocationPin from '@mui/icons-material/LocationPin'
import { UserProfile } from '~features/user-profile/UserProfile'
import { PostLikeButton } from './PostLikeButton'

// @ts-ignore
import 'swiper/css'
// @ts-ignore
import { generatePath, Link } from 'react-router'
import 'swiper/css/pagination'
import { AppRoute } from '~app/routes'



export function PostFeed() {
  const { data: posts } = useFeed()

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <Box key={post.id}>
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
          <Stack marginTop={1.5} paddingX={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Link to={`/u/${post.authorId}`}>
                <UserProfile id={post.authorId} size="small" />
              </Link>
              <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })}>
                {post.location != null && (
                  <Typography
                    component="button"
                    variant="caption"
                    color="textSecondary"

                  >
                    <LocationPin sx={{ fontSize: 'inherit', verticalAlign: 'middle' }} />
                    {post.location.name}
                  </Typography>
                )}
              </Link>
            </Stack>
            <Typography variant="body2" color="textSecondary" paddingTop={1.5} paddingX={0.5}>
              {post.description}
            </Typography>

            <PostLikeButton postId={post.id} marginTop={1} marginLeft={-0.5} />
          </Stack>
        </Box>
      ))}

    </Stack >
  )
}

import { Box, Stack, Typography } from '@mui/material'
import { PostCard } from './PostCard'
import type { Post } from './post.types'
import { useFeed } from './useFeed'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Virtual, Pagination } from 'swiper/modules'

import { PostLikeButton } from './PostLikeButton'
import { UserProfile } from '~features/user-profile/UserProfile'
import LocationPin from '@mui/icons-material/LocationPin'

// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/pagination'



export function PostFeed() {
  const { data: posts } = useFeed()

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <Box key={post.id}>
          <Box sx={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
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
          </Box>
          <Stack marginTop={1.5} paddingX={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <UserProfile id={post.authorId} size="small" />
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

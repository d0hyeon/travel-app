import { MaterialIcons } from '@expo/vector-icons'
import { PostVisibility, type Post, usePost } from '@waylog/domains/modules/post'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListItem } from '../../shared/components/ListItem'
import { Map } from '../../shared/components/Map'
import { Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { PostAuthor } from './PostAuthor'
import { PostLikeButton } from './PostLikeButton'
import { LoadableImage } from '../../shared/components/LoadableImage'

interface Props {
  postId: string
}

export function PostDetailScreen({ postId }: Props) {
  return (
    <Suspense fallback={<PostDetailLoading />}>
      <ResolvedPostDetail postId={postId} />
    </Suspense>
  )
}

function ResolvedPostDetail({ postId }: Props) {
  const { data: post } = usePost(postId)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const openAuthorProfile = () => {
    router.push(`/u/${post.authorId}`)
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ paddingTop: insets.top + 4, paddingHorizontal: 12, paddingBottom: 8, backgroundColor: palette.background }}
      >
        <Pressable accessibilityLabel="뒤로가기" onPress={() => router.back()} style={{ padding: 8 }}>
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Typography variant="subtitle1" sx={{ marginLeft: 4 }}>포스트</Typography>
      </Stack>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <PostAuthor authorId={post.authorId} onPress={openAuthorProfile} />
        <PostTitle post={post} />
        <PostPhotoList photos={post.photos} />
        {post.description && <Typography sx={{ color: palette.text, fontSize: 14, lineHeight: 22 }}>{post.description}</Typography>}
        {post.visibility !== PostVisibility.PUBLIC && (
          <Stack direction="row" alignItems="center" sx={{ gap: 4 }}>
            <MaterialIcons name="lock-outline" size={14} color={palette.textSecondary} />
            <Typography sx={{ color: palette.textSecondary, fontSize: 11 }}>비공개</Typography>
          </Stack>
        )}
        {post.places.length > 0 && <PostPlaces places={post.places} onPlacePress={(placeId) => router.push(`/explorer/${placeId}`)} />}
        <PostLikeButton postId={post.id} />
      </ScrollView>
    </View>
  )
}

function PostTitle({ post }: { post: Post }) {
  if (post.title == null || post.title.trim() === '') return null

  return <Typography variant="h6">{post.title}</Typography>
}

function PostPhotoList({ photos }: Pick<Post, 'photos'>) {
  if (photos.length === 0) {
    return (
      <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)' }}>
        <MaterialIcons name="image" size={40} color={palette.textSecondary} />
      </View>
    )
  }

  return (
    <Stack sx={{ gap: 8 }}>
      {photos.map((photo) => (
        <LoadableImage key={photo.url} source={{ uri: photo.url }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} resizeMode="cover" />
      ))}
    </Stack>
  )
}

function PostPlaces({ places, onPlacePress }: Pick<Post, 'places'> & { onPlacePress: (placeId: string) => void }) {
  const [firstPlace] = places
  if (firstPlace == null) return null

  return (
    <Stack sx={{ gap: 8 }}>
      <View style={{ height: 300, borderRadius: 12, overflow: 'hidden' }}>
        <Map defaultCenter={firstPlace}>
          {places.map((place) => (
            <Map.Marker key={place.placeId} id={place.placeId} label={place.name} lat={place.lat} lng={place.lng} variant="pin" />
          ))}
        </Map>
      </View>
      {places.map((place) => (
        <ListItem.Button key={place.placeId} onClick={() => onPlacePress(place.placeId)}>
          <ListItem.Title>{place.name}</ListItem.Title>
          {place.address && <ListItem.Text>{place.address}</ListItem.Text>}
        </ListItem.Button>
      ))}
    </Stack>
  )
}

function PostDetailLoading() {
  return <ActivityIndicator style={{ flex: 1 }} />
}

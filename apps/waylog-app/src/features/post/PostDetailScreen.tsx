import { MaterialIcons } from '@expo/vector-icons'
import { PostVisibility, type Post, usePost } from '@waylog/domains/modules/post'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListItem } from '../../shared/components/ListItem'
import { Map } from '../../shared/components/Map'
import { Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { PostAuthor } from './PostAuthor'
import { PostLikeButton } from './PostLikeButton'
import { PostMenu } from './PostMenu'
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
    <View style={styles.screen}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Stack direction="row" alignItems="center">
          <Pressable accessibilityLabel="뒤로가기" onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <Typography variant="subtitle1" style={styles.headerTitle}>포스트</Typography>
        </Stack>
        <PostMenu postId={postId} onDelete={() => router.back()} />
      </Stack>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <PostAuthor authorId={post.authorId} onPress={openAuthorProfile} />
        <PostTitle post={post} />
        <PostPhotoList photos={post.photos} />
        {post.description && <Typography style={styles.description}>{post.description}</Typography>}
        {post.visibility !== PostVisibility.PUBLIC && (
          <Stack direction="row" alignItems="center" style={styles.visibilityRow}>
            <MaterialIcons name="lock-outline" size={14} color={palette.textSecondary} />
            <Typography style={styles.visibilityLabel}>비공개</Typography>
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
      <View style={styles.emptyPhoto}>
        <MaterialIcons name="image" size={40} color={palette.textSecondary} />
      </View>
    )
  }

  return (
    <Stack style={styles.photoList}>
      {photos.map((photo) => (
        <LoadableImage key={photo.url} source={{ uri: photo.url }} style={styles.photoItem} resizeMode="cover" />
      ))}
    </Stack>
  )
}

function PostPlaces({ places, onPlacePress }: Pick<Post, 'places'> & { onPlacePress: (placeId: string) => void }) {
  const [firstPlace] = places
  if (firstPlace == null) return null

  return (
    <Stack style={styles.placesList}>
      <View style={styles.placesMap}>
        <Map defaultCenter={firstPlace}>
          {places.map((place) => (
            <Map.Marker
              key={place.placeId}
              id={place.placeId}
              label={place.name}
              lat={place.lat}
              lng={place.lng}
              variant="pin"
              onPress={() => onPlacePress(place.placeId)}
            />
          ))}
        </Map>
      </View>
      {places.map((place) => (
        <ListItem.Button key={place.placeId} onPress={() => onPlacePress(place.placeId)}>
          <ListItem.Title>{place.name}</ListItem.Title>
          {place.address && <ListItem.Text>{place.address}</ListItem.Text>}
        </ListItem.Button>
      ))}
    </Stack>
  )
}

function PostDetailLoading() {
  return <ActivityIndicator style={styles.loading} />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: palette.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.text,
  },
  visibilityRow: {
    gap: 4,
  },
  visibilityLabel: {
    fontSize: 11,
    color: palette.textSecondary,
  },
  emptyPhoto: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  photoList: {
    gap: 8,
  },
  photoItem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  placesList: {
    gap: 8,
  },
  placesMap: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
  },
})

import { AuthGuard } from '@waylog/domains/clients'
import { useBookmarkedPlaces } from '@waylog/domains/modules/place-bookmark'
import { FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppRoute } from '~app/AppRoute'
import { SignedOutRedirect } from '~features/auth/auth-redirect'
import { ExplorerPlaceRow } from '~features/explorer/explorer-place-item/ExplorerPlaceCard'
import { Typography } from '~shared/components/design-system'
import { AppBar } from '~shared/components/design-system/AppBar'
import { palette } from '~shared/config/tokens'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'

export function BookmarkedPlacesScreen() {
  return (
    <AuthGuard fallback={<SignedOutRedirect />}>
      <SafeAreaView style={styles.root}>
        <AppBar title="저장된 장소" />
        <BookmarkedPlaceList />
      </SafeAreaView>
    </AuthGuard>
  )
}

function BookmarkedPlaceList() {
  const { data: bookmarkedPlaces } = useBookmarkedPlaces()
  const navigation = useAppNavigation()

  return (
    <FlatList
      data={bookmarkedPlaces}
      keyExtractor={(place) => place.id}
      renderItem={({ item: place }) => (
        <ExplorerPlaceRow
          place={{
            placeId: place.id,
            name: place.name,
            address: place.address,
            categories: place.category == null ? [] : [place.category],
          }}
          onPress={() => navigation.navigate(AppRoute.장소_상세, { placeId: place.id })}
        />
      )}
      ListEmptyComponent={<Typography color="text.secondary" style={styles.empty}>저장한 장소가 없어요</Typography>}
    />
  )
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.저장된_장소]: undefined
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  empty: { textAlign: 'center', paddingVertical: 48 },
})

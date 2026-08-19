import { signOut } from '@waylog/domains/auth'
import { useTrips } from '@waylog/domains/trip'
import { Button, FlatList, StyleSheet, Text, View } from 'react-native'

export function TripListScreen() {
  const { data: trips } = useTrips()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 여행 {trips.length}건</Text>
        <Button title="로그아웃" onPress={() => signOut()} />
      </View>
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>여행이 없습니다</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.destinations.join(', ')} · {item.startDate} ~ {item.endDate}
            </Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { paddingVertical: 12 },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  separator: { height: 1, backgroundColor: '#eee' },
  empty: { color: '#666', paddingVertical: 24 },
})

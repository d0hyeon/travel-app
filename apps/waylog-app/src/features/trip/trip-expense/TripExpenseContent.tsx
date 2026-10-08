import { StyleSheet } from 'react-native'
import { Box } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import { ExpenseBody } from './ExpenseBody'
import { ExpenseHeader } from './ExpenseHeader'
import { ExpenseMenuFab } from './ExpenseMenuFab'

interface Props {
  tripId: string
}

export default function TripExpenseContent({ tripId }: Props) {
  return (
    <Box style={styles.container}>
      <ExpenseHeader tripId={tripId} />
      <ExpenseBody tripId={tripId} />
      <ExpenseMenuFab tripId={tripId} />
    </Box>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
})

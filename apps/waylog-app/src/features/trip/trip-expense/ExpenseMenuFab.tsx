import { useExpenses } from '@waylog/domains/modules/expense'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense } from 'react'
import { StyleSheet } from 'react-native'
import { MenuFab } from '~shared/components/design-system'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { FLOATING_TAB_BAR_RESERVE } from '~shared/components'
import { toast } from '~shared/components/toast/toast'
import { useOverlay } from '~shared/hooks/useOverlay'
import { palette } from '~shared/config/tokens'
import { RouteExpenseView } from './RouteExpenseView'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'

interface Props {
  tripId: string
}

export function ExpenseMenuFab({ tripId }: Props) {
  return (
    <Suspense fallback={null}>
      <Resolved tripId={tripId} />
    </Suspense>
  )
}

function Resolved({ tripId }: Props) {
  const { create } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const formBottomSheet = useExpenseFormBottomSheet(tripId)
  const overlay = useOverlay()
  const hasMember = members.length > 0

  const handleAddExpense = async () => {
    const data = await formBottomSheet.open()
    if (data) {
      try {
        await create(data);
        toast.success('지출내역이 등록됐어요.')
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`${error?.message}`)
        }
      }
    }
  }

  const handleOpenRouteExpense = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.95]} defaultSnapIndex={0}>
        <BottomSheet.Body>
          <Suspense fallback={null}>
            <RouteExpenseView tripId={tripId} />
          </Suspense>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  return (
    <MenuFab 
      onPress={handleAddExpense} 
      disabled={!hasMember} 
      style={styles.menuFab} 
      variant="inner"
      surface="plain"
    >
      <MenuFab.Item
        icon={<MaterialIcons name="add" size={18} color={palette.primary} />}
        onPress={handleAddExpense}
      >
        지출 추가
      </MenuFab.Item>
      <MenuFab.Item
        icon={<MaterialIcons name="route" size={18} color={palette.primary} />}
        onPress={handleOpenRouteExpense}
      >
        경로 기반
      </MenuFab.Item>
    </MenuFab>
  )
}

const styles = StyleSheet.create({
  menuFab: { bottom: FLOATING_TAB_BAR_RESERVE },
})

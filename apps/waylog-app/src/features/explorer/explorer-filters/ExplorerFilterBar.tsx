import { PlaceCategoryTypeLabel } from '@waylog/domains/modules/place'
import type { PropsWithChildren } from 'react'
import { StyleSheet, Pressable, ScrollView, type StyleProp, type ViewStyle } from 'react-native'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Chip, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { EXPLORER_CATEGORY_TYPES } from '../explorer.api'
import { useExplorerFilterParams } from './useExplorerFilterParams'
import { LocationForm } from '../../location/LocationForm'

export function ExplorerFilterBar({ children }: PropsWithChildren) {
  const { location, category, setLocation, setCategory } = useExplorerFilterParams()
  const overlay = useOverlay()

  const openLocationPicker = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.75]} safeArea>
        <BottomSheet.Header>지역 선택</BottomSheet.Header>
        <BottomSheet.Body>

          <LocationForm
            defaultValue={location ?? undefined}
            onSubmit={(selected) => { setLocation(selected); close() }}
          >
            <BottomSheet.BottomActions>
              <Button
                variant='outlined'
                color="error"
                size="large"
                onPress={() => {
                  setLocation(undefined)
                  close();
                }}
                fullWidth
              >
                초기화
              </Button>
              <LocationForm.SubmitButton>적용</LocationForm.SubmitButton>
            </BottomSheet.BottomActions>
          </LocationForm>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  const openCategoryPicker = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.65]}>
        <BottomSheet.Header>카테고리 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <BottomSheet.ScrollView contentContainerStyle={styles.options}>
            <OptionRow label="전체 카테고리" selected={category == null} onPress={() => { setCategory(undefined); close() }} />
            {EXPLORER_CATEGORY_TYPES.map((candidate) => (
              <OptionRow
                key={candidate}
                label={PlaceCategoryTypeLabel[candidate]}
                selected={candidate === category}
                onPress={() => { setCategory(candidate); close() }}
              />
            ))}
          </BottomSheet.ScrollView>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
      <Chip label={location ?? '지역'} size="small" variant="outlined" color={location ? 'primary' : 'default'} onPress={openLocationPicker} />
      <Chip label={category == null ? '카테고리' : PlaceCategoryTypeLabel[category]} size="small" variant="outlined" color={category ? 'primary' : 'default'} onPress={openCategoryPicker} />
      {children}
    </ScrollView>
  )
}

function OptionRow({ label, selected, onPress, style }: { label: string; selected: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, { backgroundColor: selected ? `${palette.primary}12` : 'transparent' }, style]}>
      <Typography variant="body2" fontWeight={selected ? 'bold' : 'medium'} color={selected ? 'primary' : 'text.primary'}>
        {label}
      </Typography>
      {selected && <Typography color="primary">✓</Typography>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  options: { padding: 16, gap: 4 },
  filters: { flexGrow: 0 },
  filtersContent: { gap: 8 },
  option: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8 },
  resetOption: { marginHorizontal: 24, marginBottom: 8 },
})

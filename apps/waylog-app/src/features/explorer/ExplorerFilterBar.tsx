import { PlaceCategoryTypeLabel } from '@waylog/domains/modules/place'
import type { PropsWithChildren } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Chip, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { EXPLORER_CATEGORY_TYPES } from './explorer.api'
import { useExplorerFilterParams } from './useExplorerFilterParams'
import { Locations } from '@waylog/domains/modules/location'

export function ExplorerFilterBar({ children }: PropsWithChildren) {
  const { location, category, setLocation, setCategory } = useExplorerFilterParams()
  const overlay = useOverlay()

  const openLocationPicker = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.75]}>
        <BottomSheet.Header>지역 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
            <OptionRow label="전체 지역" selected={location == null} onPress={() => { setLocation(undefined); close() }} />
            {Locations.map((candidate) => (
              <OptionRow
                key={candidate}
                label={candidate}
                selected={candidate === location}
                onPress={() => { setLocation(candidate); close() }}
              />
            ))}
          </ScrollView>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  const openCategoryPicker = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.65]}>
        <BottomSheet.Header>카테고리 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
            <OptionRow label="전체 카테고리" selected={category == null} onPress={() => { setCategory(undefined); close() }} />
            {EXPLORER_CATEGORY_TYPES.map((candidate) => (
              <OptionRow
                key={candidate}
                label={PlaceCategoryTypeLabel[candidate]}
                selected={candidate === category}
                onPress={() => { setCategory(candidate); close() }}
              />
            ))}
          </ScrollView>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
      <Chip label={location ?? '지역'} size="small" variant="outlined" color={location ? 'primary' : 'default'} onClick={openLocationPicker} />
      <Chip label={category == null ? '카테고리' : PlaceCategoryTypeLabel[category]} size="small" variant="outlined" color={category ? 'primary' : 'default'} onClick={openCategoryPicker} />
      {children}
    </ScrollView>
  )
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, backgroundColor: selected ? `${palette.primary}12` : 'transparent' }}>
      <Typography variant="body2" fontWeight={selected ? 'bold' : 'medium'} color={selected ? 'primary' : 'text.primary'}>
        {label}
      </Typography>
      {selected && <Typography color="primary">✓</Typography>}
    </Pressable>
  )
}

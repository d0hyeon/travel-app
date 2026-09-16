import { MaterialIcons } from '@expo/vector-icons'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useCallback, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, IconButton, Typography } from '~/shared/components/design-system'
import { FullScreenPopup } from '../../../../shared/components/FullScreenPopup'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { palette } from '../../../../shared/config/tokens'
import { TransportTicketForm, type TransportTicketFormRef } from './TransportTicketForm'
import type { TransportTicketDraft } from './transportTicket.types'

interface OpenParams {
  tripId: string
  type?: TripTransportType
  /** 업로드가 끝날 때까지 오버레이를 열어둔다. 던지면 패널에 에러가 남는다. */
  onSubmit: (tickets: TransportTicketDraft[]) => Promise<void>
}

// 상세 화면에서 탑승권을 덧붙이는 입구다.
// 업로드 중에는 닫지 않는다 -- 화면이 걷히면 진행과 실패를 볼 자리가 사라진다.
export function useTransportTicketFormOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    ({ tripId, type, onSubmit }: OpenParams) => {
      return new Promise<void>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <FullScreenPopup isOpen={isOpen} onClose={close}>
            <TransportTicketFormPanel
              tripId={tripId}
              type={type}
              onSubmit={async (tickets) => {
                await onSubmit(tickets)
                close()
                resolve()
              }}
              onClose={() => {
                close()
                resolve()
              }}
            />
          </FullScreenPopup>
        ))
      })
    },
    [overlay],
  )

  return { open }
}

interface PanelProps {
  tripId: string
  type?: TripTransportType
  onSubmit: (tickets: TransportTicketDraft[]) => Promise<void>
  onClose: () => void
}

function TransportTicketFormPanel({ tripId, type, onSubmit, onClose }: PanelProps) {
  const formRef = useRef<TransportTicketFormRef>(null)
  // FullScreenPopup 은 상단 인셋만 준다. absoluteFill 이라 푸터가 화면 맨 밑에
  // 붙어 홈 인디케이터에 깔리므로 하단은 여기서 띄운다.
  const insets = useSafeAreaInsets()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()

  const uploadTickets = async (tickets: TransportTicketDraft[]) => {
    setUploadError(undefined)
    setIsUploading(true)
    try {
      await onSubmit(tickets)
    } catch (error) {
      // 닫지 않는다. 고른 이미지가 패널에 남아 있어야 그대로 다시 누를 수 있다.
      setUploadError(error instanceof Error ? error.message : '탑승권을 올리지 못했어요')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Typography style={styles.title}>탑승권 추가</Typography>
        <IconButton disabled={isUploading} onPress={onClose}>
          <MaterialIcons name="close" size={20} color={palette.text} />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TransportTicketForm ref={formRef} tripId={tripId} type={type} onSubmit={uploadTickets} />
        {uploadError != null && (
          <Typography color="error" style={styles.errorText}>
            {uploadError}
          </Typography>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          loading={isUploading}
          onPress={() => formRef.current?.submit()}
        >
          추가
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 16, fontWeight: '700' },
  body: { padding: 16, gap: 12 },
  errorText: { fontSize: 13 },
  // fullWidth Button 은 flex:1 을 쓴다. column 컨테이너에 두면 높이가 0 으로
  // 접혀 구분선만 남는다. row 로 둬야 주축이 가로가 된다.
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    flexDirection: 'row',
    alignItems: 'center',
  },
})

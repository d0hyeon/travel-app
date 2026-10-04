import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useRef } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Button, Typography } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import {
  TransportTicketForm,
  type TransportTicketFormRef,
} from '~features/trip/trip-transport/transport-ticket/TransportTicketForm'
import type { TransportTicketDraft } from '~features/trip/trip-transport/transport-ticket/transportTicket.types'

interface Props {
  tripId: string
  type?: TripTransportType
  isSubmitting?: boolean
  onSkip: () => void
  onSubmit: (tickets: TransportTicketDraft[]) => void
}

export function TicketStep({ tripId, type, isSubmitting, onSkip, onSubmit }: Props) {
  const formRef = useRef<TransportTicketFormRef>(null)

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <Typography style={styles.heading}>탑승권을 올려둘까요?</Typography>
          <Typography style={styles.subtext}>
            선택사항이에요. 나중에 상세 화면에서 추가할 수 있어요.
          </Typography>
        </View>

        <TransportTicketForm ref={formRef} tripId={tripId} type={type} onSubmit={onSubmit} />
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="text" disabled={isSubmitting} onPress={onSkip}>
          건너뛰기
        </Button>
        <Button
          variant="contained"
          size="large"
          fullWidth
          loading={isSubmitting}
          onPress={() => formRef.current?.submit()}
        >
          완료
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 16, gap: 20 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtext: { fontSize: 12.5, color: palette.textSecondary },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
})

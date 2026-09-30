import { MaterialIcons } from '@expo/vector-icons'
import { REPORT_REASON_LABELS, useSubmitReport, type ReportInput, type ReportReason } from '@waylog/domains/modules/report'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet } from 'react-native'
import { Button, Stack, TextField, Typography } from '~/shared/components/design-system'
import { BottomSheet } from '~/shared/components/bottom-sheet/BottomSheet'
import { palette } from '~/shared/config/tokens'

export type ReportTarget = Pick<ReportInput, 'targetType' | 'targetId'>

interface Props {
  isOpen: boolean
  target: ReportTarget
  onCancel: () => void
  onSubmitted: () => void
}

const REPORT_REASONS = ['spam', 'inappropriate', 'harassment', 'other'] satisfies ReportReason[]
const MAX_DETAIL_LENGTH = 500

export function ReportSheet({ isOpen, target, onCancel, onSubmitted }: Props) {
  const submitReport = useSubmitReport()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')

  const handleSubmit = async () => {
    if (reason == null) return

    try {
      await submitReport({ ...target, reason, detail: detail.trim() || undefined })
    } catch {
      Alert.alert('신고를 접수하지 못했어요', '잠시 후 다시 시도해주세요')
      return
    }
    Alert.alert('신고가 접수되었어요', '검토 후 조치할게요')
    onSubmitted()
  }

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onCancel} snapPoints={[0.8]} safeArea>
      <BottomSheet.Header>신고하기</BottomSheet.Header>
      <BottomSheet.KeyboardAwareBody style={styles.body}>
        <Stack gap={1}>
          {REPORT_REASONS.map((value) => (
            <Pressable key={value} onPress={() => setReason(value)} style={styles.reasonRow}>
              <MaterialIcons
                name={reason === value ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={reason === value ? palette.primary : palette.textSecondary}
              />
              <Typography variant="body1">{REPORT_REASON_LABELS[value]}</Typography>
            </Pressable>
          ))}
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxLength={MAX_DETAIL_LENGTH}
          value={detail}
          onChangeText={setDetail}
          placeholder="상세 내용을 적어주세요 (선택)"
        />
      </BottomSheet.KeyboardAwareBody>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onPress={onCancel}>
          취소
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={reason == null}
          loading={submitReport.isPending}
          onPress={handleSubmit}
        >
          신고
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 16 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
})

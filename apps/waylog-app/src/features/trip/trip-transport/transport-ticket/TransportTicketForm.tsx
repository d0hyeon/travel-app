import { MaterialIcons } from '@expo/vector-icons'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import * as ImagePicker from 'expo-image-picker'
import { useImperativeHandle, useState, type Ref } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { PopMenu } from '../../../../shared/components/PopMenu'
import { palette, radius } from '../../../../shared/config/tokens'
import { TransportTypeIcon } from '../TransportTypeIcon'
import { useTicketDraftPreviewOverlay } from './useTicketDraftPreviewOverlay'
import type { TransportTicketDraft } from './transportTicket.types'

// 제출 버튼은 폼의 책임이 아니다. 퍼널 스텝과 오버레이가 각자 자리에 두고
// 이 핸들로 제출한다.
export interface TransportTicketFormRef {
  submit: () => void
}

interface Props {
  tripId: string
  /** 종류를 아는 맥락에서만 준다. 아이콘 배지에만 쓴다. */
  type?: TripTransportType
  onSubmit: (tickets: TransportTicketDraft[]) => void
  ref?: Ref<TransportTicketFormRef>
}

export function TransportTicketForm({ tripId, type, onSubmit, ref }: Props) {
  const { data: members } = useTripMembers(tripId)
  const draftPreview = useTicketDraftPreviewOverlay()
  const [tickets, setTickets] = useState<TransportTicketDraft[]>([])

  useImperativeHandle(ref, () => ({ submit: () => onSubmit(tickets) }), [onSubmit, tickets])

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    })
    if (result.canceled) return

    setTickets((prev) => [...prev, ...result.assets.map((asset) => ({ uri: asset.uri }))])
  }

  const updateMember = (index: number, memberId?: string) => {
    setTickets((prev) => prev.map((ticket, i) => (i === index ? { ...ticket, memberId } : ticket)))
  }

  const removeTicket = (index: number) => {
    setTickets((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <View style={styles.form}>
      <Pressable onPress={pickImages} style={styles.dropzone}>
        <MaterialIcons name="add-photo-alternate" size={28} color={palette.textSecondary} />
        <Typography style={styles.dropzoneLabel}>탑승권 이미지를 올려주세요</Typography>
      </Pressable>

      {tickets.length > 0 && (
        <View style={styles.tree}>
          {tickets.map((ticket, index) => {
            const owner = members.find((member) => member.id === ticket.memberId)
            const isLast = index === tickets.length - 1

            return (
              <View key={`${ticket.uri}-${index}`} style={styles.row}>
                {/* 선을 absolute 로 그리면 행 높이가 자식에 의해 정해지는 동안
                    bottom 이 기준점을 못 잡는다. 레이아웃 요소로 둔다. */}
                <View style={styles.guide}>
                  <View style={styles.guideTop} />
                  {!isLast && <View style={styles.guideLine} />}
                  <View style={styles.guideBranch} />
                </View>

                {/* 이미지를 그대로 늘어놓지 않는다. 티켓은 열어서 보는 것이고
                    목록에서는 누구 것인지만 알면 된다. */}
                <View style={[styles.item, !isLast && styles.itemSpaced]}>
                  <Pressable style={styles.card} onPress={() => draftPreview.open(ticket.uri)}>
                    <View style={styles.badge}>
                      {type == null ? (
                        <MaterialIcons
                          name="confirmation-number"
                          size={20}
                          color={palette.primary}
                        />
                      ) : (
                        <TransportTypeIcon type={type} size={20} color={palette.primary} />
                      )}
                    </View>

                    <View style={styles.cardBody}>
                      <Typography style={styles.cardTitle}>탑승권 {index + 1}</Typography>
                      {/* PopMenu 가 트리거를 스타일 없는 Pressable 로 감싼다.
                          그대로 두면 부모 너비를 다 차지해 블록처럼 보인다. */}
                      <View style={styles.ownerRow}>
                        <PopMenu
                          trigger={
                            <View style={styles.ownerTrigger}>
                              {/* 고르기 전에는 무엇을 고르는 자리인지 라벨이 대신한다. */}
                              <Typography style={styles.ownerLabel}>
                                {owner?.name ?? '탑승자'}
                              </Typography>
                              <MaterialIcons
                                name="expand-more"
                                size={16}
                                color={palette.textSecondary}
                              />
                            </View>
                          }
                          items={
                            <>
                              <PopMenu.Item
                                icon={<SelectedMark isSelected={ticket.memberId == null} />}
                                onPress={() => updateMember(index, undefined)}
                              >
                                공용
                              </PopMenu.Item>
                              {members.map((member) => (
                                <PopMenu.Item
                                  key={member.id}
                                  icon={<SelectedMark isSelected={ticket.memberId === member.id} />}
                                  onPress={() => updateMember(index, member.id)}
                                >
                                  {member.name}
                                </PopMenu.Item>
                              ))}
                            </>
                          }
                        />
                      </View>
                    </View>

                    <MaterialIcons name="chevron-right" size={18} color={palette.textSecondary} />
                  </Pressable>

                  <Pressable
                    onPress={() => removeTicket(index)}
                    hitSlop={8}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="close" size={18} color={palette.textSecondary} />
                  </Pressable>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

// 고른 항목을 아이콘으로 표시한다. 자리를 늘 차지해야 목록이 흔들리지 않는다.
function SelectedMark({ isSelected }: { isSelected: boolean }) {
  return (
    <MaterialIcons name="check" size={18} color={isSelected ? palette.primary : 'transparent'} />
  )
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  dropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 36,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.divider,
  },
  dropzoneLabel: { fontSize: 13.5, color: palette.textSecondary },
  // 업로드 영역에 딸린 목록임을 선으로 드러낸다.
  tree: { marginLeft: 4 },
  // 간격을 gap 이나 패딩으로 두면 그 구간이 콘텐츠 바깥이라 stretch 가
  // 닿지 않고 줄기가 끊긴다. 간격은 카드가 마진으로 만든다.
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  guide: { width: 16, position: 'relative' },
  guideTop: { height: 29, width: 1, backgroundColor: palette.divider },
  guideLine: { flex: 1, width: 1, backgroundColor: palette.divider },
  guideBranch: {
    position: 'absolute',
    left: 0,
    top: 29,
    width: 16,
    height: 1,
    backgroundColor: palette.divider,
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // 간격은 카드가 아니라 행 전체가 갖는다. 카드에 마진을 주면
  // 그만큼 늘어난 높이의 중앙을 잡아 삭제 버튼이 내려간다.
  itemSpaced: { marginBottom: 10 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,

    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.background,
  },
  badge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.primaryContainer,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 11, color: palette.textSecondary },
  ownerRow: { flexDirection: 'row' },
  ownerTrigger: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ownerLabel: { fontSize: 14, fontWeight: '700' },
  removeButton: {
    flexShrink: 0,
    width: 40,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

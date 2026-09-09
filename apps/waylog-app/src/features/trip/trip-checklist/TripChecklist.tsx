import { StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons';
import { Box, Skeleton, Stack, Typography, type StackProps } from "~/shared/components/design-system";
import { Checkbox } from "~/shared/components/design-system/Checkbox";
import { Chip } from "~/shared/components/design-system/Chip";
import { PopMenu } from "../../../shared/components/PopMenu";
import { differenceInDays, formatDate, isAfter, isBefore } from "date-fns";
import { Suspense, useMemo, type ComponentProps, type MouseEvent } from "react";
import { match, P } from 'ts-pattern';
import { ListItem } from "../../../shared/components/ListItem";
import { SwitchCase } from "../../../shared/components/SwitchCase";
import { assert } from '@waylog/utility';
import { useConfirmDialog } from "../../../shared/components/confirm-dialog/useConfirmDialog";
import { TripChecklistModifyMenuItem } from "./TripChecklistModifyMenuItem";
import { formatRemainTime } from "@waylog/utility";
import { useTripMembers } from '@waylog/domains/modules/trip-member';
import { ERROR_DAYS_FROM_DEADLINE, WARNING_DAYS_FROM_DEADLINE } from '@waylog/domains/modules/trip-checklist';
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const StatusInDays = {
  error: ERROR_DAYS_FROM_DEADLINE,
  warning: WARNING_DAYS_FROM_DEADLINE
} as const;

interface Props extends StackProps {
  tripId: string;
}

const now = Date.now()
export function TripChecklist(props: Props) {
  return (
    <Stack gap={1} {...props}>
      <Suspense
        fallback={(
          <>
            <ListItem><Skeleton /></ListItem>
            <ListItem><Skeleton /></ListItem>
          </>
        )}
      >
        <Resolved {...props} />
      </Suspense>
    </Stack>
  )
}
function Resolved({ tripId }: Props) {
  const { data: { checklist } } = useTripChecklist(tripId);

  return (
    <Stack gap={1}>
      {checklist.length > 0
        ? checklist.map(x => <TripChecklist.Item id={x.id} key={x.id} tripId={tripId} />)
        : <Typography variant="body2" color="text.secondary" style={styles.emptyMessage}>체크리스트가 없어요</Typography>}
    </Stack>
  )
}

TripChecklist.Item = TripChecklistItem;
interface ItemProps extends ComponentProps<typeof ListItem> {
  tripId: string;
  id: string;
}


function TripChecklistItem({ tripId, id, ...props }: ItemProps) {
  const { data: { checklist }, update } = useTripChecklist(tripId);
  const value = checklist.find(x => x.id === id);
  assert(!!value, '존재하지 않는 항목입니다.')

  const { data: members } = useTripMembers(tripId);

  const remainTimeText = useMemo(() => {
    if (value.endedAt == null || value.isCompleted) return;
    if (isAfter(value.endedAt, now)) {
      return formatRemainTime(value.endedAt, '# 남음')
    }
    return '시간 초과';
  }, [value])

  const startTimeText = value.startedAt ? `${formatDate(value.startedAt, 'MM/dd HH:mm')}` : undefined;
  const endTimeText = value.endedAt ? formatDate(value.endedAt, 'MM/dd HH:mm') : undefined;

  const 담당자 = members.find(member => member.id === value.memberId);
  const remainDays = value.endedAt ? differenceInDays(value.endedAt, now) : undefined;
  const status = match(remainDays)
    .with(P.number.lt(StatusInDays.error), () => 'error' as const)
    .with(P.number.lt(StatusInDays.warning), () => "warning" as const)
    .otherwise(() => undefined)

  // rotateX 는 원근(perspective) 이 없으면 세로로 눌리기만 하고 회전으로 보이지 않는다.
  const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotation.get()}deg` },
    ],
  }))

  return (
    <ListItem
      style={[
        [styles.checklistItem, { borderColor: value.isCompleted ? 'rgba(76,132,255,0.4)' : 'rgba(221,221,221,0.4)', borderWidth: value.isCompleted ? 2 : 1 }],
        animatedStyle,
      ]}
      as={Animated.View}
      leftAddon={(
        <Checkbox
          checked={value.isCompleted}
          size="small"
          onChange={() => {
            update({ id: value.id, isCompleted: !value.isCompleted })
            // 매번 0 에서 다시 시작해야 두 번째 이후에도 회전한다.
            rotation.set(
              withTiming(360, { duration: 300 }, () => rotation.set(0)),
            )
          }}
          style={styles.checkbox}
        />
      )}
      rightAddon={<TripChecklistMenu tripId={tripId} id={value.id} />}
      {...props}
    >
      <Stack gap={0.5}>
        <Stack direction="row" gap={0.5} alignItems="center">
          {!value.isCompleted && (
            <SwitchCase
              value={status}
              cases={{
                error: <MaterialIcons name="error" size={16} color="#d32f2f" />,
                warning: <MaterialIcons name="alarm-on" size={16} color="#d68d06" />
              }}
              defaultComponent={() => <MaterialIcons name="access-time" size={16} color="#787c7e" />}
            />
          )}
          <ListItem.Title style={value.isCompleted ? styles.completedTitle : {}}>
            {value.title}
          </ListItem.Title>
        </Stack>


        {(!!startTimeText || !!endTimeText) && (
          <ListItem.Text
            color={!value.isCompleted ? status : undefined}
            style={value.isCompleted ? styles.completedTitle : {}}
          >
            {startTimeText} ~ {endTimeText}{remainTimeText ? ` (${remainTimeText})` : ''}
          </ListItem.Text>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={0.5}>
          {!!value.content && value.content.trim() !== '' && (
            <ListItem.Text style={value.isCompleted ? styles.completedTitle : {}}>
              {value.content}
            </ListItem.Text>
          )}
          {담당자 && (
            <Box style={styles.actions}>
              <Chip
                size="small"
                label={`${담당자.name}`}
                style={{ opacity: value.isCompleted ? 0.5 : 1 }}
              />
            </Box>
          )}
        </Stack>

      </Stack>
    </ListItem>
  )
}


TripChecklist.ReadonlyItem = ReadonlyItem;
function ReadonlyItem({ id, tripId, ...props }: ItemProps) {
  const { data: { checklist } } = useTripChecklist(tripId);
  const value = checklist.find(x => x.id === id);
  assert(!!value, '존재하지 않는 항목입니다.');

  const { data: members } = useTripMembers(tripId)

  const member = members.find(member => value.memberId === member.id);
  const remainDays = value.endedAt ? differenceInDays(value.endedAt, now) : Infinity;
  const status = match(remainDays)
    .with(P.number.lt(StatusInDays.error), () => 'error' as const)
    .with(P.number.lt(StatusInDays.warning), () => 'warning' as const)
    .otherwise(() => undefined)


  return (
    <ListItem
      alignItems="flex-start"
      justifyContent="flex-start"
      gap={0.5}
      style={styles.readonlyItem}
      leftAddon={(
        <Box style={styles.completionIcon}>
          <SwitchCase
            value={status}
            cases={{
              error: <MaterialIcons name="error" size={16} color="#d32f2f" />,
              warning: <MaterialIcons name="alarm-on" size={16} color="#d68d06" />
            }}
            defaultComponent={<MaterialIcons name="access-time" size={16} color="#787c7e" />}
          />
        </Box>
      )}
      {...props}
    >
      <Stack direction="row" gap={0.5} justifyContent="space-between">
        <ListItem.Title>{value.title}</ListItem.Title>
        {!!value.endedAt && (
          <ListItem.Text color={status}>
            {isBefore(value.endedAt, now)
              ? '시간 초과'
              : formatRemainTime(value.endedAt, '# 남음', '마감 임박')}
          </ListItem.Text>
        )}

      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <ListItem.Text>{value.content}</ListItem.Text>

        <Box>
          {member && (
            <Chip
              size="small"
              label={member.name}
              style={styles.assignee}
            />
          )}
        </Box>
      </Stack>
    </ListItem>
  )
}

type CheckMenuProps = {
  tripId: string;
  id: string;
}

function TripChecklistMenu({ id, tripId }: CheckMenuProps) {
  const { data: { checklist }, remove } = useTripChecklist(tripId);
  const confirm = useConfirmDialog();

  const target = checklist.find(x => x.id === id);
  assert(target != null, '존재하지 않는 항목입니다.');

  return (
    <PopMenu
      items={
        <>
          <TripChecklistModifyMenuItem tripId={tripId} id={target.id} />
          <PopMenu.Item
            color="error"
            onPress={async () => {
              if (await confirm('삭제하시겠어요?')) {
                await remove(id);
              }
            }}
          >
            삭제
          </PopMenu.Item>
        </>
      }
    />
  )
}

const styles = StyleSheet.create({
  emptyMessage: { paddingVertical: 24 },
  checklistItem: { paddingVertical: 16 },
  checkbox: { padding: 0 },
  completedTitle: { opacity: 0.5 },
  actions: { flex: 0 },
  readonlyItem: { borderColor: 'rgba(221,221,221,0.4)' },
  completionIcon: { minWidth: 20 },
  assignee: { height: 20 },
})

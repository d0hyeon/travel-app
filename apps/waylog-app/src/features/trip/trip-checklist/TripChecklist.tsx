import { MaterialIcons } from '@expo/vector-icons';
import { Box, Skeleton, Stack, Typography, type StackProps } from "../../../shared/components/mui";
import { Checkbox } from "../../../shared/components/mui/Checkbox";
import { Chip } from "../../../shared/components/mui/Chip";
import { PopMenu } from "../../../shared/components/PopMenu";
import { differenceInDays, formatDate, isAfter, isBefore } from "date-fns";
import { Suspense, useMemo, type ComponentProps, type MouseEvent } from "react";
import { match, P } from 'ts-pattern';
import { ListItem } from "../../../shared/components/ListItem";
import { SwitchCase } from "../../../shared/components/SwitchCase";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { assert } from '@waylog/utility';
import { useConfirmDialog } from "../../../shared/components/confirm-dialog/useConfirmDialog";
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { Button } from "../../../shared/components/mui";
import { TripChecklistForm, type TripChecklistFormRef } from "./TripChecklistForm";
import { formatRemainTime } from "@waylog/utility";
import { useTripMembers } from '@waylog/domains/modules/trip-member';
import { ERROR_DAYS_FROM_DEADLINE, WARNING_DAYS_FROM_DEADLINE } from '@waylog/domains/modules/trip-checklist';
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist';

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
        : <Typography variant="body2" color="text.secondary" sx={{ paddingVertical: 24 }}>체크리스트가 없어요</Typography>}
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

  return (
    <ListItem
      sx={{
        borderColor: value.isCompleted ? 'rgba(76,132,255,0.4)' : 'rgba(221,221,221,0.4)',
        borderWidth: value.isCompleted ? 2 : 1,
        paddingVertical: 16,
      }}
      leftAddon={(
        <Checkbox
          checked={value.isCompleted}
          size="small"
          onChange={() => update({ id: value.id, isCompleted: !value.isCompleted })}
          sx={{ padding: 0 }}
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
          <ListItem.Title sx={value.isCompleted ? { opacity: 0.5 } : {}}>
            {value.title}
          </ListItem.Title>
        </Stack>


        {(!!startTimeText || !!endTimeText) && (
          <ListItem.Text
            color={!value.isCompleted ? status : undefined}
            sx={value.isCompleted ? { opacity: 0.5 } : {}}
          >
            {startTimeText} ~ {endTimeText}{remainTimeText ? ` (${remainTimeText})` : ''}
          </ListItem.Text>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={0.5}>
          {!!value.content && value.content.trim() !== '' && (
            <ListItem.Text sx={value.isCompleted ? { opacity: 0.5 } : {}}>
              {value.content}
            </ListItem.Text>
          )}
          {담당자 && (
            <Box sx={{ flex: 0, fontSize: 0 }}>
              <Chip
                size="small"
                label={`${담당자.name}`}
                                sx={{ opacity: value.isCompleted ? 0.5 : 1 }}
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
      sx={{ borderColor: 'rgba(221,221,221,0.4)' }}
      leftAddon={(
        <Box sx={{ minWidth: 20 }}>
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
              sx={{ height: 20 }}
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
  const { data: { checklist }, remove, update } = useTripChecklist(tripId);
  const confirm = useConfirmDialog();
  const overlay = useOverlay();

  const openEditor = () => {
    const target = checklist.find(x => x.id === id);
    if (target == null) return;

    overlay.open(({ isOpen, close }) => {
      const formRef = { current: null as TripChecklistFormRef | null };

      return (
        <BottomSheet isOpen={isOpen} onClose={close} snapPoints={[0.6]} defaultSnapIndex={0}>
          <BottomSheet.Header>할 일 수정</BottomSheet.Header>
          <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
            <TripChecklistForm
              ref={(instance) => { formRef.current = instance }}
              tripId={tripId}
              defaultValues={{
                title: target.title,
                content: target.content,
                startedAt: target.startedAt,
                endedAt: target.endedAt,
                memberId: target.memberId,
              }}
              onSubmit={async (value) => {
                await update({ id, ...value });
                close();
              }}
            />
          </BottomSheet.Body>
          <BottomSheet.BottomActions>
            <Button variant="outlined" fullWidth onClick={close}>취소</Button>
            <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>저장</Button>
          </BottomSheet.BottomActions>
        </BottomSheet>
      );
    });
  };

  return (
    <PopMenu
      items={
        <>
          <PopMenu.Item
            onClick={openEditor}
          >
            수정
          </PopMenu.Item>
          <PopMenu.Item
            color="error"
            onClick={async () => {
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

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import ErrorIcon from '@mui/icons-material/Error';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { alpha, Box, Checkbox, Chip, ClickAwayListener, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Stack, Typography, type StackProps } from "@mui/material";
import { differenceInDays, formatDate, isAfter, isBefore } from "date-fns";
import { useMemo, type ComponentProps, type MouseEvent } from "react";
import { match, P } from 'ts-pattern';
import { ListItem } from "~shared/components/ListItem";
import { SwitchCase } from "~shared/components/SwitchCase";
import { useIsMobile } from "~shared/hooks/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { assert } from '~shared/lib/assert';
import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";
import { formatRemainTime } from "~shared/utils/formats";
import { useTripMembers } from "../trip-member/useTripMembers";
import { ERROR_DAYS_FROM_DEADLINE, WARNING_DAYS_FROM_DEADLINE } from './tripChecklist.constants';
import { useTripChecklistModifyOverlay } from "./TripChecklistModifyIconButton";
import { useTripChecklist } from "./useTripChecklist";

const StatusInDays = {
  error: ERROR_DAYS_FROM_DEADLINE,
  warning: WARNING_DAYS_FROM_DEADLINE
} as const;

interface Props extends StackProps {
  tripId: string;
}

const now = Date.now()

export function TripChecklist({ tripId, ...props }: Props) {
  const { data: { checklist } } = useTripChecklist(tripId);

  return (
    <Stack gap={1} {...props}>
      {checklist.length > 0
        ? checklist.map(x => <TripChecklist.Item id={x.id} key={x.id} tripId={tripId} />)
        : <Typography variant="body2" color="textSecondary" paddingY={3}>체크리스트가 없어요</Typography>}

    </Stack>
  )
}

interface ItemProps extends ComponentProps<typeof ListItem> {
  tripId: string;
  id: string;
}

TripChecklist.Item = ({ tripId, id, ...props }: ItemProps) => {
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

  const startTimeText = !!value.startedAt ? `${formatDate(value.startedAt, 'MM/dd hh:mm')}` : undefined;
  const endTimeText = !!value.endedAt ? formatDate(value.endedAt, 'MM/dd hh:mm') : undefined;

  const 담당자 = members.find(member => member.id === value.memberId);
  const remainDays = value.endedAt ? differenceInDays(value.endedAt, now) : undefined;
  const status = match(remainDays)
    .with(P.number.lt(StatusInDays.error), () => 'error' as const)
    .with(P.number.lt(StatusInDays.warning), () => "warning" as const)
    .otherwise(() => undefined)

  const isMobile = useIsMobile();

  return (
    <ListItem
      position="relative"
      borderColor={theme => value.isCompleted
        ? alpha(theme.palette.primary.main, 0.4)
        : alpha('#ddd', 0.4)
      }
      sx={[
        { transition: 'all 200ms', borderWidth: value.isCompleted ? 2 : 1 },
        // isEnded ? { opacity: 0.8 } : {},
        !value.isCompleted ? { boxShadow: '1px 2px 6px #ddd' } : {},
        value.isCompleted ? { transform: 'rotateX(360deg)' } : {}
      ]}
      leftAddon={(
        <Checkbox
          checked={value.isCompleted}
          size="small"
          onChange={() => update({ id: value.id, isCompleted: !value.isCompleted })}
          sx={isMobile ? { padding: 0 } : {}}
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
                error: <ErrorIcon color="error" fontSize="small" sx={{ fontSize: 16, display: 'block' }} />,
                warning: <AlarmOnIcon color="warning" fontSize="small" sx={{ fontSize: 16, display: 'block' }} />
              }}
              defaultComponent={() => <AccessTimeIcon fontSize='small' sx={{ fontSize: 16, display: 'block' }} />}
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
          {value.content && value.content.trim() !== '' && (
            <ListItem.Text sx={value.isCompleted ? { opacity: 0.5 } : {}}>
              {value.content}
            </ListItem.Text>
          )}
          {담당자 && (
            <Box sx={{ flex: 0, fontSize: 0 }}>
              <Chip
                size="small"
                label={`${담당자.emoji} ${담당자.name}`}
                variant="outlined"
                sx={theme => ({
                  color: theme.palette.text.secondary,
                  height: 20,
                  paddingX: 0,
                  fontSize: 11,
                  opacity: value.isCompleted ? 0.5 : 1
                })}
              />
            </Box>
          )}
        </Stack>

      </Stack>
    </ListItem>
  )
}

TripChecklist.ReadonlyItem = ({ id, tripId, ...props }: ItemProps) => {
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

  const isMobile = useIsMobile();

  return (
    <ListItem
      alignItems="start"
      justifyContent="start"
      gap={0.5}
      borderColor={alpha('#ddd', 0.4)}
      leftAddon={(
        <Box minWidth={20}>
          <SwitchCase
            value={status}
            cases={{
              error: <ErrorIcon color="error" fontSize="small" sx={{ display: 'block' }} />,
              warning: <AlarmOnIcon color="warning" fontSize="small" sx={{ width: 20, display: 'block' }} />
            }}
            defaultComponent={<AccessTimeIcon fontSize="small" sx={{ width: 20, display: 'block' }} />}
          />
        </Box>
      )}
      sx={{ boxShadow: '1px 2px 6px #ddd' }}
      {...props}
    >
      <Stack direction="row" gap={0.5} justifyContent="space-between">
        <ListItem.Title>{value.title}</ListItem.Title>
        {value.endedAt && (
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
              variant="outlined"
              size="small"
              label={`${member.emoji} ${member.name}`}
              sx={isMobile ? { fontSize: 10, padding: 0, height: 20, span: { paddingX: 0.5 } } : {}}
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
  const { remove } = useTripChecklist(tripId);

  const {
    openDialog: openModifyDialog,
    openBottomSheet: openModifyBottomSheet,
  } = useTripChecklistModifyOverlay(tripId);

  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const confirm = useConfirmDialog();

  const openMenu = <T extends HTMLElement>(event: MouseEvent<T>) => {
    overlay.open(({ isOpen, close }) => (
      <Popper
        open={isOpen}
        anchorEl={event.target as HTMLElement}
        role={undefined}
        placement="auto"
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'left top' : 'left bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={close}>
                <MenuList
                  id="composition-menu"
                  aria-labelledby="composition-button"
                >
                  <MenuItem
                    onClick={() => {
                      isMobile ? openModifyBottomSheet(id) : openModifyDialog(id);
                      close();
                    }}
                  >
                    수정
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      if (await confirm('삭제하시겠어요?')) {
                        await remove(id);
                      }
                      close();
                    }}
                  >삭제</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    ))
  }


  return (
    <IconButton onClick={(event) => openMenu(event)}>
      <MoreVertIcon />
    </IconButton>
  )
}
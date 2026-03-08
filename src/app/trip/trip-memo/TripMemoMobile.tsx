import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SendIcon from '@mui/icons-material/Send';
import {
  ClickAwayListener,
  Grow,
  IconButton,
  InputBase,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
  type StackProps
} from "@mui/material";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ResizeObserverArea } from '~shared/components/ResizeObserverArea';
import { useVariation } from '~shared/hooks/useVariation';
import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";
import { useTripMemo } from "./useTripMemo";
import { useAnimation } from '~shared/hooks/useAnimation';

const LONG_PRESS_DURATION = 500;

interface Props {
  tripId: string;
}

export function TripMemoMobile({ tripId }: Props) {
  const { data: { memos, pinnedMemos }, add, update } = useTripMemo(tripId);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const unpinnedMemos = memos.filter((m) => !m.isPinned);
  const isEditing = editingId !== null;


  const [isSubmitting, startSubmit] = useTransition();
  const handleSubmit = async () => {
    if (isSubmitting) return;
    const content = inputValue.trim();
    if (!content) return;

    startSubmit(async () => {
      if (editingId) {
        await update({ id: editingId, content });
        setEditingId(null);
      } else {
        await add({ content });
      }
      setInputValue('');
      inputRef.current?.blur();
    })
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && isEditing) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setInputValue(content);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInputValue('');
  };
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [getContainerHeight, setContainerHeight] = useVariation(0);
  const [isPinSummaryView, setIsPinSummaryView] = useState(true);

  useEffect(() => {
    if (container) {
      const height = container.scrollHeight
      container.scrollTo({
        top: height,
        behavior: 'smooth'
      });
      setContainerHeight(height)
    }
  }, [container]);

  return (
    <Stack height="100%" position="relative" >
      {/* 메모 리스트 */}
      <Stack
        flex={1}
        overflow="auto"
        pb={8}
        ref={setContainer}
      >
        {/* 고정된 메모 */}
        {pinnedMemos.length > 0 && (
          <Stack
            position="sticky"
            top={0}
            zIndex={10}
            pl={2}
            pt={0.5}
            pb={1.5}
            gap={1}
            boxShadow="0px 3px 6px #ddd"
            bgcolor="#fff"
            alignItems="start"
          >
            <Stack direction="row" justifyContent="space-between" width="100%" position="relative">
              <Stack direction="row" alignItems="center" gap={0.5} >
                <PushPinIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="caption" color="primary" sx={{ fontSize: 11 }}>
                  고정됨
                </Typography>
              </Stack>
              <IconButton onClick={() => setIsPinSummaryView(!isPinSummaryView)} sx={{ position: 'absolute', right: 1, top: '50%', transform: 'translateY(-50%)' }}>
                {isPinSummaryView ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
              </IconButton>
            </Stack>
            <Stack width="100%" gap={1} paddingRight={2}>
              {isPinSummaryView
                ? (
                  <MemoItem
                    tripId={tripId}
                    id={pinnedMemos[0].id}
                    onEdit={handleStartEdit}
                  />
                ) : pinnedMemos.map((memo) => (
                  <MemoItem
                    key={memo.id}
                    tripId={tripId}
                    id={memo.id}
                    onEdit={handleStartEdit}
                  />
                ))
              }
            </Stack>
          </Stack>
        )}

        {/* 일반 메모 */}
        <ResizeObserverArea
          onResize={({ contentRect: { height } }) => {
            const prevHeight = getContainerHeight();
            if (height > prevHeight) {
              container?.scrollTo({ top: height, behavior: 'smooth' })
            }
            setContainerHeight(height);
          }}
        >
          <Stack gap={1.5} p={2} >
            {unpinnedMemos.length > 0 ? (
              unpinnedMemos.map((memo) => (
                <MemoItem
                  key={memo.id}
                  tripId={tripId}
                  id={memo.id}
                  onEdit={handleStartEdit}
                />
              ))
            ) : memos.length === 0 ? (
              <Typography variant="body2" color="textSecondary" paddingY={3} textAlign="center">
                메모가 없어요
              </Typography>
            ) : null}
          </Stack>
        </ResizeObserverArea>
      </Stack>

      {/* 하단 입력 필드 */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 1.5,
          paddingTop: 0.5,
          borderRadius: 0,
        }}
      >
        {isEditing && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" py={0.5}>
            <Typography variant="caption" color="primary">
              메모 수정 중
            </Typography>
            <IconButton size="small" onClick={handleCancelEdit}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
        <Stack direction="row" alignItems="flex-end" gap={1}>
          <InputBase
            inputRef={inputRef}
            multiline
            maxRows={4}
            placeholder={isEditing ? "수정할 내용을 입력하세요" : "메모를 입력하세요"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              flex: 1,
              bgcolor: isEditing ? 'primary.50' : 'grey.100',
              borderRadius: 2,
              px: 1.5,
              py: 1,
              transition: 'background-color 0.2s',
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !inputValue.trim()}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Stack >
  );
}

interface MemoItemProps extends StackProps {
  tripId: string;
  id: string;
  onEdit: (id: string, content: string) => void;
}

function MemoItem({ tripId, id, onEdit, ...stackProps }: MemoItemProps) {
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId);
  const confirm = useConfirmDialog();
  const memo = memos.find((m) => m.id === id);

  const elementRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justOpenedRef = useRef(false);

  const animation = useAnimation({
    frames: [
      { transform: 'scale(1)', offset: 0, },
      { transform: 'scale(1.1)', offset: 0.5, },
      { transform: 'scale(1)', offset: 1, }
    ],
    duration: 300
  })

  // iOS Safari 롱프레스 지원을 위해 네이티브 이벤트 리스너 사용
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      // 메뉴 버튼 터치 시 롱프레스 무시 (클릭 이벤트 허용)
      if (menuButtonRef.current?.contains(e.target as Node)) {
        return;
      }

      e.preventDefault(); // iOS 기본 제스처 방지
      longPressTimer.current = setTimeout(() => {
        justOpenedRef.current = true;
        setMenuAnchor(element);
        navigator.vibrate?.([100]);
        animation.play({ element });
      }, LONG_PRESS_DURATION);
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const handleTouchMove = () => {
      // 터치 이동 시 롱프레스 취소
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);
    element.addEventListener('touchmove', handleTouchMove);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleCloseMenu = useCallback(() => {
    if (justOpenedRef.current) {
      justOpenedRef.current = false;
      return;
    }
    setMenuAnchor(null);
  }, []);

  const handleTogglePin = () => {
    togglePin(id);
    setMenuAnchor(null);
  };

  const handleDelete = async () => {
    setMenuAnchor(null);
    if (await confirm('이 메모를 삭제하시겠습니까?')) {
      await remove(id);
    }
  };

  const handleEdit = () => {
    setMenuAnchor(null);
    if (memo) {
      onEdit(id, memo.content);
    }
  };

  if (!memo) return null;

  return (
    <>
      <Stack
        ref={elementRef}
        direction="row"
        gap={1}
        alignItems="center"
        justifyContent="space-between"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuAnchor(e.currentTarget as HTMLElement);
        }}
        sx={[
          {
            py: 0.5,
            pl: 2,
            pr: 0.5,
            borderColor: 'primary.main',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
            borderRadius: '12px',
            boxShadow: '0px 2px 8px #ddd'
          },
          memo.isPinned
            ? theme => ({

              bgcolor: 'primary.50',
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              // borderTopLeftRadius: 8,
              // borderBottomLeftRadius: 8,
              boxShadow: '0px 2px 8px #ddd'
            })
            : {}
        ]}
        {...stackProps}
      >
        <Stack direction="row" gap={2} alignItems="end" width="100%" justifyContent="space-between">
          <Typography
            variant="caption"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {memo.content}
          </Typography>
        </Stack>
        <IconButton ref={menuButtonRef} onClick={(event) => setMenuAnchor(event.currentTarget as HTMLElement)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>

      </Stack>

      {/* 롱클릭 메뉴 */}
      <Popper
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        placement="top"
        transition
        sx={{ zIndex: 1000 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={8} >
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <MenuList>
                  <MenuItem onClick={handleTogglePin}>
                    {memo.isPinned ? (
                      <>
                        <PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                        고정 해제
                      </>
                    ) : (
                      <>
                        <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
                        고정
                      </>
                    )}
                  </MenuItem>
                  <MenuItem onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    수정
                  </MenuItem>
                  <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    삭제
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

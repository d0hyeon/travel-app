import { MaterialIcons } from '@expo/vector-icons';
import { Skeleton, Stack, Typography, type StackProps } from "~/shared/components/design-system";
import { Suspense } from "react";
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ListItem } from "../../../shared/components/ListItem";
import { useTripMemo } from '@waylog/domains/modules/trip-memo';
import { getMemoDisplayTitle } from './memoTitle';

interface Props extends StackProps {
  tripId: string;
  /** true면 고정된 메모가 없을 때 제목을 포함해 아무것도 렌더하지 않는다. */
  hideOnEmpty?: boolean;
}

export function TripPinnedMemos(props: Props) {
  return (
    <Suspense fallback={<Pending {...props} />}>
      <Resolved {...props} />
    </Suspense>
  );
}

function Pending({ tripId: _tripId, hideOnEmpty: _hideOnEmpty, ...props }: Props) {
  return (
    <Stack gap={1} sx={{ width: "100%" }} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        고정된 메모
      </Typography>
      <ListItem sx={{ width: "100%" }}>
        <Skeleton variant='text' />
      </ListItem>
    </Stack>
  );
}

function Resolved({ tripId, hideOnEmpty, ...props }: Props) {
  const { data: { pinnedMemos } } = useTripMemo(tripId);
  const router = useRouter();

  if (pinnedMemos.length === 0 && hideOnEmpty) return null;

  return (
    <Stack gap={1} sx={{ width: "100%" }} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        고정된 메모
      </Typography>
      {pinnedMemos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ paddingVertical: 24 }}>
          고정된 메모가 없어요
        </Typography>
      ) : pinnedMemos.map((memo) => {
        const preview = memo.content;
        const displayTitle = getMemoDisplayTitle(memo.title, memo.content);
        const trimmedTitle = memo.title?.trim() ?? '';
        const hasExplicitTitle = trimmedTitle.length > 0;
        const previewText = hasExplicitTitle ? preview : null;

        return (
          <Pressable key={memo.id} onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}`)}>
            <ListItem
              leftAddon={<MaterialIcons name="push-pin" size={16} color="#4C84FF" />}
              sx={{ paddingVertical: 8 }}
            >
              <Typography variant="caption">
                {displayTitle}
              </Typography>
              {previewText && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  numberOfLines={1}
                >
                  {previewText}
                </Typography>
              )}
            </ListItem>
          </Pressable>
        )
      })}
    </Stack>
  );
}

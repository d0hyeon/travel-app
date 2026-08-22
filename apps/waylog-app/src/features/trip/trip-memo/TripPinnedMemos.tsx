import { MaterialIcons } from '@expo/vector-icons';
import { Skeleton, Stack, Typography, type StackProps } from "../../../shared/components/mui";
import { Suspense } from "react";
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ListItem } from "../../../shared/components/ListItem";
import { useTripMemo } from '@waylog/domains/modules/trip-memo';

interface Props extends StackProps {
  tripId: string;
  throwOnEmpty?: boolean;
}

export function TripPinnedMemos({ tripId, ...props }: Props) {
  return (
    <Stack gap={1} sx={{ width: "100%" }} {...props}>
      <Suspense fallback={(
        <ListItem sx={{ width: "100%" }}>
          <Skeleton variant='text' />
        </ListItem>
      )}>
        <TripPinnedMemosContent tripId={tripId} {...props} />
      </Suspense>
    </Stack>
  );
}


function TripPinnedMemosContent({ tripId, throwOnEmpty, ...props }: Props) {
  const { data: { pinnedMemos } } = useTripMemo(tripId);
  const router = useRouter();

  if (pinnedMemos.length === 0) return null;

  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        고정된 메모
      </Typography>
      {pinnedMemos.map((memo) => {
        const preview = memo.content;
        const title = memo.title ?? preview;
        const previewText = memo.title ? preview : null;

        return (
          <Pressable key={memo.id} onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}`)}>
            <ListItem
              leftAddon={<MaterialIcons name="push-pin" size={16} color="#4C84FF" />}
              sx={{ paddingVertical: 8 }}
            >
              <Typography variant="caption">
                {title}
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

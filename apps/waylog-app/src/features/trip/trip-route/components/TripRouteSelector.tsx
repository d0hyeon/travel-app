import { MaterialIcons } from '@expo/vector-icons';
import { Chip, IconButton, Stack, type StackProps } from "../../../../shared/components/mui";
import { useConfirmDialog } from "../../../../shared/components/confirm-dialog/useConfirmDialog";
import { useDayTripRoutes } from "@waylog/domains/trip";


interface Props {
  tripId: string;
  date: string;
  value?: string;
  onChange?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

export const TripRouteSelector = {
  Chip: RouteChip
}

function RouteChip({
  tripId,
  date,
  value,
  onChange,
  onDelete,
  onAdd,
  ...props
}: Props & Omit<StackProps, 'onChange'>) {
  const { data: { routes } } = useDayTripRoutes({ tripId, date })
  const confirm = useConfirmDialog()

  return (
    <Stack direction="row" gap={1} alignItems="center" sx={{ marginBottom: 16, flexWrap: 'wrap' }} {...props}>
      {routes.map((route, index) => (
        <Chip
          key={route.id}
          label={`경로 ${index + 1}`}
          variant={value === route.id ? 'filled' : 'outlined'}
          color={value === route.id ? 'primary' : 'default'}
          size="small"
          onClick={() => onChange?.(route.id)}
          onDelete={async () => {
            if (await confirm('삭제하시겠어요?')) {
              if (value === route.id) {
                await onChange?.(null)
              }
              onDelete?.(route.id);
            }
          }}
        />
      ))}
      <IconButton
        size="small"
        onClick={onAdd}
      >
        <MaterialIcons name="add" size={18} color="#4C84FF" />
      </IconButton>
    </Stack>
  )
}
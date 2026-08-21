import { Chip, IconButton, Stack, type StackProps } from "@mui/material";
import { useDayTripRoutes } from "@waylog/domains/trip";
import AddIcon from '@mui/icons-material/Add'


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

  return (
    <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap" {...props}>
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
        color="primary"
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Stack>
  )
}
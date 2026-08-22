import { alpha, Box, Stack, Typography, useTheme, type ButtonProps, type StackProps } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useOverlay } from "~shared/hooks/useOverlay";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useNavigate } from "react-router";
import { AppRoute } from "~app/routes";
import { TripFormDialog } from "../components/TripFormDialog";
import { useTrips } from "@waylog/domains/modules/trip";

export function CreateTripCardButton({ sx, ...props }: StackProps<'button'>) {
  const { create } = useTrips()
  const theme = useTheme();
  const overlay = useOverlay()
  const isMobile = useIsMobile()
  const navigate = useNavigate();

  const openCreationPopup = () => {
    overlay.open(({ isOpen, close }) => (
      <TripFormDialog
        open={isOpen}
        onClose={close}
        onSubmit={async (data) => {
          const trip = await create({
            ...data,
            exchangeRate: null,
            exchangeRates: null,
          })
          navigate(`/trip/${trip.id}`)
        }}
      />
    ))
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      component="button"
      sx={[{
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        border: `1px dashed ${theme.palette.primary.main}`,
        borderRadius: '16px',
        p: '14px 16px',
      },
      ...(Array.isArray(sx) ? sx : [sx])
      ]}
      onClick={() => {
        if (isMobile) return navigate(AppRoute.여행_생성)
        openCreationPopup();
      }}
      {...props}
    >
      <Stack direction="row" gap={2} alignItems="center" width="100%">
        <AddIconBox />
        <Box textAlign="left">
          <Typography color="primary" sx={{ fontSize: 12 }}>다음 여행</Typography>
          <Typography variant="body2" marginTop={0.5}>어디든 떠나볼까요?</Typography>
          <Typography color="textDisabled" sx={{ fontSize: 12 }}>새 여행을 계획해보아요</Typography>
        </Box>
      </Stack>

      <ChevronRightIcon />
    </Stack>
  )
}

function AddIconBox() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      width={30}
      height={30}
      borderRadius={2}
      bgcolor="primary.main"
    >
      <AddIcon htmlColor="#fff" />
    </Stack>
  )
}
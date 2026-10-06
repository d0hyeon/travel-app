import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, Dialog, DialogActions, DialogContent, IconButton, Stack, Switch, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { useTripCluastering } from '../hooks/useTripCluastering';
import { FloatingControl } from '../trip-route/components/FloatingControl';


export function TripPlaceMapFloatingControls() {
  const [isClusteringView, setCluastering] = useTripCluastering();
  const overlay = useOverlay();
  const isMobile = useIsMobile()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <Dialog open={isOpen} onClose={onClose} maxWidth="sm">
        <DialogTitle>지도 설정</DialogTitle>
        <DialogContent>
          <Typography variant={isMobile ? "caption" : "body2"} marginBottom={1} color="textSecondary" display="block">마커</Typography>
          <Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
            <Switch
              defaultChecked={isClusteringView}
              onChange={(_, checked) => setCluastering(checked)}
              sx={{ marginRight: -1 }}
            />
          </Row>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={close}>확인</Button>
        </DialogActions>
      </Dialog>
    ))
  }


  return (
    <>
      <FloatingControl corner="top-right" zIndex={8}>
        <IconButton onClick={openSettingDialog} sx={{ marginRight: -1, marginTop: -1 }}>
          <SettingsIcon color="info" />
        </IconButton>
      </FloatingControl>
    </>
  )
}

interface RowProps {
  label: ReactNode;
  description?: string;
  children?: ReactNode;
}
function Row(props: RowProps) {
  const isMobile = useIsMobile();

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant={isMobile ? "body2" : "body1"} >{props.label}</Typography>
        {props.description && (
          <Typography variant="caption" color="textDisabled" display="block">{props.description}</Typography>
        )}
      </Box>
      {props.children}
    </Stack>
  )
}
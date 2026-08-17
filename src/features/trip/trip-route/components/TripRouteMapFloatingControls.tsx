import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, Dialog, DialogActions, DialogContent, IconButton, Stack, Switch, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { useTripViewConfig } from "../useTripViewConfig";
import { FloatingControl } from "./FloatingControl";

export function TripRouteMapFloatingControls() {
  const [viewConfig, setViewConfig] = useTripViewConfig();
  const overlay = useOverlay();
  const isMobile = useIsMobile();


  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <Dialog open={isOpen} onClose={onClose} maxWidth="sm">
        <DialogTitle>지도 설정</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant={isMobile ? "caption" : "body2"} marginBottom={1} color="textSecondary" display="block">마커</Typography>
            <Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
              <Switch
                defaultChecked={viewConfig.isCluasterlingView}
                onChange={(_, checked) => setViewConfig({ isCluasterlingView: checked })}
                sx={{ marginRight: -1 }}
              />
            </Row>
            <Row label="계획된 장소만 보기">
              <Switch
                defaultChecked={!viewConfig.isVisibleAllMarkers}
                onChange={(_, checked) => setViewConfig({ isVisibleAllMarkers: !checked })}
                sx={{ marginRight: -1 }}
              />
            </Row>
          </Box>
          <Box marginTop={2}>
            <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary" display="block">경로</Typography>
            <Row label="이동 시간 보기">
              <Switch
                defaultChecked={viewConfig.isVisibleRouteLegs}
                onChange={(_, checked) => setViewConfig({ isVisibleRouteLegs: checked })}
                sx={{ marginRight: -1 }}
              />
            </Row>
          </Box>
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
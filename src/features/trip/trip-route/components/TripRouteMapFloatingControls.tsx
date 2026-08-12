import { ToggleButton } from "@mui/material";
import { FloatingControl } from "./FloatingControl";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTripViewConfig } from "../useTripViewConfig";
import WorkspacesIcon from '@mui/icons-material/Workspaces';

export function TripRouteMapFloatingControls() {
  const [viewConfig, setViewConfig] = useTripViewConfig();

  return (
    <>

      <FloatingControl corner="top-right" zIndex={8}>
        <ToggleButton
          value="check"
          aria-label="경로 마커만 표시"
          onClick={() => setViewConfig({ isVisibleAllMarkers: !viewConfig.isVisibleAllMarkers })}
          selected={viewConfig.isVisibleAllMarkers}
          size="small"
          color="primary"
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
        >
          <VisibilityOffIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="check"
          selected={viewConfig.isCluasterlingView}
          onChange={() => setViewConfig({ isCluasterlingView: !viewConfig.isCluasterlingView })}
          size="small"
          color="primary"
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
        >
          <WorkspacesIcon />
        </ToggleButton>
      </FloatingControl>
    </>
  )
}
import VisibilityOnIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const FLOATING_BG = 'rgba(255, 255, 255, 0.7)';

interface MarkerVisibilityToggleProps {
  showAllMarkers: boolean;
  onChange: (showAll: boolean) => void;
}

// 경로 외 장소 마커를 모두 보일지 토글한다.
export function MarkerVisibilityToggle({ showAllMarkers, onChange }: MarkerVisibilityToggleProps) {
  return (
    <ToggleButtonGroup
      orientation="vertical"
      value={showAllMarkers}
      exclusive
      size="small"
      sx={{ backgroundColor: FLOATING_BG }}
    >
      <ToggleButton value={true} aria-label="모든 마커 표시" onClick={() => onChange(true)}>
        <VisibilityOnIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value={false} aria-label="경로 마커만 표시" onClick={() => onChange(false)}>
        <VisibilityOffIcon fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

interface ClusteringToggleProps {
  clustering: boolean;
  onChange: (clustering: boolean) => void;
}

// 마커 클러스터링을 토글한다.
export function ClusteringToggle({ clustering, onChange }: ClusteringToggleProps) {
  return (
    <ToggleButton
      value="clustering"
      selected={clustering}
      onChange={() => onChange(!clustering)}
      size="small"
      sx={{ backgroundColor: FLOATING_BG }}
    >
      <WorkspacesIcon />
    </ToggleButton>
  );
}

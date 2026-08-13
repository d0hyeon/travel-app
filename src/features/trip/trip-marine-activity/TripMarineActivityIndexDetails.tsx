import { Close } from "@mui/icons-material";
import { Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import type { MarineActivityIndex } from "~features/marine-activity/marineActivity.types";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";

interface TripMarineActivityIndexDetailsProps {
  index: MarineActivityIndex;
  isOpen: boolean;
  onClose: () => void;
}

export function TripMarineActivityIndexDetails({
  index,
  isOpen,
  onClose,
}: TripMarineActivityIndexDetailsProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <Stack direction="row" justifyContent="space-between" alignItems="center" paddingRight={1}>
        <DialogTitle>해양 지수 상세</DialogTitle>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>
      <DialogContent sx={{ paddingTop: 0 }}>
        <Stack gap={1.5}>
          <Typography variant="body2">출처: 국립해양조사원</Typography>
          <Typography variant="body2">장소: {index.placeName}</Typography>
          <Typography variant="body2">등급: {index.gradeLabel}</Typography>
          {index.score != null && (
            <Typography variant="body2">점수: {index.score}</Typography>
          )}
          <Typography variant="body2">
            수온: {formatMetricValue(index.metrics.waterTemperatureCelsius, "℃")}
          </Typography>
          <Typography variant="body2">
            파고: {formatMetricValue(index.metrics.waveHeightMeters, "m")}
          </Typography>
          <Typography variant="body2">
            풍속: {formatMetricValue(index.metrics.windSpeedMetersPerSecond, "m/s")}
          </Typography>
          <Typography variant="body2">
            기온: {formatMetricValue(index.metrics.airTemperatureCelsius, "℃")}
          </Typography>
          <Typography variant="body2">
            유속: {formatMetricValue(index.metrics.currentSpeedMetersPerSecond, "m/s")}
          </Typography>
          <Typography variant="body2">
            물때: {index.metrics.tideLabel ?? "-"}
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function formatMetricValue(value: number | null, unit: string) {
  if (value == null) return "-";
  return `${value}${unit}`;
}

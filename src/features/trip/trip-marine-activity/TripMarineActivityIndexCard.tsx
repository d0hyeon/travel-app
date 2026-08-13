import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Card, CardActionArea, CardContent, IconButton, Stack, Typography } from "@mui/material";
import type { MarineActivityIndex } from "~features/marine-activity/marineActivity.types";

interface TripMarineActivityIndexCardProps {
  label: string;
  index: MarineActivityIndex;
  onOpenDetails: () => void;
}

export function TripMarineActivityIndexCard({
  label,
  index,
  onOpenDetails,
}: TripMarineActivityIndexCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="stretch">
        <CardActionArea onClick={onOpenDetails} sx={{ flex: 1 }}>
          <CardContent sx={{ padding: 1.5, "&:last-child": { paddingBottom: 1.5 } }}>
            <Stack minWidth={0}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="subtitle2" noWrap>
                {index.gradeLabel}
              </Typography>
              {index.score != null && (
                <Typography variant="caption" color="text.secondary">
                  점수 {index.score}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </CardActionArea>
        <Stack justifyContent="center" paddingRight={0.5}>
          <IconButton size="small" onClick={onOpenDetails}>
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
}

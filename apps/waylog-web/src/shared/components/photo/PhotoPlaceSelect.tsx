import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
import { Box, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';

export interface PhotoPlaceOption {
  placeId: string;
  name: string;
}

interface Props {
  value: string | null;
  options: PhotoPlaceOption[];
  onChange: (value: string | null) => void;
}

/** 사진 상세 오버레이 하단에서 사진의 장소를 선택/변경하는 Select. */
export function PhotoPlaceSelect({ value, options, onChange }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const currentName = options.find((option) => option.placeId === value)?.name;

  const handleSelect = (nextPlaceId: string | null) => {
    setAnchorEl(null);
    if (nextPlaceId !== value) {
      onChange(nextPlaceId);
    }
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          maxWidth: '80%',
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          bgcolor: 'rgba(0, 0, 0, 0.55)',
          color: '#fff',
          backdropFilter: 'blur(2px)',
          cursor: 'pointer',
        }}
      >
        <PlaceIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        <Typography variant="body2" fontWeight={600} noWrap>
          {currentName ?? '장소 미지정'}
        </Typography>
        <EditIcon sx={{ fontSize: 15, flexShrink: 0, opacity: 0.8 }} />
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { minWidth: 200, maxHeight: 320 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.placeId}
            onClick={() => handleSelect(option.placeId)}
            sx={{ minHeight: 40 }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={1}>
              <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {option.name}
              </Box>
              {option.placeId === value && <CheckIcon fontSize="small" />}
            </Stack>
          </MenuItem>
        ))}
        <MenuItem onClick={() => handleSelect(null)} sx={{ minHeight: 40 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={1}>
            <Box sx={{ color: 'text.secondary' }}>장소 미지정</Box>
            {value === null && <CheckIcon fontSize="small" />}
          </Stack>
        </MenuItem>
      </Menu>
    </>
  );
}

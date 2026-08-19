import { type PropsWithChildren } from 'react';

import { Popover as MuiPopover } from '@mui/material';

type Props = {
  open: boolean;
  anchorEl: HTMLDivElement | null;
  onClose: () => void;
};

export const Popover = ({ open, anchorEl, onClose, children }: PropsWithChildren<Props>) => {
  return (
    <MuiPopover
      open={open}
      anchorEl={anchorEl}
      sx={{ marginTop: '4px' }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      onClose={onClose}
    >
      {children}
    </MuiPopover>
  );
};


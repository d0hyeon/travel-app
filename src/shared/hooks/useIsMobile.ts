import { useMediaQuery, useTheme } from '@mui/material'
import { useMemo } from 'react';

export function useIsMobile() {
  const theme = useTheme();

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false; 
    
    const agent = window.navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
  }, [])
  

  return isMobile && useMediaQuery(theme.breakpoints.down('md'))
}
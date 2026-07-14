import CheckIcon from '@mui/icons-material/Check';
import InfoIcon from '@mui/icons-material/Info';
import ReportIcon from '@mui/icons-material/Report';
import { GlobalStyles } from "@mui/material";
import { Toaster } from "sonner";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";


export function ToastRenderer() {
  const isMobile = useIsMobile();

  return (
    <>
      <GlobalStyles
        styles={theme => ({
          '.toast-container': {
            borderRadius: '16px !important;',
            boxShadow: '3px 5px 18px rgba(0, 0, 0, 0.1.5) !important;',
            paddingBlock: '12px !important;',
            fontFamily: theme.typography.fontFamily,
            [theme.breakpoints.up('md')]: {
              paddingBlock: '8px !important;',
            }
          },
          '.warning-message .toast-icon': {
            color: theme.palette.warning.main
          }
        })}
      />
      <Toaster
        toastOptions={{
          classNames: {
            toast: 'toast-container',
            warning: 'warning-message',
            icon: 'toast-icon'
          },
        }}
        position={isMobile ? 'top-center' : 'top-right'}
        icons={{
          info: <InfoIcon fontSize="small" />,
          success: <CheckIcon fontSize="small" color="success" />,
          error: <ReportIcon fontSize="small" color="error" />
        }}
      />
    </>
  )
}
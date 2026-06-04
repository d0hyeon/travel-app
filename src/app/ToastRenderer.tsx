import { GlobalStyles } from "@mui/material";
import { Toaster } from "sonner";

export function ToastRenderer() {
  return (
    <>
      <GlobalStyles
        styles={theme => ({
          '.toast-container': {
            justifyContent: 'space-between',
            borderRadius: '16px !important;',
            boxShadow: '3px 5px 18px rgba(0, 0, 0, 0.1.5) !important;',
            paddingBlock: '12px !important;',
            [theme.breakpoints.up('md')]: {
              paddingBlock: '8px !important;',
            }
          }
        })}
      />
      <Toaster
        toastOptions={{
          classNames: { toast: 'toast-container' },
        }}
      />
    </>
  )
}
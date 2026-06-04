import type { ComponentProps, PropsWithChildren } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Alert, AlertTitle, Button, Typography } from "@mui/material";

export function CommonErrorBoundary(props: ComponentProps<typeof ErrorBoundary>) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Alert
          color="error"
          action={(<Button size="small" variant='contained' onClick={resetError}>재시도</Button>)}
          sx={{ margin: 2, marginX: 1.5 }}
        >
          <AlertTitle>에러가 발생했어요!</AlertTitle>
          <Typography variant="caption">{error.message}</Typography>
        </Alert>
      )}
      {...props}
    />
  )
}
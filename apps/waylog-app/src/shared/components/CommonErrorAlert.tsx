import { StyleSheet } from "react-native";
import { Button, Stack, Typography } from "./design-system";
import { radius } from "~shared/config/tokens";
import { ReactNode } from "react";
import { ButtonProps } from "./design-system/Button";


interface Props {
  message?: string;
  action?: ReactNode
}

export function CommonErrorAlert({ message = '에러가 발생했어요!', action }: Props) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={8}
      style={styles.container}
    >
      <Stack gap={2} style={styles.message}>
        <Typography variant="subtitle1" color="error">
          에러가 발생했어요!
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {message}
        </Typography>
      </Stack>
      {action}
    </Stack>
  )
}
CommonErrorAlert.RetryButton = (props: ButtonProps) => {
  return (
    <Button size="small" variant="contained" color="error" {...props}>
      재시도
    </Button>
  )
}

const ERROR_SURFACE = '#fdeded'

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: ERROR_SURFACE,
  },
  message: {
    flexShrink: 1,
  },
})

import { MaterialIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { IconButton } from "~shared/components/design-system";
import { palette } from "~shared/config/tokens";

export function CurrenntLocationIconButton(props: ComponentProps<typeof IconButton>) {
  return (
    <IconButton
      size="small"
      {...props}
    >
      <MaterialIcons name="my-location" size={20} color={palette.primary} />
    </IconButton>
  )
}
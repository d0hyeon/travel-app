import { DialogTitle as Title, type DialogTitleProps } from "@mui/material";
import { useIsMobile } from "~shared/hooks/useIsMobile";

export function DialogTitle(props: DialogTitleProps) {
  const isMobile = useIsMobile();
  return (
    <Title fontSize={isMobile ? 14 : undefined} {...props} />
  )
}
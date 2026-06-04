import { Fade } from "@mui/material";
import { IntroFullScreenBanner } from "~features/intro/IntroFullScreenBanner";

export function SplashScreen() {
  return (
    <Fade in={true}>
      <div>
        <IntroFullScreenBanner />
      </div>
    </Fade>
  )
}
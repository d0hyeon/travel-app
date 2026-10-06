import { useEffect, useState } from "react";
import { Keyboard, KeyboardMetrics, Platform } from "react-native";

export function useKeyboardMetrics() {
  const [metrics, setMetrics] = useState<KeyboardMetrics | null>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) =>
      setMetrics(event.endCoordinates),
    );

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setMetrics(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { isActive: metrics != null, metrics };
}

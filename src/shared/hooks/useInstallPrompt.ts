import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 체크 (standalone 모드)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return false;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setPrompt(null);
      return true;
    }
    return false;
  }, [prompt]);

  return {
    canInstall: !!prompt && !isInstalled,
    isInstalled,
    install,
  };
}

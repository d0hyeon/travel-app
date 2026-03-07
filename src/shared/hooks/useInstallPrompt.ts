import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// 전역에서 이벤트 캡처 (컴포넌트 마운트 전에 발생해도 잡힘)
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('🔥 beforeinstallprompt captured!', { deferredPrompt, listenersCount: listeners.size });
    listeners.forEach((l) => l());
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return deferredPrompt;
}

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return false;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      deferredPrompt = null;
      listeners.forEach((l) => l());
      return true;
    }
    return false;
  }, [prompt]);

  const canInstall = !!prompt && !isInstalled;
  console.log('🎯 useInstallPrompt:', { canInstall, prompt: !!prompt, isInstalled, deferredPrompt: !!deferredPrompt });

  return {
    canInstall,
    isInstalled,
    install,
  };
}

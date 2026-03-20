import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from '@/App.tsx';
import './index.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { registerSW } from 'virtual:pwa-register';

import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

// Register service worker for PWA
registerSW({ immediate: true });

if (Capacitor.isNativePlatform()) {
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
);

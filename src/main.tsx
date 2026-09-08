import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { checkAndUpdateAppVersion, purgeStaleBrowserCaches } from './utils/versionManager.ts';

// Purge any stale service worker & check version immediately
checkAndUpdateAppVersion();
purgeStaleBrowserCaches();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket / HMR reconnection errors in the AI Studio preview environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event?.reason?.message || event?.reason || '');
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('ws:')) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('ws:')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);


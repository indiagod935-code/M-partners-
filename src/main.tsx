import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global uncaught promise and error listener for proactive diagnostics
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Global Unhandled Rejection]:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.warn('[Global Window Error]:', event.message, event.filename, event.lineno);
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

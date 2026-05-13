import type { AppProps } from 'next/app';
import '../styles/globals.css';

// Initialize database on app startup
if (typeof window === 'undefined') {
  // Server-side only
  require('../lib/db-init');
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

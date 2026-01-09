import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>QuickHost - Rapid Web Hosting</title>
        <meta name="description" content="Quickly host websites from Git repositories" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="header">
        <div className="container header-content">
          <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-icon">🚀</span>
            <span>QuickHost</span>
          </Link>
          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/">Dashboard</Link>
            <Link href="/new" className="btn btn-primary">
              + New Container
            </Link>
          </nav>
        </div>
      </header>
      
      <main>
        <Component {...pageProps} />
      </main>
    </>
  );
}

import React, { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>QuickHost - Deploy your Next.js apps instantly</title>
        <meta name="description" content="QuickHost - Tools to quickly host websites" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <nav className="bg-slate-950 border-b border-slate-700">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">🚀</div>
              <span className="text-xl font-bold">QuickHost</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="hover:text-blue-400 transition">Dashboard</a>
              <a href="https://github.com" className="hover:text-blue-400 transition">GitHub</a>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
        
        <footer className="bg-slate-950 border-t border-slate-700 mt-16">
          <div className="container mx-auto px-4 py-8 text-slate-400">
            <p>© 2026 QuickHost. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

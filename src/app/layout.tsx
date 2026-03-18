import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Pablito — Pablito is checking your bags…',
  description: 'Pablito is checking your bags… Real-time multi-chain portfolio tracker powered by Pyth Network oracle price feeds.',
  keywords: ['crypto', 'portfolio', 'pyth', 'defi', 'wallet', 'ethereum', 'solana', 'pablito'],
  openGraph: {
    title: 'Pablito',
    description: 'Pablito is checking your bags…',
    type: 'website',
  },
};

// No-flash theme script — runs synchronously before paint
const themeScript = `(function(){try{var t=localStorage.getItem('pablito-theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

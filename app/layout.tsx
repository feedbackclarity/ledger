import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Ledger',
  description: 'Personal financial operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

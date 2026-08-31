import type { Metadata } from 'next';
import './globals.css';
import Providers from './Providers';

export const metadata: Metadata = {
  title: 'Three-Way Match Engine | PO, GRN & Invoice Reconciliation',
  description: 'Procurement document matching and reconciliation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

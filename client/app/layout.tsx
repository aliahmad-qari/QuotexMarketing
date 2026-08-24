import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { Providers } from '../providers/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Candle Probability Lab',
    template: '%s | Candle Probability Lab',
  },
  description:
    'A transparent quantitative market-analysis platform for live Binance candles and deterministic indicator probability modeling.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

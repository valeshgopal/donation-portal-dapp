import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Donation Platform',
  description: 'A decentralized platform for managing donations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        className={`${poppins.variable} font-poppins min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className='min-h-screen bg-gray-50'>{children}</main>
          <Toaster position='top-right' />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/app/components/common/AppProviders';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'K-AI',
    template: '%s | K-AI',
  },
  description:
    'Open-source AI chat with branching conversations. Explore, compare, and build on parallel conversation threads powered by your preferred LLM.',
  keywords: [
    'AI chat',
    'branching conversations',
    'open source AI',
    'LLM',
    'ChatGPT alternative',
    'conversation branching',
    'AI assistant',
  ],
  authors: [{ name: 'Fareed Z.' }],
  creator: 'Fareed Z.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'K-AI — Branching AI Chat',
    description:
      'Open-source AI chat with branching conversations. Explore, compare, and build on parallel conversation threads.',
    siteName: 'K-AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K-AI — Branching AI Chat',
    description: 'Open-source AI chat with branching conversations.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

import './globals.css'
import { Inter } from "next/font/google";
import { Metadata } from 'next';

// Optimize font loading with display swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves initial page load by showing fallback font until Inter loads
  preload: true,
});

export const metadata: Metadata = {
  title: "AJ Stars' AI assistant demo",
  description: 'This is a demo of an AI assistant that can generate text and speak it out loud and tell you everything about aj stars and also help you with your homework. It is a real world Jarvis.',
  keywords: ['AI', 'Assistant', 'AJ Stars', 'Real World Jarvis', 'Speech', 'Gemini 2.0', 'Gemini'],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#000000',
  metadataBase: new URL('https://ajstars.in'),
  openGraph: {
    title: "AJ Stars' AI Assistant",
    description: 'AI assistant that speaks and provides information about AJ Stars',
    siteName: 'AJ Stars',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

import './globals.css'
import { Inter } from "next/font/google";
import { Metadata, Viewport } from 'next';
import { Analytics } from "@vercel/analytics/react"

// Optimize font loading with display swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves initial page load by showing fallback font until Inter loads
  preload: false,
});

// Updated Metadata for SEO - Focused on Interactive Personas
export const metadata: Metadata = {
  title: "Interactive 3D AI Personas | Three.js & Next.js Powered Avatars",
  description: "Create and interact with realistic 3D AI personas for business, education, or entertainment. Powered by Three.js, Next.js, and advanced AI.",
  keywords: ['AI Persona', 'Interactive AI', '3D Avatar', 'Business AI', 'Digital Human', 'Three.js', 'Next.js', 'Web AI', 'Conversational AI', 'Virtual Assistant', 'AI Chatbot', 'Gemini'],
  metadataBase: new URL('https://ajstars.in'), // Base URL remains for canonical linking
  openGraph: {
    title: "Interactive 3D AI Personas & Avatars",
    description: "Explore engaging 3D AI personas built with cutting-edge web technologies (Three.js, Next.js). Ideal for business and interactive applications.",
    siteName: 'AI Persona Showcase', // Changed site name for broader appeal
    type: 'website',
    // Optional: Add a relevant image URL for social sharing
    // images: [
    //   {
    //     url: 'https://your-domain.com/og-persona-image.png', 
    //     width: 1200,
    //     height: 630,
    //     alt: 'Interactive 3D AI Persona Demo',
    //   },
    // ],
  },
}

// Export viewport settings separately
export const generateViewport = (): Viewport => {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#000000',
  }
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
      <body className={inter.className}>{children}
        <Analytics/>
      </body>
    </html>
  );
}

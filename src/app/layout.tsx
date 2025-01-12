import './globals.css'
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "AJ Stars' AI assistant demo",
  description: 'This is a demo of an AI assistant that can generate text and speak it out loud and tell you everything about aj stars and also help you with your homework. It is a real world Jarvis.',
  keywords: ['AI', 'Assistant', 'AJ Stars', 'Real World Jarvis', 'Speech', 'Gemini 2.0', 'Gemini', ],
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
     
      <body className={inter.className}>{children}</body>
    </html>
  );
}

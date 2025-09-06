import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ConditionalHeader } from '@/components/conditional-header'
import { ConditionalFooter } from '@/components/conditional-footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TryOnX - AI Sanal Giyim Deneme',
  description: 'Yapay zeka ile sanal kıyafet deneme, face swap ve 360° video oluşturma uygulaması',
  keywords: ['sanal giyim', 'AI', 'face swap', 'kıyafet deneme', 'moda teknolojisi'],
  authors: [{ name: 'TryOnX Team' }],
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0ea5e9',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Conditional Navigation Header */}
            <ConditionalHeader />

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Conditional Footer */}
            <ConditionalFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}

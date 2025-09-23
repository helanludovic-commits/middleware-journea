import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Middleware Journea - Générateur d\'itinéraires',
  description: 'Application de création d\'itinéraires de voyage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
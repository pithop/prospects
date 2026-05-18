import React from 'react'
import '../styles/globals.css' // Adjust the import path if globals.css is elsewhere

export const metadata = {
  title: 'ProspectHub V2',
  description: 'Application de gestion de prospects avec base de données',
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

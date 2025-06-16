import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PO Assist - AI Story Generator",
  description: "AI-powered tool to generate EPICs and User Stories from Business Requirements Documents",
    generator: 'v0.dev'
}

// Extend Window interface for Atlassian Connect
declare global {
  interface Window {
    AP: any
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <style>{`
          body {
            background: #f8f9fa;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

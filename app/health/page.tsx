import type { Metadata } from "next"
import HealthPageClient from "./HealthPageClient"

export const metadata: Metadata = {
  title: "PO Assist - Health Check",
  description: "Health status for PO Assist AI Story Generator",
}

export default function HealthPage() {
  return <HealthPageClient />
}

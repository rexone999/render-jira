import { redirect } from "next/navigation"

export default function HomePage() {
  // Check if we're being accessed from Jira (has JWT parameter)
  // If so, redirect to the Jira app page
  // Otherwise, show the landing page

  return redirect("/main")
}

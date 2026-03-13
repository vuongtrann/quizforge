import { NextResponse } from "next/server"
import { getGitHubIssues } from "@/lib/github"

export async function GET() {
  const issues = await getGitHubIssues()
  return NextResponse.json(issues)
}

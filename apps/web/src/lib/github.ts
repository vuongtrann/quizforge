// GitHub API utilities
const OWNER = "vuongtrann" 
const REPO = "quizforge"

export async function getGitHubIssues() {
  try {
    console.log(`[GitHub Lib] Fetching issues for ${OWNER}/${REPO}...`)
    
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=30`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "QuizForge-App",
        // Optional: Add GitHub Token if rate limited
        ...(process.env.GITHUB_TOKEN ? { "Authorization": `token ${process.env.GITHUB_TOKEN}` } : {})
      },
      next: { revalidate: 60 }
    })
    
    if (!res.ok) {
       const errorText = await res.text()
       console.error(`[GitHub Lib] Error: ${res.status} ${res.statusText}`, errorText)
       return []
    }

    const data = await res.json()
    
    const issues = data
      .filter((item: any) => !item.pull_request)
      .map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        url: issue.html_url,
        created_at: issue.created_at,
      }))

    return issues

  } catch (err) {
    console.error("[GitHub Lib] Fatal error:", err)
    return []
  }
}

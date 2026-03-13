import { Github, ArrowUpRight, CheckCircle2, CircleDot } from "lucide-react"
import { getGitHubIssues } from "@/lib/github"

export const dynamic = "force-dynamic"

export default async function RoadmapPage() {
  const issues = await getGitHubIssues()

  const openIssues = issues.filter((i: any) => i.state === 'open')
  const closedIssues = issues.filter((i: any) => i.state === 'closed')

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-20 text-left">
        <h1 className="text-4xl font-bold tracking-tighter text-black mb-4">
          Roadmap
        </h1>
        <p className="text-[#666] text-lg max-w-xl">
          Track the development progress of QuizForge. Our development is open and transparent.
        </p>
      </div>

      {/* In Development Section */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#eaeaea]">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <CircleDot className="h-5 w-5 text-blue-500" />
             Active Work
           </h2>
           <span className="text-xs font-medium text-[#666] bg-[#fafafa] px-3 py-1 rounded-full border border-[#eaeaea]">
             {openIssues.length} Pending
           </span>
        </div>

        <div className="grid gap-4">
          {openIssues.map((issue: any) => (
            <a 
              key={issue.id} 
              href={issue.url} 
              target="_blank" 
              className="vercel-card flex items-start justify-between group bg-white"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <span className="text-sm font-semibold hover:underline">{issue.title}</span>
                   <span className="text-xs text-[#666]">#{issue.number}</span>
                </div>
                <div className="flex gap-2">
                   {issue.labels.map((label: string) => (
                      <span key={label} className="text-[10px] font-medium px-2 py-0.5 rounded border border-[#eaeaea] bg-[#fafafa] text-[#666] uppercase">{label}</span>
                   ))}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#eaeaea] group-hover:text-black transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Resolved Section */}
      <div>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#eaeaea]">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <CheckCircle2 className="h-5 w-5 text-green-500" />
             Completed
           </h2>
           <span className="text-xs font-medium text-[#666] bg-[#fafafa] px-3 py-1 rounded-full border border-[#eaeaea]">
             {closedIssues.length} Shipped
           </span>
        </div>

        <div className="grid gap-4">
          {closedIssues.map((issue: any) => (
            <a 
              key={issue.id} 
              href={issue.url} 
              target="_blank" 
              className="vercel-card flex items-start justify-between group opacity-60 hover:opacity-100 bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-semibold line-through decoration-gray-300">{issue.title}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#666] font-medium uppercase tracking-tight">
                  Shipped on {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#eaeaea] group-hover:text-black transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {issues.length === 0 && (
        <div className="vercel-card py-20 text-center flex flex-col items-center bg-white">
          <Github className="h-8 w-8 text-[#eaeaea] mb-4" />
          <p className="text-[#666] text-sm font-medium">
            Fetching project trajectory from GitHub...
          </p>
        </div>
      )}
    </div>
  )
}

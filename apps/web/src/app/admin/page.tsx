import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getDictionary } from "@/dictionaries/utils"

export default async function AdminPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  const pendingReviewsCount = await prisma.review.count({ where: { status: "PENDING" } }).catch(() => 0)
  const publishedReleasesCount = await prisma.release.count({ where: { isPublished: true } }).catch(() => 0)

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between border-b border-[#eaeaea] pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {dict.admin?.welcome || "Dashboard"}
          </h1>
          <p className="mt-2 text-[#666]">
            Manage your assessment engine updates and user feedback.
          </p>
        </div>
        <div className="flex gap-2">
           <button className="vercel-button-secondary h-9 px-4 text-xs font-semibold">Refresh</button>
           <button className="vercel-button-primary h-9 px-4 text-xs font-semibold">New Release</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="vercel-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-4">Feedback Pending</p>
          <div className="flex items-baseline justify-between transition-transform hover:translate-x-1">
             <span className="text-3xl font-bold">{pendingReviewsCount}</span>
             <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">Action Required</span>
          </div>
        </div>

        <div className="vercel-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-4">Total Releases</p>
          <div className="flex items-baseline justify-between transition-transform hover:translate-x-1">
             <span className="text-3xl font-bold">{publishedReleasesCount}</span>
             <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded">Stable</span>
          </div>
        </div>

        <div className="vercel-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-4">System Status</p>
          <div className="flex items-center justify-between transition-transform hover:translate-x-1">
             <span className="text-sm font-bold uppercase tracking-tight">All Systems Operational</span>
             <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-3 w-1 bg-black rounded-full" />)}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

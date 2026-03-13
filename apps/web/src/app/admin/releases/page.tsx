import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getDictionary } from "@/dictionaries/utils"
import { Plus } from "lucide-react"

export default async function ReleasesPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  const releases = await prisma.release.findMany({
    orderBy: { createdAt: "desc" }
  }).catch(() => [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dict.admin?.releases || "Releases"}
          </h1>
          <p className="mt-2 text-gray-500">Manage application versions and update tokens.</p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-black/90 transition-all dark:bg-white dark:text-black">
          <Plus className="h-4 w-4" />
          New Release
        </button>
      </div>

      <div className="grid gap-6">
        {releases.map((rel) => (
          <div key={rel.id} className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all dark:border-white/10 dark:bg-[#0F0F0F]">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black dark:bg-blue-500/10 dark:text-blue-400">
                    {rel.version.split('.')[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">v{rel.version}</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-[0.2em]">{new Date(rel.createdAt).toDateString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    rel.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {rel.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <button className="ml-4 p-2 text-gray-400 hover:text-black transition-colors">
                    <Plus className="h-4 w-4 rotate-45" /> {/* Close/More icon substitute */}
                  </button>
               </div>
            </div>
          </div>
        ))}
        {releases.length === 0 && (
          <div className="rounded-[40px] border-2 border-dashed border-gray-100 py-20 text-center dark:border-white/5">
             <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
             <p className="text-lg text-gray-400 font-medium">No releases yet. Start by creating the first v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple fallback icon component since lucide-react might not have everything I need easily in this snippet
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

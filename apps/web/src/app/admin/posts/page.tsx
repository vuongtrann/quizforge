import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getDictionary } from "@/dictionaries/utils"
import { Plus, MoreHorizontal, Eye } from "lucide-react"

export default async function AdminPostsPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true }
  }).catch(() => [])

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-[900] tracking-tighter text-gray-900">
            Articles & Updates
          </h1>
          <p className="mt-2 text-gray-500 font-medium">Create and manage content for the blog.</p>
        </div>
        <button className="pill-button-primary scale-110 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </button>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Post Details</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="group hover:bg-gray-50/30 transition-colors">
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{post.title}</span>
                      <span className="text-xs text-gray-400 font-medium mt-1">/{post.slug}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                     post.published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                   }`}>
                     {post.published ? 'Live' : 'Draft'}
                   </span>
                </td>
                <td className="px-8 py-6 text-sm font-medium text-gray-500 tabular-nums">
                   {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100 border-dashed">
                         <PenSquare className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium text-gray-400 italic">No articles published yet.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PenSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  )
}

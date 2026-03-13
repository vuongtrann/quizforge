import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getDictionary } from "@/dictionaries/utils"

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  }).catch(() => [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {dict.admin?.reviews || "Feedbacks"}
        </h1>
        <p className="mt-2 text-gray-500">Manage user contributions and bug reports.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F0F0F]">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-white/5">
          <thead className="bg-gray-50/50 dark:bg-white/2">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Content</th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
              <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reviews.map((review) => (
              <tr key={review.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                <td className="px-6 py-5">
                   <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{review.content}</p>
                </td>
                <td className="px-6 py-5">
                   <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                     review.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                   }`}>
                     {review.status}
                   </span>
                </td>
                <td className="px-6 py-5 text-sm text-gray-500 tabular-nums">
                   {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right">
                   <button className="text-sm font-bold text-blue-600 hover:text-blue-500">View</button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                  No feedbacks found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

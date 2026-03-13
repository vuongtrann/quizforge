import Link from "next/link"
import { cookies } from "next/headers"
import { getDictionary } from "@/dictionaries/utils"
import { LayoutDashboard, FileText, Package, LogOut, PenSquare } from "lucide-react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#eaeaea] bg-[#fafafa]">
        <div className="flex h-14 items-center border-b border-[#eaeaea] px-6">
          <Link href="/" className="flex items-center gap-2">
            <svg aria-label="Logo" fill="currentColor" viewBox="0 0 75 65" height="14">
              <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
            </svg>
            <span className="text-sm font-bold tracking-tight">Console</span>
          </Link>
        </div>
        
        <div className="flex flex-col h-[calc(100%-56px)] justify-between p-3">
          <nav className="space-y-1">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-black bg-[#ededed]"
            >
              <LayoutDashboard size={16} />
              {dict.admin?.dashboard || "Overview"}
            </Link>
            <Link 
              href="/admin/posts" 
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#666] hover:text-black hover:bg-[#ededed] transition-colors"
            >
              <PenSquare size={16} />
              Blog Posts
            </Link>
            <Link 
              href="/admin/reviews" 
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#666] hover:text-black hover:bg-[#ededed] transition-colors"
            >
              <FileText size={16} />
              {dict.admin?.reviews || "Feedbacks"}
            </Link>
            <Link 
              href="/admin/releases" 
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#666] hover:text-black hover:bg-[#ededed] transition-colors"
            >
              <Package size={16} />
              {dict.admin?.releases || "Releases"}
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#eaeaea]">
             <div className="flex items-center gap-3 px-3 py-2 border border-[#eaeaea] rounded-md bg-white mb-3">
                <div className="h-6 w-6 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">
                   A
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-semibold truncate">Administrator</p>
                </div>
             </div>
             <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#ff4d4d] hover:bg-[#fff5f5] transition-colors">
                <LogOut size={16} />
                Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 lg:p-16 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}

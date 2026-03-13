import Link from "next/link"
import { getDictionary } from "@/dictionaries/utils"
import { cookies } from "next/headers"
import LocaleSwitcher from "@/components/LocaleSwitcher"

export default async function PublicLayout({ 
  children
}: { 
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  return (
    <div className="flex min-h-screen flex-col selection:bg-black selection:text-white font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-[#eaeaea] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <svg aria-label="Vercel Logo" fill="currentColor" viewBox="0 0 75 65" height="20">
                <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
              </svg>
              <span className="text-sm font-bold tracking-tight">QuizForge</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/#features" className="text-sm text-[#666] hover:text-black transition-colors">
                {dict.nav.features}
              </Link>
              <Link href="/feedback" className="text-sm text-[#666] hover:text-black transition-colors">
                Feedback
              </Link>
              <Link href="/roadmap" className="text-sm text-[#666] hover:text-black transition-colors">
                Roadmap
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <LocaleSwitcher currentLocale={locale} />
            <Link href="/login" className="text-sm text-[#666] hover:text-black transition-colors">
              Log In
            </Link>
            <Link 
              href="/#download" 
              className="vercel-button-primary h-8 px-4 text-xs"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="w-full border-t border-[#eaeaea] bg-[#fafafa] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                 <svg fill="currentColor" viewBox="0 0 75 65" height="16">
                   <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
                 </svg>
                 <span className="font-bold text-sm">QuizForge</span>
               </div>
               <p className="text-sm text-[#666] max-w-xs leading-relaxed">
                 The modern platform for creating interactive assessments and engaging student experiences.
               </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-sm text-[#666] hover:text-black transition-colors">Features</Link>
                <Link href="#" className="text-sm text-[#666] hover:text-black transition-colors">Creator</Link>
                <Link href="#" className="text-sm text-[#666] hover:text-black transition-colors">Player</Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Resources</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/docs" className="text-sm text-[#666] hover:text-black transition-colors">Docs</Link>
                <Link href="/roadmap" className="text-sm text-[#666] hover:text-black transition-colors">Roadmap</Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Legal</h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-sm text-[#666] hover:text-black transition-colors">Privacy</Link>
                <Link href="#" className="text-sm text-[#666] hover:text-black transition-colors">Terms</Link>
              </nav>
            </div>
          </div>
          <div className="mt-16 flex items-center justify-between pt-8 border-t border-[#eaeaea] text-xs text-[#666]">
            <span>&copy; {new Date().getFullYear()} QuizForge Engine</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

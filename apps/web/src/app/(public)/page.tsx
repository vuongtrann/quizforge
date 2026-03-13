import Link from "next/link"
import { Shield, Zap, Globe, ArrowRight, Github, ExternalLink, Code, Layers } from "lucide-react"
import { getDictionary } from "@/dictionaries/utils"
import { cookies } from "next/headers"

export default async function LandingPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const dict = await getDictionary(locale as "en" | "vi");

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Vercel Spotlight Grid Background */}
      <div className="absolute inset-0 -z-10 spotlight-grid opacity-[0.8]" />
      
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-48 md:pt-56 md:pb-72">
        <div className="mx-auto max-w-6xl text-center">
          <div className="animate-vercel-reveal inline-flex items-center gap-3 rounded-full border border-[#eaeaea] bg-white px-3 py-1 text-xs font-medium text-black shadow-sm mb-12">
            <span className="flex h-2 w-2 rounded-full bg-black"></span>
            {dict.hero.badge}
            <ArrowRight size={12} className="text-[#666]" />
          </div>
          
          <h1 className="animate-vercel-reveal [animation-delay:100ms] text-gradient text-6xl font-bold tracking-tighter sm:text-7xl md:text-8xl lg:text-[10rem] mb-12 leading-[0.9]">
            Build and deploy <br/>On the AI Cloud.
          </h1>
          
          <p className="animate-vercel-reveal [animation-delay:200ms] mx-auto max-w-2xl text-lg text-[#666] md:text-xl leading-relaxed mb-16">
            QuizForge gives educators the infrastructure to build, distribute, and analyze assessments with the speed and reliability of the modern web.
          </p>
          
          <div className="animate-vercel-reveal [animation-delay:300ms] flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#download" className="vercel-button-primary mirror-surface min-w-[200px]">
              Start Forging
            </Link>
            <Link href="/docs" className="vercel-button-secondary min-w-[200px]">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section (Bento Grid) */}
      <section id="features" className="py-24 border-t border-[#eaeaea] bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Framework-Defined <br/>Infrastructure.</h2>
              <p className="text-[#666] text-lg md:text-xl leading-relaxed">Everything you need to scale your school-wide assessments without compromising security or speed.</p>
            </div>
            <Link href="/roadmap" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline">
               Explore the platform <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:grid-rows-2">
             <div className="md:col-span-12 lg:col-span-8 vercel-card bg-gray-50 overflow-hidden relative group min-h-[400px]">
                <div className="relative z-10 px-4 py-4">
                   <div className="mb-10 h-14 w-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-2xl">
                      <Code size={28} />
                   </div>
                   <h3 className="text-4xl font-bold tracking-tight mb-4">Single Binary Packaging</h3>
                   <p className="text-[#666] text-lg max-w-sm mb-10 leading-relaxed">Deploy once, deliver everywhere. Your assessments are packaged into a single, secure executable with built-in data integrity.</p>
                   <div className="flex gap-3">
                      <span className="text-xs font-mono bg-white border border-[#eaeaea] px-4 py-1.5 rounded-full shadow-sm">v1.2.4-stable</span>
                      <span className="text-xs font-mono bg-white border border-[#eaeaea] px-4 py-1.5 rounded-full shadow-sm">AES-256</span>
                   </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-[80px] group-hover:opacity-100 opacity-60 transition-opacity" />
             </div>

             <div className="md:col-span-6 lg:col-span-4 vercel-card bg-white flex flex-col justify-between p-10">
                <div>
                  <div className="mb-6 h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Instant LAN Sync</h3>
                  <p className="text-[#666] leading-relaxed">No internet? No problem. High-speed peer-to-peer distribution and collection over local networks.</p>
                </div>
                <div className="mt-8 pt-8 border-t border-[#eaeaea]">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Performance</p>
                   <p className="text-sm font-bold mt-1">&lt; 100ms latancy</p>
                </div>
             </div>

             <div className="md:col-span-6 lg:col-span-4 vercel-card bg-white p-10">
                <div className="mb-6 h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Zero-Trust Security</h3>
                <p className="text-[#666] leading-relaxed">End-to-end encryption for every answer sheet and result file, protecting against any attempt of tampering.</p>
             </div>

             <div className="md:col-span-12 lg:col-span-8 vercel-card bg-black text-white p-0 overflow-hidden group shadow-2xl">
                <div className="p-16 h-full flex flex-col justify-between relative z-10">
                   <div className="max-w-md">
                     <h3 className="text-5xl font-bold tracking-tighter mb-8 leading-tight">Designed for Educators. <br/> Built for Scale.</h3>
                     <p className="text-zinc-400 text-lg mb-10 leading-relaxed">From classroom tests to city-wide olympiads, QuizForge scales with your institution seamlessly.</p>
                     <Link href="/login" className="vercel-button-primary bg-white text-black hover:bg-zinc-200 h-14 px-10 shadow-none">
                        Get Started for Free
                     </Link>
                   </div>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] opacity-50 transition-opacity" />
             </div>
          </div>
        </div>
      </section>

      {/* Integration Logos (Vercel Style) */}
      <section className="py-32 border-t border-[#eaeaea] bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-6 text-center">
           <p className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-16">Trusted by leading educational departments</p>
           <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center opacity-40 grayscale group hover:opacity-100 transition-opacity">
              <div className="font-bold text-2xl flex items-center gap-2"><Github size={24}/> GitHub</div>
              <div className="font-bold text-2xl tracking-tighter">Vercel</div>
              <div className="font-bold text-2xl">React</div>
              <div className="font-bold text-2xl tracking-tight">Next.js</div>
              <div className="font-bold text-2xl uppercase italic">Intel</div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="download" className="py-48 border-t border-[#eaeaea] bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.03)_0%,transparent_50%)]" />
        <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12">Start Forging Today.</h2>
          <div className="flex flex-col items-center gap-8">
             <div className="vercel-card max-w-md w-full p-2 flex items-center gap-4 bg-white/50 backdrop-blur">
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center text-white shrink-0 ml-1">
                   <Download size={20} />
                </div>
                <div className="text-left flex-1 py-2">
                   <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest leading-none mb-1">Latest Version</p>
                   <p className="text-sm font-bold">QuizForge_Studio_1.2.4.exe</p>
                </div>
                <button className="vercel-button-primary h-12 rounded-lg px-6 text-xs mr-1">
                   Download
                </button>
             </div>
             <p className="text-[#666] text-sm">Open source and security-first. Build assessments with confidence.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Download({ size, className }: { size: number, className?: string }) {
   return (
      <svg 
         xmlns="http://www.w3.org/2000/svg" 
         width={size} 
         height={size} 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="currentColor" 
         strokeWidth="2" 
         strokeLinecap="round" 
         strokeLinejoin="round" 
         className={className}
      >
         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
   )
}

"use client"

import { useRouter } from "next/navigation"
import { Languages } from "lucide-react"

export default function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();

  const handleSwitch = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh(); 
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200/50 bg-white/50 p-1 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-1.5 px-2">
         <Languages className="h-3 w-3 text-gray-400" />
      </div>
      <div className="flex items-center gap-1">
        {['vi', 'en'].map((loc) => (
          <button 
            key={loc}
            onClick={() => handleSwitch(loc)}
            className={`
              relative rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all
              ${currentLocale === loc 
                ? 'bg-black text-white shadow-md scale-105' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}
            `}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}

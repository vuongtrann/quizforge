import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getDictionary } from "@/dictionaries/utils"
import { cookies } from "next/headers"
import FeedbackForm from "@/components/FeedbackForm"

async function submitFeedback(formData: FormData) {
  "use server"
  const content = formData.get("content") as string
  if (!content) return;
  
  await prisma.review.create({
    data: {
      content,
      status: "PENDING",
      images: [] 
    }
  })

  redirect("/feedback?success=true")
}

export default async function FeedbackPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ success?: string }> 
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  const { success } = await searchParams;
  const dict = await getDictionary(locale as "en" | "vi");
  const isSuccess = success === "true"

  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center px-4 py-32 animate-fade-in-up">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">{dict.feedback.title}</h1>
      <p className="text-lg text-gray-500 text-center mb-12 max-w-md">
        {dict.feedback.description}
      </p>

      <FeedbackForm 
        dict={dict} 
        locale={locale} 
        isSuccess={isSuccess} 
        submitAction={submitFeedback} 
      />
    </div>
  )
}

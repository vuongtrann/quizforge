"use client"

import { UploadCloud, CheckCircle2, Image as ImageIcon, X, ArrowRight } from "lucide-react"
import { useState, useRef } from "react"
import Link from "next/link"

export default function FeedbackForm({ 
  dict, 
  isSuccess,
  submitAction
}: { 
  dict: any, 
  isSuccess: boolean,
  submitAction: (formData: FormData) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files].slice(0, 3)); // Max 3
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isSuccess) {
    return (
      <div className="w-full flex flex-col items-center gap-6 animate-fade-in-up">
        <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black tracking-tighter">{dict.feedback.success_title}</h3>
          <p className="text-gray-500 font-medium">{dict.feedback.success_description}</p>
        </div>
        <Link 
          href="/feedback"
          className="pill-button-secondary text-sm mt-4"
        >
          Submit another feedback
        </Link>
      </div>
    );
  }

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        // Append images to formData manually if we want to process them
        // For now, let's just simulate or prepare for real upload
        selectedImages.forEach((file, i) => formData.append(`image_${i}`, file));
        await submitAction(formData);
        setIsSubmitting(false);
      }} 
      className="glass-card w-full p-8 md:p-12 flex flex-col gap-10 animate-fade-in-up"
    >
      <div className="space-y-4">
        <label htmlFor="content" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {dict.feedback.label_message}
        </label>
        <textarea 
          name="content" 
          id="content" 
          rows={6} 
          required
          placeholder={dict.feedback.placeholder_message}
          className="w-full rounded-[2rem] border border-gray-100 bg-gray-50/30 p-8 text-base font-medium focus:bg-white focus:border-black focus:outline-none focus:ring-8 focus:ring-black/5 transition-all outline-none resize-none"
        ></textarea>
      </div>
      
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {dict.feedback.label_attachments}
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {selectedImages.map((file, idx) => (
            <div key={idx} className="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden group">
               <img 
                 src={URL.createObjectURL(file)} 
                 alt="Preview" 
                 className="h-full w-full object-cover"
               />
               <button 
                 type="button" 
                 onClick={() => removeImage(idx)}
                 className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X className="h-3 w-3" />
               </button>
            </div>
          ))}
          
          {selectedImages.length < 3 && (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-black hover:text-black hover:bg-gray-50 transition-all group"
            >
              <ImageIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Image</span>
            </button>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple 
          accept="image/*"
          className="hidden" 
        />
        
        <p className="text-[10px] font-medium text-gray-400 italic">
          Max 3 images. PNG, JPG supported.
        </p>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="pill-button-primary py-5 text-base flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        {isSubmitting ? "..." : (
          <>
            {dict.feedback.submit}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  )
}

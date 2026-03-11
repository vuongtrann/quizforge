import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with proper conflict resolution.
 * Used by all shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

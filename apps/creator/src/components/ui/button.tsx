import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    // Base: platform-adaptive font, height, transitions
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none " +
    "font-[var(--font-weight-semibold)] font-[family-name:var(--ui-font)] " +
    "transition-[background,border-color,box-shadow,transform,opacity] " +
    "duration-[var(--dur-fast)] ease-[var(--ease)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 " +
    "disabled:pointer-events-none disabled:opacity-40 " +
    "active:scale-[0.98]",
    {
        variants: {
            variant: {
                // Accent: filled with system accent color
                default:
                    "bg-[var(--accent)] text-white " +
                    "border border-white/10 border-b-black/20 " +
                    "hover:bg-[var(--accent-hover)] " +
                    "active:bg-[var(--accent-pressed)] " +
                    "shadow-[var(--shadow-sm)]",

                // Standard / outlined: control fill
                outline:
                    "bg-[var(--bg-control)] text-[var(--text-primary)] " +
                    "border border-[var(--border-control)] border-b-[var(--border-control-b)] " +
                    "hover:bg-[var(--bg-control-hover)] " +
                    "shadow-[var(--shadow-sm)]",

                // Secondary: slightly tinted surface
                secondary:
                    "bg-[var(--bg-card-alt)] text-[var(--text-primary)] " +
                    "border border-[var(--border)] " +
                    "hover:bg-[var(--bg-control-hover)] hover:border-[var(--border-strong)]",

                // Subtle: transparent, no border
                ghost:
                    "bg-transparent text-[var(--text-secondary)] " +
                    "hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--text-primary)]",

                // Destructive: red accent
                destructive:
                    "bg-red-600 text-white border border-red-700/20 " +
                    "hover:bg-red-700 active:bg-red-800 " +
                    "shadow-[var(--shadow-sm)]",

                link:
                    "text-[var(--accent-text)] underline-offset-4 hover:underline bg-transparent",
            },
            size: {
                default: "h-8 px-3 text-[length:var(--font-size-body)] rounded-[var(--r-md)]",
                sm:      "h-7 px-2.5 text-xs rounded-[var(--r-md)]",
                lg:      "h-10 px-5 text-base rounded-[var(--r-lg)]",
                icon:    "h-8 w-8 rounded-[var(--r-md)]",
                "icon-sm": "h-7 w-7 rounded-[var(--r-sm)]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

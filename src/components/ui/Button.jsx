/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-light text-white shadow-[0_4px_20px_rgba(108,92,231,0.3)] hover:shadow-[0_6px_30px_rgba(108,92,231,0.5)] hover:-translate-y-0.5",
        destructive:
          "bg-accent text-white shadow-lg hover:bg-accent-light hover:-translate-y-0.5",
        outline:
          "border border-primary text-primary-light bg-transparent hover:bg-primary/10 hover:-translate-y-0.5",
        secondary:
          "bg-bg-card text-text-primary border border-border hover:bg-bg-elevated hover:-translate-y-0.5",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-bg-card",
        link:
          "text-primary-light underline-offset-4 hover:underline",
        success:
          "bg-success text-bg-dark font-bold shadow-[0_4px_20px_rgba(0,230,118,0.3)] hover:shadow-[0_6px_30px_rgba(0,230,118,0.5)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-10 text-base",
        xl: "h-14 px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }

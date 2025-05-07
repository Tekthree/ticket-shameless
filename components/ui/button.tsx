import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90", // Red button with white text
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90", // Darker red for destructive actions
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground", // Red outline with red text, fills on hover
        secondary:
          "bg-[#333333] text-white hover:bg-[#444444]", // Dark grey with white text
        ghost: "text-foreground hover:bg-[#333333] hover:text-primary", // Transparent with hover effect
        link: "text-primary underline-offset-4 hover:underline", // Red text with underline on hover
        ticket: "bg-primary text-white hover:bg-primary/90 rounded-full shadow-lg font-bold", // Red ticket button with rounded corners
        share: "bg-[#333333] text-white hover:bg-[#444444] rounded-full shadow-md", // Dark grey share button
        directions: "bg-[#262626] text-white hover:bg-[#333333] border border-[#444444] rounded-full", // Grey directions button
        success: "bg-green-600 text-white hover:bg-green-700", // Keep success green
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
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
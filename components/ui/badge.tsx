import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80", // Red badge with white text
        secondary:
          "border-transparent bg-[#333333] text-white hover:bg-[#444444]", // Dark grey badge with white text
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80", // Darker red for destructive actions
        outline: "border-primary text-primary bg-transparent", // Red outline with red text
        ghost: "border-[#333333] bg-transparent text-foreground hover:bg-[#333333]/10", // Subtle badge with hover effect
        success: "border-transparent bg-green-600 text-white hover:bg-green-700", // Green for success states
        info: "border-transparent bg-blue-600 text-white hover:bg-blue-700", // Blue for information
        warning: "border-transparent bg-yellow-600 text-white hover:bg-yellow-700", // Yellow for warnings
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

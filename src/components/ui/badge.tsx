import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Badges never wrap — single-line pill by design.
  // hover-elevate handles the hover state via a shared utility class.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // shadow-xs (not shadow) keeps the elevation subtle; hover handled by hover-elevate
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          // No explicit hover class — hover-elevate in the base handles it
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // shadow-xs keeps visual weight consistent with the default variant
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
          // Uses CSS variable --badge-outline so themes can control the border colour
        outline: "text-foreground border [border-color:var(--badge-outline)]",
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

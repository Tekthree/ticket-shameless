# UI Theme Implementation

This document outlines the UI theme implementation for the Ticket Shameless rebuild, focusing on shadcn/ui components with a black and grey color scheme and red as the brand color.

## Theme Overview

The application uses a consistent black and grey theme with red as the brand color throughout the public-facing interface, while providing light/dark mode toggle functionality exclusively in the admin interface.

### Color Palette

```
Primary (Brand Color): #FF0000 (Pure Red)
Background (Dark):     #121212 (Very Dark Grey)
Background (Light):    #F8F8F8 (Very Light Grey - Admin Only)
Text (Dark):           #F2F2F2 (Light Grey)
Text (Light):          #121212 (Very Dark Grey - Admin Only)
UI Elements:           #262626, #333333, #444444 (Various Grey Shades)
Borders:               #333333 (Dark Grey)
Focus Rings:           #FF0000 (Pure Red)
```

## shadcn/ui Implementation

All UI components are based on shadcn/ui to ensure consistency, accessibility, and maintainability. The following components have been customized to match our theme:

### Button Component

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90", // Red button with white text
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90", // Darker red for destructive actions
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground", // Red outline with red text
        secondary:
          "bg-[#333333] text-white hover:bg-[#444444]", // Dark grey with white text
        ghost: "text-foreground hover:bg-[#333333] hover:text-primary", // Transparent with hover effect
        link: "text-primary underline-offset-4 hover:underline", // Red text with underline on hover
        ticket: "bg-primary text-white hover:bg-primary/90 rounded-full shadow-lg font-bold", // Red ticket button
      },
      // Size variants remain unchanged
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Card Component

```tsx
// components/ui/card.tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-[#333333] bg-[#1E1E1E] text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-300",
      className
    )}
    {...props}
  />
))
```

### Input Component

```tsx
// components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#444444] bg-[#262626] px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Badge Component

```tsx
// components/ui/badge.tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80", // Red badge
        secondary: "border-transparent bg-[#333333] text-white hover:bg-[#444444]", // Dark grey badge
        outline: "border-primary text-primary bg-transparent", // Red outline badge
        // Additional variants as needed
      },
      defaultVariants: {
        variant: "default",
      },
    },
  }
)
```

## CSS Variables

The theme is implemented using CSS variables in the globals.css file:

```css
@layer base {
  :root {
    /* Public-facing theme (Dark with red accents) */
    --background: 0 0% 7%; /* Very dark grey background */
    --foreground: 0 0% 95%; /* Light grey text */
    --card: 0 0% 10%; /* Dark grey cards */
    --card-foreground: 0 0% 95%; /* Light grey text */
    --popover: 0 0% 10%; /* Dark grey popovers */
    --popover-foreground: 0 0% 95%; /* Light grey text */
    --primary: 0 100% 50%; /* Pure red as primary/brand color */
    --primary-foreground: 0 0% 100%; /* White text on red */
    --secondary: 0 0% 15%; /* Darker grey for secondary elements */
    --secondary-foreground: 0 0% 95%; /* Light grey text */
    --muted: 0 0% 15%; /* Darker grey for muted elements */
    --muted-foreground: 0 0% 65%; /* Medium grey text for muted elements */
    --accent: 0 100% 50%; /* Red accent matching primary */
    --accent-foreground: 0 0% 100%; /* White text on accent */
    --destructive: 0 100% 45%; /* Slightly darker red for destructive actions */
    --destructive-foreground: 0 0% 100%; /* White text on destructive */
    --border: 0 0% 20%; /* Darker grey for borders */
    --input: 0 0% 20%; /* Darker grey for input borders */
    --ring: 0 100% 50%; /* Red for focus rings */
    --radius: 0.5rem;
  }

  /* Admin-only light mode theme */
  .admin-light {
    --background: 0 0% 98%; /* Very light grey background */
    --foreground: 0 0% 7%; /* Very dark grey text */
    --card: 0 0% 100%; /* White cards */
    --card-foreground: 0 0% 7%; /* Very dark grey text */
    --popover: 0 0% 100%; /* White popovers */
    --popover-foreground: 0 0% 7%; /* Very dark grey text */
    --primary: 0 100% 50%; /* Pure red as primary/brand color (unchanged) */
    --primary-foreground: 0 0% 100%; /* White text on red (unchanged) */
    --secondary: 0 0% 92%; /* Light grey for secondary elements */
    --secondary-foreground: 0 0% 7%; /* Very dark grey text */
    --muted: 0 0% 96%; /* Very light grey for muted elements */
    --muted-foreground: 0 0% 45%; /* Medium grey text for muted elements */
    --accent: 0 100% 50%; /* Red accent matching primary (unchanged) */
    --accent-foreground: 0 0% 100%; /* White text on accent (unchanged) */
    --destructive: 0 100% 45%; /* Slightly darker red (unchanged) */
    --destructive-foreground: 0 0% 100%; /* White text on destructive (unchanged) */
    --border: 0 0% 85%; /* Light grey for borders */
    --input: 0 0% 85%; /* Light grey for input borders */
    --ring: 0 100% 50%; /* Red for focus rings (unchanged) */
  }
}
```

## Admin-Only Theme Toggle

The theme toggle is implemented only for the admin interface, allowing administrators to switch between dark and light modes based on their preference:

```tsx
// components/admin/ThemeToggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-md hover:bg-[#333333]/20 dark:hover:bg-[#333333]/50"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all text-yellow-500 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all text-gray-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle admin theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("admin-light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Theme Provider Configuration

The theme provider is configured to support both the default dark theme and the admin-only light theme:

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false}
          themes={["dark", "admin-light"]}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Admin Layout with Theme Toggle

The admin layout includes the theme toggle in the admin navigation:

```tsx
// app/admin/layout.tsx
import { AdminThemeToggle } from '@/components/admin/ThemeToggle'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <AdminNav />
          <div className="ml-auto flex items-center space-x-4">
            <AdminThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  )
}
```

## Component Usage Guidelines

1. **Always use shadcn/ui components** for consistency and accessibility.
2. **Maintain the black and grey theme with red accents** throughout the public-facing interface.
3. **Theme toggle is restricted to admin interfaces only**.
4. **Customize components through the provided variants** rather than with inline styles.

## Implementation Steps

1. Set up the CSS variables in globals.css
2. Configure the ThemeProvider in the root layout
3. Create the admin-specific theme toggle
4. Customize shadcn/ui components to match the theme
5. Implement the admin layout with theme toggle
6. Ensure consistent usage across all components

By following these guidelines, the application will maintain a consistent black and grey theme with red brand accents throughout the public interface, while providing administrators with the flexibility to choose between light and dark modes.

# Ticket Shameless: Design Guidelines

## Design Philosophy

The redesigned Ticket Shameless platform will follow these core design principles:

1. **Modern & Clean**: A contemporary design that feels professional yet approachable
2. **Consistent**: Unified visual language across all pages and components
3. **Accessible**: WCAG 2.1 AA compliant design for all users
4. **Responsive**: Seamless experience across all device sizes
5. **Performance-Focused**: Optimized for speed and efficiency

## Color Palette

### Primary Colors
- **Primary**: `#E53935` (Red 600) - Brand color for CTAs and important elements
- **Primary Dark**: `#C62828` (Red 800) - For hover states and emphasis
- **Primary Light**: `#FFCDD2` (Red 100) - For backgrounds and subtle accents

### Neutral Colors
- **Background (Light)**: `#FFFFFF` - Main background in light mode
- **Background (Dark)**: `#121212` - Main background in dark mode
- **Surface (Light)**: `#F5F5F5` - Card backgrounds in light mode
- **Surface (Dark)**: `#1E1E1E` - Card backgrounds in dark mode
- **Text (Light)**: `#212121` - Primary text in light mode
- **Text (Dark)**: `#E0E0E0` - Primary text in dark mode

### Accent Colors
- **Success**: `#4CAF50` - For success states and confirmations
- **Warning**: `#FFC107` - For warnings and caution states
- **Error**: `#F44336` - For error states and critical information
- **Info**: `#2196F3` - For informational elements

## Typography

### Font Families
- **Headings**: Inter (sans-serif)
- **Body**: Inter (sans-serif)
- **Monospace**: JetBrains Mono (for code and technical information)

### Font Sizes
- **Display**: 3rem (48px)
- **H1**: 2.25rem (36px)
- **H2**: 1.875rem (30px)
- **H3**: 1.5rem (24px)
- **H4**: 1.25rem (20px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)
- **XSmall**: 0.75rem (12px)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Component Design

### Buttons
- **Primary**: Solid background with the primary color, rounded corners (8px)
- **Secondary**: Outlined with the primary color, transparent background
- **Tertiary**: Text-only with primary color, no background or border
- **Disabled**: Reduced opacity (0.5) with no hover effects
- **Loading**: Include a spinner animation when in loading state

### Cards
- Subtle shadow (`0 2px 8px rgba(0, 0, 0, 0.1)`)
- Rounded corners (12px)
- Consistent padding (24px)
- Optional hover effect with slight elevation increase
- Clear visual hierarchy for content

### Forms
- **Inputs**: Consistent height (48px), padding, and border radius (8px)
- **Labels**: Clear positioning above inputs
- **Validation**: Inline error messages with error color
- **Checkboxes/Radios**: Custom styling with animations
- **Dropdowns**: Custom styling with smooth animations
- **OAuth Buttons**: Prominent social login buttons with proper branding
  - Google sign-in button following Google's brand guidelines
  - Clear visual separation between OAuth and traditional login
  - Consistent styling for all authentication methods

### Navigation
- **Navbar**: Fixed position with subtle shadow
- **Mobile Menu**: Slide-in from right with smooth animation
- **User Dropdown**: Clean dropdown with user avatar and role-specific options
- **Breadcrumbs**: For complex navigation paths

## Page Layouts

### Landing Page
- Hero section with featured event and clear CTA
- Grid of upcoming events with filtering options
- Featured artists section
- Newsletter signup
- About section with venue information

### Event Pages
- Large hero image with blurred background
- Clear event details (date, time, venue)
- Artist lineup with links to artist profiles
- Ticket purchase options with clear pricing
- Related events section

### Profile Pages
- User information with avatar
- Ticket history in card format
- Account settings
- Payment methods (if applicable)
- Preferences section

### Admin Dashboard
- Sidebar navigation for admin features
- Overview dashboard with key metrics
- Data tables for event and user management
- Form-based interfaces for content creation
- Filtering and search capabilities

### Box Office Interfaces

#### Point of Sale (POS) Interface
- Large, touch-friendly buttons for quick access
- Event selection with prominent visuals
- Ticket type selection with clear pricing
- Customer information capture form
- Payment method selection (cash/card)
- Receipt generation options
- Quick action buttons for common tasks
- Transaction history view
- Cash drawer management interface

#### Ticket Scanning Interface
- Camera access for QR code scanning
- Manual entry option for ticket codes
- Large, clear validation indicators (green/red)
- Ticket information display on scan
- Attendance counter with real-time updates
- Problem resolution interface for exceptions
- Guest list lookup functionality
- Offline mode for poor connectivity scenarios

#### Box Office Reports
- Sales summary by event, staff, and time period
- Attendance tracking with real-time updates
- Staff performance metrics
- Payment method breakdown
- Graphical representations of key metrics
- Export functionality for data analysis
- Filter controls for customized reporting
- Guest list status tracking

## UI Patterns

### Loading States
- Skeleton loaders for content
- Spinner for actions
- Progress indicators for multi-step processes

### Empty States
- Helpful illustrations
- Clear messaging
- Relevant CTAs to guide users

### Error States
- Clear error messages
- Helpful recovery suggestions
- Consistent styling across the application

### Success States
- Confirmation messages
- Next step suggestions
- Celebration animations for key actions

## Animation Guidelines

### Transitions
- **Duration**: 150-300ms
- **Easing**: Ease-out for entering, ease-in for exiting
- **Properties**: Transform, opacity, background-color

### Micro-interactions
- Subtle feedback for user actions
- Button hover/active states
- Form field focus states
- Loading indicators

### Page Transitions
- Fade transitions between pages
- Slide transitions for related content
- Maintain scroll position when appropriate

## Image Guidelines

### Event Images
- 16:9 aspect ratio for consistency
- Minimum resolution: 1200x675px
- Optimized file size (WebP format when possible)
- Focal point consideration for responsive cropping

### Artist Images
- 1:1 aspect ratio (square)
- Minimum resolution: 600x600px
- Consistent style and framing

### UI Icons
- Use Lucide React icons for consistency
- 24x24px default size
- Consistent stroke width (2px)
- Match to text color

## Responsive Breakpoints

- **Mobile**: 0-639px
- **Tablet**: 640px-1023px
- **Desktop**: 1024px-1279px
- **Large Desktop**: 1280px+

## Accessibility Guidelines

- Minimum contrast ratio of 4.5:1 for all text
- Focus indicators for keyboard navigation
- ARIA labels for interactive elements
- Alt text for all images
- Keyboard navigable interfaces
- Screen reader friendly content structure

## Dark Mode Implementation

- True black background (`#121212`) for OLED screens
- Reduced contrast to prevent eye strain
- Maintain readability with appropriate text colors
- Consistent component styling between modes
- Smooth transition when switching modes

## Implementation Notes

### CSS Strategy
- Use Tailwind CSS for consistent styling
- Create custom utility classes for repeated patterns
- Use CSS variables for theming
- Implement responsive design with mobile-first approach

### Component Library
- Use shadcn/ui as the foundation
- Extend with custom components as needed
- Maintain consistent props and behavior
- Document all components with examples

### Design Tokens
- Implement design tokens for colors, spacing, typography
- Use CSS variables for easy theming
- Consistent naming convention
- Document all tokens for developer reference

## Event Detail Page Design

Based on the existing implementation, the event detail page should feature:

1. **Hero Section**
   - Large event image prominently displayed at the top
   - Heavily blurred version of the same image as background (40px blur)
   - Contrast and brightness adjustments for the background image
   - Clean card presentation with 16:9 aspect ratio for the main image
   - Compact spacing between navigation and event image card

2. **Event Information**
   - Clear typography hierarchy for event title and details
   - Prominent display of date, time, and venue
   - Artist lineup with links to artist profiles
   - Ticket pricing and availability information

3. **Purchase Section**
   - Clear call-to-action for ticket purchase
   - Quantity selector with inventory awareness
   - Secure checkout button with Stripe integration
   - Order summary with transparent pricing
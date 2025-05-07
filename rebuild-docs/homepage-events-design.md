# Homepage and Event Pages Design Specification

This document provides detailed design specifications for the homepage and event pages, with particular focus on the artist music playback functionality. These specifications should be followed precisely when rebuilding the application to maintain design consistency.

## Homepage Design

### Hero Section

- **Full-screen Height**: The hero section occupies 100vh (full viewport height)
- **Background Options**:
  - Video background (if `heroVideo` is provided)
  - Image background with 70% opacity (if no video)
- **Content Overlay**:
  - Centered vertically and horizontally
  - Text is white and center-aligned
- **Typography**:
  - Main heading: Font size 10rem (desktop) / 8rem (mobile), using custom "Qikober" font
  - Subtitle: Font size 2rem (desktop) / 1.5rem (mobile)
- **CTA Button**:
  - Red background with white text
  - Rounded corners
  - Padding: 0.75rem 2rem
  - Text size: 1.125rem
  - Hover effect: Slightly darker red

### About Section

- **Background**: Light gray (#f3f4f6)
- **Layout**:
  - Two-column layout on desktop (image left, text right)
  - Single column on mobile (image top, text bottom)
  - Max width of content: 1024px (4xl)
  - Centered in container
- **Image**:
  - Rounded corners (0.5rem)
  - Aspect ratio preserved
- **Typography**:
  - Heading: Font size 2.5rem, bold
  - Body text: Font size 1.125rem
  - Paragraph spacing: 1rem

### Events Section

- **Background**: White
- **Layout**:
  - Three-column grid on desktop
  - Two-column grid on tablet
  - Single column on mobile
  - Gap between cards: 2rem
- **Section Title**:
  - Font size 2.5rem, bold
  - Center-aligned
  - Bottom margin: 3rem
- **View All Button**:
  - Secondary button style (outlined)
  - Center-aligned
  - Top margin: 3rem

### Motto Section

- **Background**: Black
- **Text Color**: White
- **Layout**:
  - Two-column layout on desktop (text left, image right)
  - Single column on mobile (text top, image bottom)
  - Content container with max width
- **Typography**:
  - Heading: Font size 2.5rem, bold
  - Body text: Font size 1.125rem
  - Paragraph spacing: 1rem
- **Image**:
  - Rounded corners (0.5rem)
  - Aspect ratio preserved

## Event Card Component

- **Container**:
  - Full height card with shadow
  - Hover effect: Enhanced shadow
  - Rounded corners
  - Overflow hidden
  - Flex column layout
- **Image Area**:
  - Fixed height of 16rem (h-64)
  - Image fills container with object-cover
  - Hover effect: Slight opacity reduction (90%)
- **Sold Out Badge**:
  - Red background
  - Positioned top-right
  - Small padding
  - Rounded corners
- **Audio Player**:
  - Small play button in bottom-right corner
  - Only visible if artist has mix URL
  - Size: Small (sm)
- **Content Area**:
  - Padding: 1.5rem top, 0.5rem bottom
  - Title: Font size 1.25rem, bold
  - Date and venue with icon prefixes
  - Icons are small (1rem) and have right margin
- **Footer**:
  - Price in red, bold
  - "View Details" button with right arrow icon
  - Button is outlined style

## Event Page Design

### Background Effect

- **Fixed Background Image**:
  - Event image with heavy blur (40px)
  - Increased contrast (120%)
  - Reduced brightness (60%)
  - Scale: 1.05 to ensure coverage
  - Opacity: 80%
- **Overlay Gradient**:
  - Black to transparent gradient from bottom to top
  - Dark overlay to reduce image prominence (50% black)

### Hero Section

- **Spacing**:
  - Top padding: 3rem
  - Bottom padding: 3rem
- **Event Image Card**:
  - Max width: 2xl (42rem)
  - Centered horizontally
  - Border: thin gray-800
  - Rounded corners
  - Shadow effect
  - 16:9 aspect ratio

### Event Details Section

- **Layout**:
  - Two-column grid on desktop (main content and ticket box)
  - Single column on mobile
  - Gap between columns: 2rem
- **Typography**:
  - Event title: Font size 7rem (desktop) / 6rem (mobile), using custom "Qikober" font
  - Venue: Font size 1.25rem
  - Date/time: Font size 1rem, red color
  - Section headings: Font size 1.5rem, bold
- **Content Sections**:
  - Each section separated by gray-800 border
  - Consistent vertical spacing (1.5rem)
- **Mobile Buy Tickets Button**:
  - Only visible on mobile
  - Red background
  - Rounded full
  - Bold text

### Ticket Box

- **Container**:
  - Background: Semi-transparent dark gray (90% opacity) with backdrop blur
  - Border: thin gray-800
  - Rounded corners
  - Padding: 1.5rem
  - Sticky positioning (top: 1rem)
  - z-index: 20
- **Price Display**:
  - Font size: 1.875rem
  - Bold
- **Ticket Count**:
  - Gray text
  - Shows remaining tickets or "Sold out"
- **Buy Button**:
  - Full width
  - Red background (or gray if sold out)
  - Bold text
  - Rounded full
- **Terms**:
  - Small gray text
  - Bullet points for policies

### Lineup Section

- **Layout**:
  - List of artists with consistent spacing
  - Each artist in a row with bottom border (except last)
  - Padding: 1rem vertical
- **Artist Display**:
  - Circular avatar (48px x 48px)
  - Artist name: Bold, font size 1.125rem
  - Performance time (if available): Gray text
- **Artist Image Handling**:
  - Shows image if available
  - Falls back to first letter of artist name if no image

### Venue Section

- **Layout**:
  - Venue name and address
  - Google Map component
  - Directions link
- **Map**:
  - Interactive Google Maps embed
  - Consistent height
- **Directions Link**:
  - Outlined button with map pin icon
  - Opens Google Maps in new tab

## Artist Music Player Implementation

### ArtistTrackCard Component

- **Container**:
  - Dark semi-transparent background (80% opacity) with backdrop blur
  - Border: thin gray-800
  - Rounded corners
- **Artist Info**:
  - Small circular avatar (40px x 40px)
  - Artist name: Bold
  - "Listen to mix" text in gray
- **Play Button**:
  - Circular black button
  - Play/pause icon
  - Position: Right side of card
  - Size: 40px x 40px
- **Embedded Player**:
  - Only shown when play is clicked
  - Border top: thin gray-800
  - Close button in top-right
  - Height: 180px
  - Width: 100%
- **Platform Support**:
  - SoundCloud: Automatic embed URL generation
  - Mixcloud: Automatic embed URL generation
  - Proper URL encoding for each platform

### AudioPlayer Component

- **Global Audio Context**:
  - Manages currently playing audio across the site
  - Ensures only one audio plays at a time
- **Button Appearance**:
  - Circular semi-transparent black background
  - White play/pause icon
  - Available in three sizes (sm, md, lg)
  - Positioned absolutely with four position options
- **Playback Behavior**:
  - Automatically pauses other playing audio
  - Handles errors gracefully
  - Cleans up on unmount
- **Audio Source Handling**:
  - Supports direct audio files
  - Handles SoundCloud URLs
  - Prepared for Spotify integration (commented)

## Implementation Details for Artist Music

1. **Data Structure**:
   ```typescript
   interface Artist {
     id?: string;
     name: string;
     image?: string;
     time?: string;
     mix_url?: string;
     description?: string;
   }
   ```

2. **URL Handling for Different Platforms**:
   - SoundCloud embed URL format:
     ```
     https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true
     ```
   - Mixcloud embed URL format:
     ```
     https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(url.split('mixcloud.com')[1])}
     ```

3. **Audio Context Management**:
   - Create a global context to track currently playing audio
   - Implement functions to set and clear current audio
   - Handle cleanup on component unmount

4. **Player States**:
   - Loading state with visual indicator
   - Playing state with pause icon
   - Paused state with play icon
   - Error state with error message

5. **Event Handling**:
   - `play` event: Update UI and clear errors
   - `ended` event: Reset player state
   - `error` event: Show error message and reset state

## Responsive Behavior

### Homepage Responsive Breakpoints

- **Mobile** (< 768px):
  - Single column layout for all sections
  - Reduced font sizes
  - Full-width cards and images

- **Tablet** (768px - 1023px):
  - Two-column grid for events
  - Two-column layout for about and motto sections
  - Adjusted font sizes

- **Desktop** (≥ 1024px):
  - Three-column grid for events
  - Two-column layout for about and motto sections
  - Full font sizes

### Event Page Responsive Breakpoints

- **Mobile** (< 768px):
  - Single column layout
  - Ticket box below event details
  - Mobile buy button visible near top
  - Reduced title font size

- **Tablet/Desktop** (≥ 768px):
  - Two-column layout (2/3 for content, 1/3 for ticket box)
  - Sticky ticket box
  - Full title font size
  - Mobile buy button hidden

## Animation and Interaction

1. **Scroll Effects**:
   - Track scroll position to adjust visual effects
   - Maximum effect reached at 500px scroll distance

2. **Hover Effects**:
   - Cards: Enhanced shadow on hover
   - Images: Slight opacity reduction on hover
   - Buttons: Color change on hover

3. **Audio Player Interaction**:
   - Smooth transition between play/pause states
   - Visual feedback for loading and error states

4. **Purchase Success Handling**:
   - Show success message when URL contains success=true
   - Scroll to top to ensure message visibility
   - Display purchaser email if available in URL

## Real-time Updates

1. **Ticket Count Updates**:
   - Fetch current ticket count on page load
   - Update when user returns to tab (visibilitychange event)
   - Periodic refresh every 30 seconds
   - Update UI when sold out status changes

2. **API Integration**:
   - Endpoint: `/api/events/${event.id}/tickets-remaining`
   - Response format: `{ ticketsRemaining: number, soldOut: boolean }`

## Color Scheme

- **Primary Red**: #E53935 (used for accents, buttons, prices)
- **Black**: #000000 (backgrounds, text)
- **White**: #FFFFFF (text on dark backgrounds)
- **Dark Gray**: #1F2937 (card backgrounds, borders)
- **Light Gray**: #F3F4F6 (section backgrounds)
- **Medium Gray**: #6B7280 (secondary text)

## Typography

- **Primary Font**: System font stack
- **Special Font**: "Qikober" for large titles
- **Heading Sizes**:
  - Hero: 10rem/8rem (desktop/mobile)
  - Section titles: 2.5rem
  - Card titles: 1.25rem
- **Body Text**: 1.125rem
- **Small Text**: 0.875rem

## Accessibility Considerations

1. **Alternative Text**:
   - All images have descriptive alt text
   - Decorative images have empty alt attributes

2. **Semantic HTML**:
   - Proper heading hierarchy
   - Semantic section elements
   - ARIA labels where appropriate

3. **Keyboard Navigation**:
   - Interactive elements are keyboard accessible
   - Focus states are visible

4. **Screen Reader Support**:
   - Audio player has proper aria-label
   - Status messages are properly announced

## Content Management

1. **Dynamic Content**:
   - Hero section content from CMS
   - About section content from CMS
   - Motto section content from CMS

2. **Fallback Content**:
   - Default values provided for all dynamic content
   - Error handling for content loading failures
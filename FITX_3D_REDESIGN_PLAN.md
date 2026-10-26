# FITX 3D Website Redesign - Development Plan

## Goal
Transform the current FITX Gym website into a fully immersive 3D experience with smooth scroll animations (inspired by igloo.inc), add a blog section, integrate all provided gym photos, and implement an AI chatbot for Q&A.

## Current State Analysis
- Next.js 16 + TypeScript + Prisma + Tailwind CSS v4
- Currently has 9 pages (Home, Who We Are, Services, Coaches, Gallery, Success Stories, Plans, Timetable, Contact)
- Has all gym content in database/seed
- Images folder: `Fitx Pics/` with 23 photos (logo.png + gym photos)
- Current UI is modern but client wants more immersive 3D experience

## Target Experience (igloo.inc Inspired)
- **Immersive 3D**: WebGL/Three.js scenes integrated throughout
- **Scroll-driven animations**: GSAP ScrollTrigger for smooth parallax, reveals, camera movements
- **Cinematic feel**: Heavy use of motion, transitions, and depth
- **Minimal, bold typography**: Large display text with scroll effects
- **Interactive elements**: 3D objects that respond to scroll/cursor
- **Performance-focused**: Lazy loading, optimized models, reduced motion support

## New Features Required
1. **Blog Page** - Add `/blog` with listing and individual post pages
2. **All Photos Integrated** - Use all images from `Fitx Pics/` folder across site
3. **3D Web Experience** - Three.js/React Three Fiber integration
4. **Scroll Animations** - GSAP + ScrollTrigger
5. **AI Chatbot** - Q&A chatbot for gym inquiries (hours, pricing, services, etc.)

## Technical Stack Additions
- **3D**: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- **Animation**: `gsap`, `lenis` (smooth scroll), `framer-motion` (UI animations)
- **AI Chatbot**: `ai`, `openai` or use a simple rule-based approach (since no backend admin mentioned, maybe client-side with knowledge base)
- **Blog**: Extend Prisma schema or use file-based MDX? Check current schema

## Development Plan

### Phase 1: Setup & Planning (Day 1)
- [ ] Audit all images in `Fitx Pics/` folder
- [ ] Review current Prisma schema for blog needs
- [ ] Install required dependencies
- [ ] Create design concept/structure

### Phase 2: Asset Preparation (Day 1-2)
- [ ] Copy and optimize images to `public/images/fitx/`
- [ ] Organize images by category (hero, gallery, coaches, equipment)
- [ ] Create image mapping for use across site
- [ ] Consider adding a hero video if available

### Phase 3: 3D Foundation (Day 2-3)
- [ ] Set up React Three Fiber canvas
- [ ] Create reusable 3D components
- [ ] Implement smooth scroll with Lenis
- [ ] Add GSAP ScrollTrigger
- [ ] Create base scene components
- [ ] Add loading screen

### Phase 4: Homepage Redesign (Day 3-5)
- [ ] Hero section with 3D elements (dumbbells, gym equipment, or abstract shapes)
- [ ] Scroll-driven camera animations
- [ ] Parallax sections using gym photos
- [ ] Animated typography
- [ ] Smooth transitions between sections
- [ ] Integrate real gym photos

### Phase 5: Blog System (Day 5-6)
- [ ] Add Blog model to Prisma schema (if needed) or create static blog
- [ ] Create `/blog` listing page with 3D cards
- [ ] Create `/blog/[slug]` post page
- [ ] Add blog to navigation
- [ ] Seed with sample blog posts about fitness/gym

### Phase 6: Other Pages Enhancement (Day 6-7)
- [ ] Redesign all existing pages with 3D elements
- [ ] Gallery page with 3D image gallery/carousel
- [ ] Services with interactive 3D cards
- [ ] Coaches with 3D profile displays
- [ ] Plans page with animated pricing cards

### Phase 7: AI Chatbot (Day 7-8)
- [ ] Create chatbot UI component (floating button)
- [ ] Build knowledge base from gym info (hours, prices, services, location)
- [ ] Implement Q&A logic (rule-based or OpenAI if API key available)
- [ ] Add context-aware responses
- [ ] Style to match 3D aesthetic
- [ ] Make it responsive

### Phase 8: Polish & Optimization (Day 8-9)
- [ ] Performance optimization (lazy load 3D, code splitting)
- [ ] Mobile responsiveness for 3D (fallbacks)
- [ ] Reduced motion support
- [ ] SEO optimization
- [ ] Cross-browser testing
- [ ] Final touches and animations

## File Structure Changes
```
src/
├── app/
│   ├── (site)/
│   │   ├── blog/           # New blog pages
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── ... (existing)
├── components/
│   ├── 3d/                 # New 3D components
│   │   ├── Canvas.tsx
│   │   ├── Scene.tsx
│   │   ├── Hero3D.tsx
│   │   └── ...
│   ├── animations/         # GSAP/ScrollTrigger components
│   ├── blog/               # Blog components
│   └── chatbot/            # AI chatbot
├── lib/
│   ├── blog/               # Blog utilities
│   └── chatbot/            # Chatbot logic/knowledge base
└── styles/
    └── animations.css

public/
└── images/
    └── fitx/               # All gym photos
```

## Dependencies to Install
```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install gsap @gsap/react lenis
npm install framer-motion
npm install ai openai  # or skip if using rule-based
npm install next-mdx-remote gray-matter  # for blog
```

## Key Design Elements
- **Color Scheme**: Keep brand colors (#FF4B00, #1E2330, #0D0A10) but add neon/glow effects
- **Typography**: Bold display fonts, large scale on scroll
- **3D Objects**: Geometric shapes, gym equipment silhouettes, abstract forms
- **Backgrounds**: Dark gradients with animated 3D scenes
- **Images**: Full-bleed gym photos with parallax
- **Cursor**: Custom cursor for interactive feel (optional but nice)

## Implementation Notes
- Use dynamic imports for Three.js components (SSR issues)
- Implement `useReducedMotion` for accessibility
- Mobile: Simplify or disable 3D, keep animations
- Loading states for 3D assets
- Keep existing SEO structure
- Maintain contact form functionality
- Blog can be simple initially (static data) without full CMS complexity

## First Steps
1. Copy all images from `Fitx Pics/` to `public/images/fitx/`
2. Install dependencies
3. Create 3D canvas setup
4. Start with homepage hero redesign
5. Add blog structure

This is a significant redesign but builds on the existing solid foundation. Let's start implementing.

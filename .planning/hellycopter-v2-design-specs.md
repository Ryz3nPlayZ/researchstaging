# Hellycopter v2 — Design System Specifications

**Last Updated:** 2026-02-18 (Recreated from memory after deletion)

---

## Part 1: Visual Design System

### Design Philosophy
Clean, modern dashboard with a bento-grid layout. Light, airy background with strategic use of the green palette for branding. Focus on whitespace, rounded corners, and subtle shadows.

### Color Palette

**Background:**
- **Page BG:** `#F5F5F7` — Light gray, almost white
- **Card BG:** `#FFFFFF` — Pure white for cards
- **Card BG Secondary:** `#FAFAFA` — Subtle off-white for nested sections

**Primary Brand Colors (USED SPARINGLY — accents only, not backgrounds):**
- **Soft Pistachio:** `#DEF4C6` — Subtle accents, badges
- **Mint Bloom:** `#73E2A7` — Primary CTA, active states
- **Forest Jade:** `#1C7C54` — Icons, secondary text
- **Deep Evergreen:** `#1B512D` — Logo, headings

**Text Colors:**
- **Primary:** `#1B512D` — Headings, important text
- **Secondary:** `#4A5D4A` — Body text
- **Tertiary:** `#8A9A8A` — Labels, placeholders
- **Muted:** `#B8C4B8` — Disabled, hints

**Semantic Colors:**
- **Success:** `#1C7C54`
- **Warning:** `#F0A04B`
- **Error:** `#E57373`

### Typography System

**Font Family:** Inter (clean, modern sans-serif)

| Element | Size | Weight | Line Height |
|----------|------|--------|-------------|
| H1 (Hero) | 40px | 700 | 1.2 |
| H2 (Section) | 24px | 600 | 1.3 |
| H3 (Card Title) | 18px | 600 | 1.4 |
| Body | 15px | 400 | 1.5 |
| Body Small | 13px | 400 | 1.5 |
| Caption | 12px | 500 | 1.4 |
| Label | 11px | 600 | 1.2 |

### Spacing System

**Base Unit:** 4px

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Compact spacing |
| md | 12px | Standard padding |
| lg | 16px | Card padding |
| xl | 24px | Section gaps |
| 2xl | 32px | Major sections |
| 3xl | 48px | Page padding |

**Container:**
- Max width: 1200px
- Page padding: 24px
- Grid gap: 16px

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Small elements |
| md | 12px | Buttons, inputs |
| lg | 16px | Cards |
| xl | 20px | Large cards |
| 2xl | 24px | Hero tiles |
| full | 9999px | Pills, avatars |

### Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| sm | `0 1px 2px rgba(0,0,0,0.04)` | Subtle |
| md | `0 2px 8px rgba(0,0,0,0.06)` | Cards |
| lg | `0 4px 16px rgba(0,0,0,0.08)` | Elevated |
| hover | `0 8px 24px rgba(0,0,0,0.12)` | Card hover |

---

## Part 2: Layout Structure (Bento Grid)

### Overall Layout
```
[Navbar] - Fixed top

[Main Content] - Max-width 1200px, centered

  [Hero Row] - 2 columns on desktop
    [Left: Large Visual Tile]  - 60% width, ~280px height
    [Right: Greeting Card]     - 40% width, ~280px height

  [Bento Grid] - CSS Grid with auto-flow
    [Stats Tile]          - 2x1 (spans 2 cols)
    [Active Project]      - 1x2 (spans 2 rows)
    [Quick Actions]       - 1x1
    [AI Activity]         - 1x1
    [Recent Documents]    - 2x1
    [Team Activity]       - 1x1
```

### Grid Configuration
```css
display: grid;
grid-template-columns: repeat(4, 1fr);
grid-auto-rows: minmax(140px, auto);
gap: 16px;
```

### Tile Sizes
- **Large (2x2):** Hero visual, main project card
- **Wide (2x1):** Stats row, recent documents
- **Tall (1x2):** Active project details
- **Small (1x1):** Quick actions, AI activity, team

---

## Part 3: Content Sections

### Section: Navbar

**Layout:**
- Fixed top, z-50
- Height: 64px
- Background: White with subtle shadow
- Max-width: 1200px centered

**Structure:**
```
[Logo] -------- [Dashboard] [Projects] -------- [Search] [Bell] [Avatar] [+ New]
```

**Style:**
- Logo: Abstract icon + "Research Hub" wordmark
- Nav items: Pill-shaped on hover
- Search: Rounded input with icon
- New button: Mint Bloom bg, white text, rounded-full

### Section: Hero Row

**Left Tile: Visual Banner**
- Size: ~720px x 280px
- Border radius: 24px
- **REMOVED:** This felt "soapy/slippery" — not grounded for research
- **Replacement:** Data-first overview card with real stats

**Right Tile: Greeting Card**
- Size: ~460px x 280px
- Background: White
- Border radius: 24px
- Shadow: md
- Content: Greeting + quick actions

### Section: Stats Tile (2x1)

**Layout:**
- Horizontal row of 4 mini stat cards
- Each: Icon + number + label

**Content:**
1. 📁 Active Projects
2. 📄 Documents
3. ✨ AI Queries
4. 📊 Analyses

### Section: Active Project Tile (1x2)

**Layout:**
- Vertical stack
- Top: Project image/thumbnail
- Bottom: Details

**Content:**
- Title
- Progress bar
- Stats (docs, queries, analyses)
- Recent activity
- CTA: "Open Project"

---

## Part 4: Interactions

### Page Load
- Navbar slides down (0.3s)
- Tiles fade in with stagger (50ms delay each)
- Easing: cubic-bezier(0.22, 1, 0.36, 1)

### Card Hover
- Scale: 1.01
- Shadow: Elevate to hover level
- Duration: 200ms

### Button Hover
- Primary: Darken 10%
- Secondary: Background fill

### Progress Bars
- Animate width on scroll into view
- Duration: 800ms

---

## Part 5: Responsive

**Desktop (1200px+):** Full 4-column bento grid
**Tablet (768px-1199px):** 2-column grid, stack hero
**Mobile (<768px):** Single column, all tiles full width

---

## Part 6: Component Inventory

### Shadcn/UI Components (Built-in)
| Component | Purpose | Customization |
|-----------|---------|---------------|
| Button | CTAs, actions | Custom colors, sizes |
| Card | Stats cards, project cards | Custom borders, shadows |
| Avatar | User profiles, team members | - |
| Badge | Status indicators | Custom colors |
| Progress | Project progress bars | Custom colors |
| Input | Search field | Custom focus states |
| Tooltip | Icon explanations | - |
| Separator | Visual dividers | - |

### Custom Components to Build
| Component | Purpose | Location |
|-----------|---------|----------|
| TopNavbar | Main navigation | `components/TopNavbar.tsx` |
| HeroBanner | Cover image with glassmorphism | `sections/HeroBanner.tsx` |
| GlassPane | Reusable glassmorphism panel | `components/GlassPane.tsx` |
| StatCard | Animated stat display | `components/StatCard.tsx` |
| ProjectCard | Project overview card | `components/ProjectCard.tsx` |

---

## Part 7: Animation Implementation

### Page Load Stagger Pattern
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
```

---

## Part 8: Key Implementation Notes

### Glassmorphism Effect
```css
.glass-pane {
  @apply bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl;
}
```

### Counter Animation Hook
```typescript
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}
```

---

## Part 9: Performance Considerations

1. **Images:** Use Next.js Image component with proper sizing
2. **Animations:** Use `transform` and `opacity` only
3. **Fonts:** Preload Inter, use `font-display: swap`
4. **Reduced Motion:** Respect `prefers-reduced-motion`
5. **Lazy Loading:** Defer non-critical animations

---

## Part 10: Tailwind Config

```javascript
// tailwind.config.js extend colors
colors: {
  pistachio: '#DEF4C6',
  mint: '#73E2A7',
  jade: '#1C7C54',
  evergreen: '#1B512D',
  'offwhite': '#FAFDF7',
  'gray-research': {
    100: '#F0F4EE',
    400: '#8A9A8A',
    800: '#2D3A2D',
  }
}
```

---

## Critical Design Rules

1. **Green is an accent, not a background** — Use pistachio/mint sparingly for highlights only
2. **Cards on light gray, not green backgrounds** — White cards on #F5F5F7 page
3. **Grounded over "slippery"** — Avoid soapy/glassmorphism everywhere
4. **Real data over decorative visuals** — Show actual project info, not abstract shapes
5. **Professional over playful** — This is research software, not a consumer app
6. **Intentional over comprehensive** — Each element serves a specific purpose

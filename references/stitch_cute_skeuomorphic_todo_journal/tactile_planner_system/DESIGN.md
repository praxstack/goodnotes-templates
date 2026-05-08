---
name: Tactile Planner System
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#514346'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#837376'
  outline-variant: '#d5c2c5'
  surface-tint: '#82505c'
  primary: '#82505c'
  on-primary: '#ffffff'
  primary-container: '#dda0ad'
  on-primary-container: '#633641'
  inverse-primary: '#f5b6c3'
  secondary: '#466554'
  on-secondary: '#ffffff'
  secondary-container: '#c8ebd5'
  on-secondary-container: '#4c6b5a'
  tertiary: '#625a78'
  on-tertiary: '#ffffff'
  tertiary-container: '#b5abcd'
  on-tertiary-container: '#463f5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e0'
  primary-fixed-dim: '#f5b6c3'
  on-primary-fixed: '#340f1a'
  on-primary-fixed-variant: '#673944'
  secondary-fixed: '#c8ebd5'
  secondary-fixed-dim: '#adceba'
  on-secondary-fixed: '#022114'
  on-secondary-fixed-variant: '#2f4d3d'
  tertiary-fixed: '#e8ddff'
  tertiary-fixed-dim: '#cbc1e5'
  on-tertiary-fixed: '#1e1732'
  on-tertiary-fixed-variant: '#4a4360'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-accent:
    fontFamily: Comfortaa
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1-rounded:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  h2-rounded:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-main:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  handwritten-note:
    fontFamily: Comfortaa
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-a4: 48px
  gutter-binder: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is centered on "Digital Coziness"—a bridge between the nostalgic, tactile nature of physical scrapbooking and the fluid convenience of modern software. The personality is gentle, encouraging, and whimsical, aiming to reduce "productivity anxiety" through soft edges and friendly forms.

The visual style merges **Claymorphism** and **Skeuomorphism**. Interface elements use inner shadows and multiple light sources to appear like soft matte plastic or clay (puffy, 3D), while the background surfaces utilize realistic paper textures and metal ring-binder components to ground the experience in a familiar A4 planner format. The target audience values aesthetic personalization and an emotional connection to their organizational tools.

## Colors

The palette is derived from soft pastels that evoke a sense of calm and creativity. 
- **Cream Paper** serves as the primary canvas color, treated with a subtle grain texture to mimic high-quality cardstock.
- **Dusty Rose** and **Lavender** are used for primary actions, decorative accents, and high-priority categorization.
- **Mint Green** functions as a secondary accent, ideal for "success" states or wellness-related tracking.
- **Ink Grey** replaces pure black for all text to maintain the soft aesthetic and improve readability against the cream background.

## Typography

This design system utilizes a tiered typography approach to balance whimsy with functional clarity. 
- **Headlines:** Use **Quicksand** for its distinctively rounded terminals, providing a friendly, architectural feel to the planner's sections.
- **Body:** **Nunito Sans** ensures high legibility for long-form journaling or task lists while maintaining the "rounded" visual language.
- **Accents:** **Comfortaa** is utilized for callouts, "sticky note" captions, and decorative labels, mimicking a clean, playful handwriting style.
- **Labels:** **Be Vietnam Pro** provides a slightly more contemporary and structured feel for metadata and navigation items.

## Layout & Spacing

The layout is strictly modeled after an **A4 portrait orientation**. 
- **The Binder Spine:** A central vertical gutter (64px) is reserved for the skeuomorphic ring-binder graphic. 
- **Safe Margins:** A generous 48px margin exists on the outer edges to simulate the "breathing room" of a physical page.
- **Grid:** Use a flexible 8-column grid within the page boundaries. 
- **Spacing Rhythm:** Based on a 4px baseline, with most claymorphic components utilizing larger internal padding (20px+) to accommodate their "inflated" appearance.

## Elevation & Depth

Depth in this design system is achieved through two distinct methods:

1.  **Claymorphic Elements (Interactive):** Buttons and cards use a combination of two inner shadows (a light "highlight" shadow from the top-left and a dark "depth" shadow from the bottom-right) to create an extruded, squishy appearance. An external, soft ambient shadow (15% opacity of the accent color) drops onto the paper surface.
2.  **Skeuomorphic Overlays (Static):** Paper edges feature a very thin 1px stroke (ink-grey at 10% opacity) and a crisp 2px drop shadow to separate "stacked" sheets.
3.  **Z-Axis Hierarchy:**
    *   **Level 0:** The desk background (wood or solid pastel).
    *   **Level 1:** The primary A4 paper sheet.
    *   **Level 2:** Taped notes, stickers, and clay buttons.
    *   **Level 3:** Tooltips and modals (maximum "puffer" effect).

## Shapes

The shape language is dominated by high-radius curves. 
- **Primary Containers:** Use `rounded-lg` (1rem) for paper sheets and large sections.
- **Interactive Elements:** Buttons and input fields use `rounded-xl` (1.5rem) or full pill-shapes to enhance the "squishy" clay look. 
- **Accents:** Decorative "washi tape" elements use irregular, jagged edges to contrast with the perfect smoothness of the claymorphic UI.
- **Icons:** Must be thick-stroked with rounded ends (3px minimum stroke width).

## Components

### Buttons
Buttons must appear "touchable." Use a thick 3D base. On hover, the button should appear to compress (reduce shadow depth). Use Dusty Rose for primary actions and Lavender for secondary.

### Cards & Paper Sections
Cards should resemble individual slips of paper or soft plastic trays. Incorporate a subtle "paper grain" overlay on Cream Paper surfaces. Use Mint Green for headers within cards to provide a fresh organizational feel.

### Input Fields
Inputs are recessed into the "clay" surface using a soft inner shadow, rather than a traditional border. The cursor and focus state should use the Dusty Rose color.

### Stationery Accents
- **Binder Rings:** Silver or Gold metallic gradients, placed in the center gutter.
- **Stickers:** Small illustrative cats, bears, and hearts (flat colors with white offsets) used to highlight completed tasks.
- **Washi Tape:** Semi-transparent colored rectangles used as backgrounds for section titles, appearing to "hold" elements onto the page.

### Lists & Checkboxes
Checkboxes are styled as "puffy" circles. When checked, a stylized "hand-drawn" checkmark or a cute icon (like a paw print) should appear.
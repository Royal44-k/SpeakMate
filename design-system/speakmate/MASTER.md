# SpeakMate Dialogue Stage Design System

3.0 implementation target, not a claim that the current production UI already implements these rules. Retain the approved visual direction; navigation destinations are integrated before the five-tab switch.

## Direction

Adult-first, editorial and immersive. Every practice screen should feel like entering a small dialogue stage rather than opening a dashboard. Spend visual boldness on the live English line and speech control; keep surrounding controls quiet.

## Tokens

- Atlantic 950 `#0B2A43`: immersive surfaces and app background.
- Atlantic 800 `#123B5D`: navigation, primary information and brand field.
- Sky 100 `#DDEFFD`: calm supporting panels.
- Coral 500 `#FF6B5E`: speech action and one primary CTA per view.
- Ink 950 `#14202B`: body text on light surfaces.
- Paper `#FFFDF8`: warm app canvas.
- Display: Barlow Condensed 700/800 for large English lines and editorial headings.
- Body: system sans stack optimized for Chinese and Latin UI copy.
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40.
- Radius: 10, 16, 24 and pill.
- Motion: subtle 160–240 ms state transitions; disable non-essential motion under reduced-motion.

## Mobile rules

- Center content at a maximum width of 480 px.
- Verify 320–430 px phone widths, landscape, 200% text and larger viewports; keep the 480 px content cap at every route.
- Respect top and bottom safe areas and keep persistent controls above them.
- Use at least 44 × 44 px touch targets with visible focus states.
- Five top-level tabs in order: 目标, 练习, 场景, 记录簿, 我的. Activate together only after their destinations are functional; do not expose placeholder tabs.
- Keep labels visible. At enlarged text sizes, allow labels and bar height to grow and reserve matching content clearance plus the safe area once.
- No emoji icons, decorative CSS drawings or placeholder imagery.

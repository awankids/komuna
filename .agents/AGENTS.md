<!-- BEGIN:ui-ux-design-rules -->
# UI/UX Design Rules

These rules define the visual and interaction design preferences for all projects.
Apply them to every UI/UX decision — layout, typography, spacing, components — unless
the user explicitly overrides a specific rule in a specific prompt.

## Philosophy
This is a utility-first, daily-use product (dashboard/tools/app for real operational
use), not a marketing landing page. Prioritize calm, predictable, scannable interfaces
over "wow factor." Do not default to generic AI-generated SaaS-landing-page aesthetics
(oversized bold hero, dramatic gradients, huge headlines) unless explicitly asked for
a marketing/landing page.

## DO
- Use generous whitespace and calm, disciplined layouts to reduce cognitive load.
- Use a small, restrained hero section (or none) for internal tools, dashboards, and
  app screens. Reserve large hero treatment only for public marketing/landing pages.
- Use a proportional, readable type scale: body text 14–16px minimum on web, clear
  visual hierarchy through weight/size contrast — not through making everything huge.
- Default to normal/medium font weight for body copy; reserve bold only for genuine
  emphasis (labels, key numbers, primary actions).
- Use token-based design values (spacing scale, color tokens, radius scale, motion
  timing) defined centrally (e.g. Tailwind config / CSS variables) instead of
  one-off magic numbers.
- Use motion only to communicate state, feedback, or system intent (loading, success,
  error, transition) — never purely decorative animation.
- Prioritize accessibility as baseline: sufficient contrast, keyboard navigation,
  readable font sizes, reduced-motion support. This is non-negotiable, especially
  since end users may have low digital literacy (e.g. posyandu cadres, elderly users).
- Use bento-grid / structured card layouts for dashboards to organize dense information
  clearly, instead of one dominant oversized block.
- Keep dark mode and light mode both usable, using the same token system.
- Match brand palette per project (e.g. teal/blue for SIMPUL SEHAT, rose/cream for
  Fixatif) rather than defaulting to generic purple/indigo SaaS gradients.

## DON'T
- Don't generate large, bold, dramatic hero sections by default for internal
  tools/dashboards/operational apps.
- Don't default to oversized, heavy-bold headline typography as the primary way to
  create visual hierarchy.
- Don't use decorative animation, parallax, or flashy micro-interactions that don't
  serve a functional purpose.
- Don't sacrifice text readability for a "minimal" look — small/thin/low-contrast
  text is not the same as clean design.
- Don't introduce one-off spacing, color, or radius values outside the defined
  design tokens.
- Don't default to generic AI-startup-landing-page visual patterns (giant gradient
  hero, oversized rounded buttons, stock illustration hero graphics) unless the task
  is specifically a marketing/landing page.
- Don't add glassmorphism, 3D, or heavy visual effects purely for trend's sake on
  tools meant for daily operational use.
<!-- END:ui-ux-design-rules -->

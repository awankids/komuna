# Glassmorphism Theme (Ringkasan)

## Theme Identity

-   **Style:** Modern, Premium, Elegant
-   **Mood:** Clean, Luxury, Futuristic

## Color Palette

-   Primary: `#2563EB`
-   Secondary: `#8B5CF6`
-   Accent: `#06B6D4`
-   Background: `#F5F7FB`
-   Dark: `#0F172A`
-   Surface: `rgba(255,255,255,.25)`
-   Border: `rgba(255,255,255,.30)`

## Background

-   Solid
-   Gradient
-   Mesh Gradient
-   Aurora
-   Blob
-   Noise Overlay

## Glass Effect

-   Blur: 4--32px
-   Transparency: 10--60%
-   Border: None / 1px / 2px
-   Border Radius: None → Full
-   Shadow: Soft / Medium / Large / Glow

## Components

-   Card: Solid, Glass, Outline, Elevated
-   Button: Solid, Glass, Ghost, Outline, Gradient
-   Input: Filled, Outline, Glass, Minimal
-   Navbar: Transparent, Glass, Solid
-   Sidebar: Glass, Floating, Collapsed

## Typography

-   Fonts: Inter, Geist, Plus Jakarta Sans, Poppins, Manrope
-   Weight: 400--700

## Icons

-   Lucide
-   Heroicons
-   Tabler
-   Phosphor

## Animation

-   None
-   Fade
-   Slide
-   Float
-   Glow
-   Shimmer

## Layout

-   Compact
-   Comfortable
-   Spacious

## Dark Mode

-   Light
-   Dark
-   System

## Presets

-   Frost
-   Crystal
-   Liquid
-   Ice
-   Aurora

## JSON Theme Schema

``` json
{
  "theme": "glassmorphism",
  "background": "gradient",
  "blur": 20,
  "opacity": 0.25,
  "radius": "2xl",
  "shadow": "xl",
  "border": "white-20",
  "font": "Inter",
  "button": "glass",
  "navbar": "glass",
  "sidebar": "floating",
  "animation": "fade",
  "density": "comfortable",
  "mode": "light"
}
```

## Best Practice

Simpan **design token** (radius, shadow, blur, opacity, surface,
density) di database, lalu petakan ke class Tailwind. Pendekatan ini
memudahkan pembuatan banyak tema tanpa mengubah komponen aplikasi.

---
version: alpha
name: Meta
description: Photography-first. Binary light/dark. Meta-Blue CTAs.
colors:
  primary: "#1C2B33"
  secondary: "#606770"
  tertiary: "#0866FF"
  neutral: "#F0F2F5"
  surface: "#FFFFFF"
  on-primary: "#FFFFFF"
typography:
  display:
    fontFamily: Inter
    fontSize: 4.75rem
    fontWeight: 700
    letterSpacing: "-0.03em"
  h1:
    fontFamily: Inter
    fontSize: 2.3rem
    fontWeight: 600
  body:
    fontFamily: Inter
    fontSize: 0.96rem
    lineHeight: 1.55
  label:
    fontFamily: Inter
    fontSize: 0.78rem
    fontWeight: 600
    letterSpacing: "0"
rounded:
  sm: 6px
  md: 8px
  lg: 14px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 24px
---
## Overview

Meta: photography-first retail store, binary light/dark surfaces, saturated Meta-blue CTAs.

## Colors

The palette is built around high-contrast neutrals and a single accent that drives interaction.

- **Primary (`#1C2B33`):** Headlines and core text.
- **Secondary (`#606770`):** Borders, captions, and metadata.
- **Tertiary (`#0866FF`):** The sole driver for interaction. Reserve it.
- **Neutral (`#F0F2F5`):** The page foundation.

## Typography

- **display:** Inter 4.75rem
- **h1:** Inter 2.3rem
- **body:** Inter 0.96rem
- **label:** Inter 0.78rem

## Do's and Don'ts

- **Do** use Tertiary for exactly one action per screen.
- **Do** let Neutral carry the composition — negative space is a feature.
- **Don't** introduce gradients. This system is flat on purpose.
- **Don't** mix Tertiary with alternate accents; the single-accent rule is load-bearing.

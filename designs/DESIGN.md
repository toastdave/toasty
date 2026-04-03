# Design System Documentation

## 1. Overview & Creative North Star: "The Ethereal Concierge"

This design system is built to transcend the "template" aesthetic of modern SaaS. While inspired by the efficiency and cleanliness of world-class hospitality platforms, our direction moves toward **The Ethereal Concierge**—a digital environment that feels less like a tool and more like a high-end physical space.

We achieve this through **Organic Asymmetry** and **Atmospheric Depth**. By utilizing extreme whitespace (Scale 12 and 16) and "zero-gravity" layering, we create a sense of calm and premium exclusivity. We break the rigid grid by allowing liquid gradients to bleed behind data points and using typography scales that favor editorial impact over dense information packing.

---

## 2. Colors & Surface Philosophy

The palette is anchored in high-contrast sophistication. We use the warmth of `surface` (#FAF9F6) to prevent the "clinical" feel of pure white, while `on_surface` (#1A1A1A) provides an inky, authoritative weight.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Structural boundaries must be defined exclusively through:
- **Tonal Shifts:** Moving from `surface` to `surface_container_low`.
- **Negative Space:** Using the Spacing Scale (Scale 8+) to let content breathe.
- **Soft Shadows:** Using ambient light to define edges.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested, physical layers. 
- **Base Layer:** `surface` (#FAF9F6).
- **Secondary Sections:** `surface_container_low` (#F4F3F1).
- **Floating Cards:** `surface_container_lowest` (#FFFFFF) to create a "lifted" effect.
- **In-Page Nav/Search:** `surface_bright` (#FAF9F6) with a backdrop blur.

### Signature Textures & Gradients
To provide "visual soul," use **Liquid Gradients**. A subtle transition from `primary` (#B52330) to `primary_container` (#FF5A5F) should be applied to primary CTAs. For data visualization background accents, use soft glows of `secondary` (#006A62) at 10% opacity to highlight key insights.

---

## 3. Typography: Editorial Authority

We pair the geometric precision of **Inter** with the expressive character of **Plus Jakarta Sans**.

- **Display & Headlines:** Use `plusJakartaSans`. This is our editorial voice. It should feel intentional and spacious.
- **Body & Labels:** Use `inter`. For `label-md` and `label-sm`, apply a generous tracking (+0.05rem to +0.1rem). Small text must never feel "cramped"; it should feel like a caption in a high-end gallery.

| Role | Token | Font | Size | Note |
| :--- | :--- | :--- | :--- | :--- |
| Hero | `display-lg` | Plus Jakarta Sans | 3.5rem | Tight leading (1.1) |
| Section | `headline-md` | Plus Jakarta Sans | 1.75rem | Bold, authoritative |
| Primary Body | `body-lg` | Inter | 1rem | Standard reading weight |
| Small Labels | `label-sm` | Inter | 0.6875rem | Uppercase, wide tracking |

---

## 4. Elevation & Depth: Zero-Gravity

We convey hierarchy through **Tonal Layering** rather than structural lines.

### Ambient Shadows
When a floating effect is required (e.g., a primary modal or a hover state on a card), use "Extra-Diffused" shadows.
- **Blur:** 40px – 80px.
- **Opacity:** 4% – 8%.
- **Color:** Tinted with `on_surface` (#1A1A1A). Never use pure black shadows.

### The "Ghost Border" Fallback
If accessibility requirements demand a container boundary, use a **Ghost Border**. Apply the `outline_variant` token at 15% opacity. It should be felt, not seen.

### Glassmorphism
For elements that overlay "Liquid Gradients" or complex data, use semi-transparent surface colors with a `backdrop-filter: blur(20px)`. This ensures the UI feels integrated into the atmosphere rather than pasted on top.

---

## 5. Component Guidelines

### Buttons (The Tactile Interaction)
- **Primary:** `primary_container` (#FF5A5F) with a subtle vertical gradient. Radius: `full`.
- **Secondary:** Glassmorphic style. `surface_container_lowest` at 60% opacity with a `backdrop-blur`.
- **States:** On hover, increase the shadow diffusion rather than changing the color brightness.

### Cards & Lists
- **Rule:** Absolutely no divider lines. 
- **Separation:** Use `surface_container` (#EFEEEB) for the card body and `surface_container_lowest` (#FFFFFF) for the internal content areas. Use `spacing-6` (2rem) as the minimum padding.
- **Rounding:** Always use `xl` (3rem) for parent containers and `lg` (2rem) for internal elements.

### Data Visualization: The Radar & Slider
- **Radar Charts:** Use `secondary` (#006A62) and `tertiary` (#7E5700) with 0.5px line weights. Add a soft outer glow (`primary_fixed_dim`) to the data points to make them appear like "light sources."
- **Range Sliders:** The "thumb" should be a large, tactile white circle (`surface_container_lowest`) with an ambient shadow. The track should use `surface_container_highest` for the inactive state and a `primary` gradient for the active state.

### Input Fields
- **Interaction:** On focus, the container should not get a heavy border. Instead, use a soft `primary_fixed` glow and shift the background from `surface_container_low` to `surface_container_lowest`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use extreme whitespace to separate unrelated ideas. If you think there is enough space, add one more level from the spacing scale.
- **Do** use `surface` shifts to define "areas" of the app (e.g., a sidebar is `surface_container_low`, the main stage is `surface`).
- **Do** tilt your shadow colors toward the surface hue to create a natural, "warm" environment.

### Don’t:
- **Don't** use 1px dividers or high-contrast borders. It breaks the premium "liquid" flow.
- **Don't** use standard 4px or 8px border radii. This system lives in the `24px+` (lg/xl) realm.
- **Don't** crowd data visualization. A chart should have as much "breathing room" as a headline.
- **Don't** use pure black (#000000). Always use `on_surface` (#1A1A1A) for text to maintain the "inky" premium feel.
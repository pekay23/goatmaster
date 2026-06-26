# 06 · Motion

Goat Master uses motion to make the app feel tactile without ever getting in the way. The principles are: **short, calm, intentional**.

## Default timings

| Interaction        | Duration | Easing                                |
| ------------------ | -------- | ------------------------------------- |
| Hover / press      | 150 ms   | `ease`                                 |
| Color / bg shift   | 200 ms   | `ease`                                 |
| Tab content change | 250 ms   | `ease-out` (`fadeSlideUp`)             |
| Toast in           | 300 ms   | `ease-out` (`slideDown`)               |
| Toast out          | 300 ms   | `ease-in`                              |
| Card lift          | 200 ms   | `ease`                                 |
| Modal scale-in     | 200 ms   | `ease-out` (`scaleIn`)                 |
| Splash fade-out    | 600 ms   | `cubic-bezier(0.4, 0, 0.2, 1)`         |
| Splash brand reveal| 600 ms   | `ease-out` (`fadeInUp`), staggered 200 ms |

## Keyframes (defined in `app/globals.css`)

| Name             | Use                                              |
| ---------------- | ------------------------------------------------ |
| `logoEntrance`   | Splash logo pop with overshoot                   |
| `fadeInUp`       | Element +20 px → 0 + opacity 0 → 1              |
| `fadeIn`         | Opacity 0 → 1                                    |
| `shimmerEffect`  | Splash logo highlight pass                       |
| `loadProgress`   | Splash loader bar (0 → 40 → 45 → 100 %)          |
| `fadeOut`        | Opacity 1 → 0; visibility hidden                 |
| `slowZoom`       | Hero / marketing bg subtle 1.0 → 1.05 zoom       |
| `slideUpFade`    | Generic slide-up                                 |
| `scaleIn`        | Modal / dialog pop-in                            |
| `slideDown`      | Toast slide from -12 px                          |
| `shimmer`        | Skeleton placeholder shimmer                     |
| `fadeSlideUp`    | Tab content change (8 px slide)                  |
| `spin`           | 1 s linear — used by `Loader2` icons             |

## Transitions on theme switch

The whole UI gets a 200 ms `background-color`, `border-color`, and `color` transition when the user toggles light ↔ dark. Set with the global:

```css
* { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease; }
```

This is **deliberately opt-out per element** with a specific override when an animation should not retrigger on theme change (e.g. skeletons).

## Accessibility

- All non-decorative animations are short (< 600 ms) so they don't trip `prefers-reduced-motion` (we don't yet have a media query, but every motion is under 1 s).
- Modals use `animation: scaleIn 0.2s` — instant for screen readers.
- No `infinite` animations on UI elements. Only the splash shimmer is infinite, and only for 2 s (decorative).

## Forbidden

- ❌ `animation: ... 2s infinite` on functional UI.
- ❌ `transition: all` — animate only the property that changed.
- ❌ Bouncy easings (`cubic-bezier(0.34, 1.56, 0.64, 1)`) outside the splash logo.
- ❌ Auto-playing audio / video on the splash.

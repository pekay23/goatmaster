# 🐐 Goat Master — Portfolio Summary

> Copy-paste this into your portfolio CMS / case study.

---

**PROJECT:** Goat Master

**INDUSTRY:** Agriculture & AgriTech (smart farming / livestock management)

**WHAT IT DOES:** A mobile-first PWA that identifies individual goats from a photo and tracks the full life of a herd — profiles, health, breeding, and AI-powered scanning.

**THE PROBLEM:** Smallholder farmers and hobby shepherds can identify *breeds* in a photo, but they can't tell one goat from another in a herd of 30, can't keep reliable breeding records on paper, and lose track of vaccinations and kidding dates. Existing "farm software" is desktop-first, expensive, and built for industrial operations.

**WHAT YOU BUILT:**

- **Hybrid on-device + server-side recognition.** TensorFlow.js (MobileNetV3) runs in the browser for instant local matching against an IndexedDB cache; a FastAPI microservice (YOLOv8 detector + ResNet50 triplet-loss re-ID) verifies and handles cache misses. Vectors are stored in PostgreSQL with the `pgvector` extension and queried via cosine distance.
- **Mobile-first PWA shell.** Splash screen, glassmorphism, three breakpoints (mobile bottom-nav → tablet → desktop sidebar), light / dark / system theme. Designed like a native app but ships as a Next.js 16 + React 19 installable PWA.
- **Full herd management** — goat profiles (name, breed, sex, DOB, ear tag, photo), health log, breeding lineage with parent-child links, alerts, breeding-cycle maturation helper, per-herd reports.
- **Smart Scan auto-discovery** — point the camera at a herd, the system detects every goat, suggests a new profile for the ones it can't match, and lets the user accept / reject / merge in one pass.
- **Admin tools that improve the model** — "Train AI" runs triplet-loss fine-tuning on the entire dataset; "Merge duplicates" lets a human fix any wrong matches and feeds them back into the next training cycle.
- **Custom design system** with a two-layer CSS variable palette (`--pasture-*` brand + `--slate-*` UI neutrals), full light + dark mode, all values WCAG AA.
- **Production-grade ops** — JWT auth in httpOnly cookies, rate-limited login, parameterised SQL, owner-scoped queries, indexed image uploads via Cloudinary, ML service on Hugging Face Spaces, frontend on Vercel with Turbopack.

**THE RESULT:**

- Recognition round-trip under 400 ms p50 on a mid-range phone (local cache hit).
- Works offline thanks to the IndexedDB embedding cache — re-identification keeps working in a barn with no signal.
- Used daily by a small user base for real herd management (owner-managed pilot — no public metrics yet).
- 30+ goat breeds pre-loaded with origin, type, and traits.
- Single-developer ship: 700-line client component, ~12 API routes, one Python microservice.

**PERMISSION:** Yes — it's mine, open source, public. Live on Vercel.

**LINKS:**

- Live app: <https://goatmaster-tau.vercel.app>
- GitHub: <https://github.com/pekay23/goatmaster>
- Screenshots: see `public/splashscreen.png` and `public/icon-512.png` in the repo

---

## Tech stack (one-liner)

Next.js 16 (App Router) · React 19 · PostgreSQL + pgvector · TensorFlow.js · FastAPI + YOLOv8 + ResNet50 · Cloudinary · Vercel · Hugging Face Spaces · Bun

## Tags for the portfolio filter

`#ai` `#machine-learning` `#computer-vision` `#pwa` `#nextjs` `#react` `#postgres` `#full-stack` `#mobile-first` `#agtech` `#livestock` `#product-design`

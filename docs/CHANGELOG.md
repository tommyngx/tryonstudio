# CHANGELOG

## 2025-09-06

- 16:45: Added right-side AI Edit Panel (`src/components/edit/ai-edit-panel.tsx`) with collapsible design, preset prompts, custom prompt textarea (500 chars), real-time counter, strength slider (0.1–1.0), and response card.
- 16:45: Added vertical Thumbnail Gallery (`src/components/edit/thumbnail-gallery.tsx`) to display original try-on image and edit history as small thumbnails with selection and badges.
- 16:45: Implemented AI Response Card (`src/components/edit/ai-response-card.tsx`) to show prompt, strength, duration and model info with gradient style.
- 16:45: Integrated panel and gallery into Edit page (`src/app/edit/page.tsx`): added state management (`editHistory`, `selectedImageIndex`, `isAiPanelOpen`, `aiLastResponse`), auto-open panel after try-on, and full wiring.
- 16:45: Updated `ControlPanel` (`src/components/edit/control-panel.tsx`) to include an "AI Düzenle" button that opens the panel when a result exists.
- 16:45: Added API stub for AI editing at `src/app/api/nano-banana-edit/route.ts` returning simulated results and meta.
 - 16:56: Polished `AiEditPanel` to match provided design: gradient header icon, compact 2x2 quick actions, list-style preset items with emojis, disabled textarea when no image, percentage label for slider, Hafif/Güçlü labels, and sticky bottom action bar with primary gradient button.
 - 16:56: Refactored `ThumbnailGallery` to fixed 24-width sidebar equivalent (`w-24`) with "Geçmiş" header and list-style thumbnails (3:4 aspect), matching screenshot layout.
 - 16:59: Completely redesigned `AiEditPanel` to match exact UI from provided screenshot: gradient purple header background, colorful quick action cards with gradients, emoji-based preset list with gray backgrounds, custom slider styling with purple fill, and bottom action bar with "Send element" button.
 - 17:02: Removed "Send console errors" button from AI Edit Panel, simplified bottom action bar to show only the main "AI ile Düzenle" button at full width.
 - 17:03: Updated AI Edit Panel layout: changed button to purple-pink gradient, made preset prompts smaller (2x2 grid, 10px font), and made input area fixed at bottom to prevent page overflow.
 - 17:05: Removed AI Response Card (düzenleme detayları) from AI Edit Panel to simplify the interface - no more detail cards shown after editing.
 - 17:06: Fixed UI issues in AI Edit Panel: added safe area below button (pb-6) and fixed slider overflow issue where purple fill was appearing in front of the slider thumb by implementing proper z-index layering.
 - 17:07: Fixed TypeScript error in page.tsx by removing lastResponse prop from AiEditPanel component call (prop no longer exists after removing AI Response Card).
 - 17:08: Completely redesigned slider component with modern best practices: custom thumb with hover effects, purple gradient fill, percentage badge, visual indicators for Hafif/Güçlü labels, smooth animations, and improved accessibility.
 - 17:09: Complete AI Edit Panel optimization: fixed button positioning, compact layout (2-row textarea), single-column preset prompts, custom scrollbar, hover animations, modern button styling with lift effect, proper overflow handling, and responsive design improvements.

 - 18:30: Collapsible AI Edit Panel improvements: added right-edge toggle button to reopen panel when closed, persisted panel open state in localStorage, and introduced keyboard shortcuts (Esc to close, Ctrl/Cmd+E to toggle). Removed FAB to avoid overlay conflicts and white-space issues.

 - 18:38: Converted AI Edit Panel to absolute overlay (right:0, top:0) and added conditional right padding (`pr-[320px] md:pr-[380px]`) to the main content container to prevent overlap with the bottom control panel and gallery.

 - 18:52: Fixed double-inference bug in single garment flow by removing internal API call from `src/components/edit/clothing-panel.tsx` and delegating inference to parent `src/app/edit/page.tsx` only.
 - 18:52: Normalized `clothingType` (maps `single` → `kıyafet`) in `src/app/edit/page.tsx` and `src/app/api/nano-banana/route.ts` to prevent malformed prompts and improve model guidance.
 - 18:52: Added safe debug logging (base64 length metrics, flags) to `handleTryOnResult` and `nano-banana` API route for better observability without leaking image contents.

 - 18:59: Converted all try-on prompts to English and specialized by garment type: added separate prompts for upper-only, lower-only, dress, and retained multi-garment prompt. Normalized `clothingType` mapping (single→upper, dress aliases→dress) in `src/app/api/nano-banana/route.ts`.

 - 19:02: Edit flow policy updated in `src/app/edit/page.tsx`: AI Edit requests now ALWAYS use the ORIGINAL try-on output as the base image when sending to `/api/nano-banana-edit`. New results are appended to history with a new sequential item and auto-selected.

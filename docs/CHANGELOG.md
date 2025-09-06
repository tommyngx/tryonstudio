# CHANGELOG

## 2025-09-07

- 00:24: Strengthened try-on prompts to PRESERVE existing brand logos/prints/labels/embroidery exactly (position/scale/orientation/colors) and forbid hallucinating new graphics. Applied to upper/lower/dress/multi-garment prompts. File: `src/app/api/nano-banana/route.ts`.
- 00:16: When re-running try-on with the SAME selected model, the previous try-on result is now automatically appended to history before replacing it. A `lastModelKeyForTryOn` state tracks the model key (faceSwappedModel or selectedModel). Files: `src/app/edit/page.tsx`.
- 00:07: Self model pipeline fixed: when user selects "Kendiniz", the uploaded photo is now passed as a data URL to `onModelSelect`, and `EditPage.handleTryOnResult` detects data URLs to extract base64 without fetch. Also ensured bottom action button always shows "AI ile Dene" and does not depend on Face Swap in self mode. Files: `src/components/edit/clothing-panel.tsx`, `src/app/edit/page.tsx`.
- 00:03: Added "Kendiniz" option to gender dropdown in Clothing Panel and implemented a dedicated self section. Selecting "Kendiniz" now auto-enables Face Swap mode (keeps current model), shows quick actions to open Face Swap and upload photo, and guides the user to proceed with try-on. File: `src/components/edit/clothing-panel.tsx`.
- 00:00: Converted gender selection in Clothing Panel to a stylish dropdown (replacing the previous toggle buttons) while preserving the model grid and selection behavior. File: `src/components/edit/clothing-panel.tsx`. Added accessible `select` with Tailwind styling; `useEffect` continues to auto-select the default model per gender.

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
 
 - 18:30: Collapsible AI Edit Panel improvements: added right-edge toggle button to reopen panel when closed, persisted panel open state in localStorage, and introduced keyboard shortcuts (Esc to close, Ctrl/Cmd+E to toggle). Removed FAB to avoid overlay conflicts and white-space issues.

 - 18:38: Converted AI Edit Panel to absolute overlay (right:0, top:0) and added conditional right padding (`pr-[320px] md:pr-[380px]`) to the main content container to prevent overlap with the bottom control panel and gallery.

 - 18:52: Fixed double-inference bug in single garment flow by removing internal API call from `src/components/edit/clothing-panel.tsx` and delegating inference to parent `src/app/edit/page.tsx` only.
 - 18:52: Normalized `clothingType` (maps `single` → `kıyafet`) in `src/app/edit/page.tsx` and `src/app/api/nano-banana/route.ts` to prevent malformed prompts and improve model guidance.
 - 18:52: Added safe debug logging (base64 length metrics, flags) to `handleTryOnResult` and `nano-banana` API route for better observability without leaking image contents.

 - 18:59: Converted all try-on prompts to English and specialized by garment type: added separate prompts for upper-only, lower-only, dress, and retained multi-garment prompt. Normalized `clothingType` mapping (single→upper, dress aliases→dress) in `src/app/api/nano-banana/route.ts`.

 - 19:02: Edit flow policy updated in `src/app/edit/page.tsx`: AI Edit requests now ALWAYS use the ORIGINAL try-on output as the base image when sending to `/api/nano-banana-edit`. New results are appended to history with a new sequential item and auto-selected.

 - 19:15: Enabled Enter-to-submit in AI Edit Panel textarea (`src/components/edit/ai-edit-panel.tsx`). Shift+Enter inserts a newline; Enter triggers submit.

 - 19:22: Unified Download behavior. Bottom control panel Download button now uses the same logic as the header and downloads the currently selected image (history item if selected, otherwise original try-on). Also added blob fallback for non-data URLs to ensure downloads work reliably (`src/app/edit/page.tsx`, `src/components/edit/control-panel.tsx`).

 - 19:23: UI polish in Clothing Panel: moved the plus icon to the LEFT of the "Tek Parça Kıyafet Ekle" text and adjusted paddings/gaps for better fit on narrow widths (`src/components/edit/clothing-panel.tsx`).

 - 19:29: Refactored Try-On trigger flow. Removed per-item "AI ile Dene" button under uploaded items and introduced a fixed bottom-left main button in `ControlPanel` that becomes enabled when a try-on trigger is available (uploaded single item selected, or both upper+lower provided). Wiring done via `registerTryOnTrigger` from `ClothingPanel` → `EditPage` → `ControlPanel`. Files: `src/components/edit/clothing-panel.tsx`, `src/app/edit/page.tsx`, `src/components/edit/control-panel.tsx`.

 - 21:37: Successfully installed all project dependencies via npm install. Resolved npm cache permission issues and installed 463 packages with 0 vulnerabilities. All dependencies from package.json are now available including Next.js 14.2.32, React 18.3.1, TypeScript 5.9.2, and AI/ML libraries (@google/genai, @runwayml/sdk, replicate).

 - 21:40: Created `.env.local` and populated required environment variables with placeholders. Keys: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `GOOGLE_VISION_API_KEY`, `REPLICATE_API_TOKEN`, `RUNWAYML_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `OPENAI_API_KEY`, `STABILITY_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_STORAGE_BUCKET`, `MAX_FILE_SIZE`, `API_RATE_LIMIT`. Notes: `.env*.local` is git-ignored; fill real secrets locally and rotate keys if exposed.

 - 21:49: Added horizontal bottom history gallery for small screens and limited vertical gallery to md+ only. Implemented `HorizontalThumbnailGallery` (`src/components/edit/horizontal-thumbnail-gallery.tsx`) and integrated it in `src/app/edit/page.tsx` below `ModelViewer` (visible on `md:hidden`). Vertical `ThumbnailGallery` now wrapped with `hidden md:block`. Spacer for AI panel reservation is also limited to md+ (`hidden md:block`).

 - 21:56: Next.js config updated for v14 App Router best practices. Removed deprecated `experimental.appDir` and top-level `api` options, migrated `images.domains` to `images.remotePatterns`, kept `images.formats` and `compiler.removeConsole`. File: `next.config.js`. Note: Dev server restart may be required to clear warnings.

 - 21:58: Removed deprecated `@next/font` from dependencies in `package.json`. Project search shows no code importing `@next/font`, so codemod is unnecessary for now. Action required: reinstall packages and restart the dev server to clear the warning.

## [2025-01-06 22:29] - Face Swap Özelliği Tamamlandı

### Eklenen Özellikler
- **Face Swap API**: Google Nano Banana API kullanarak yüz değiştirme özelliği
- **Dual API Yapısı**: Face swap için ayrı endpoint, kıyafet deneme için mevcut Nano Banana API
- **Face Swap UI**: ClothingPanel'e face swap toggle ve fotoğraf yükleme alanı
- **Entegre Akış**: Face swap + kıyafet deneme kombinasyonu

### API Yapısı
- `/api/face-swap`: Özel face swap endpoint'i (Google Nano Banana)
- `/api/nano-banana`: Tüm kıyafet deneme promptları korundu
- Face swap ve try-on işlemleri ayrı API'ler üzerinden

### Teknik Detaylar
- Face swap prompt optimizasyonu
- Base64 görsel işleme
- Hata yönetimi ve kullanıcı geri bildirimi
- State yönetimi ve loading durumları

### UX Özellikleri
- Face swap modu toggle'ı
- Drag & drop fotoğraf yükleme
- Gerçek zamanlı önizleme
- Loading ve hata durumu göstergeleri

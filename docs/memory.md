# Memory - AI Edit Panel & Thumbnail Gallery

Tarih: 2025-09-06 16:45 (+03:00)

## Mimari Kararlar
- Sağ panel bağımsız bir bileşen olarak tasarlandı: `src/components/edit/ai-edit-panel.tsx`.
- AI yanıt özetleri ayrı bir kartla sunuluyor: `src/components/edit/ai-response-card.tsx`.
- Dikey thumbnail galeri bağımsız: `src/components/edit/thumbnail-gallery.tsx`.
- Tüm akışın state yönetimi `src/app/edit/page.tsx` içinde tutuluyor:
  - `editHistory: EditHistoryItem[]`
  - `selectedImageIndex: number` (-1 = orijinal try-on)
  - `isAiPanelOpen: boolean`
  - `aiLastResponse: AiResponseMeta | null`
- `ControlPanel` içine paneli açan buton eklendi.

### Tek Parça Akış Refaktörü (2025-09-06 18:52 +03:00)
- Tek parça kıyafet denemesinde çift inference sorunu giderildi.
- UI bileşeni `src/components/edit/clothing-panel.tsx` artık inference çağrısı yapmıyor; yalnızca ham base64 kıyafet görselini parent `src/app/edit/page.tsx`'e iletiyor.
- Tüm inference işlemleri tek merkezden (`handleTryOnResult`) yönetiliyor. Bu sayede veri rolü karışıklığı ve alakasız sonuçlar engellendi.
- `clothingType` normalizasyonu eklendi (UI'dan `single` gelirse `kıyafet` olarak kullanılır). API rotasında da aynı normalizasyon uygulanır.
- Güvenli debug logları eklendi: base64 uzunlukları ve bayraklar loglanır, içerik sızdırılmaz.

### Collapsible Panel Revizyonu (2025-09-06 18:38 +03:00)
- Sağ AI paneli, flex child yerine overlay olacak şekilde `absolute right-0 top-0` konumlandırıldı (`src/components/edit/ai-edit-panel.tsx`). Bu sayede kapalıyken layout'ta boşluk/şerit bırakmıyor.
- Panel açıkken içeriklerin kapanmaması için ana orta konteynerde koşullu sağ padding uygulandı: `pr-[320px] md:pr-[380px]` (`src/app/edit/page.tsx`). Padding değeri panel genişliği ile uyumludur.
- Ekstra sol kenar kapatma handle'ı kaldırıldı; kapatma için header'daki `X` butonu tek kaynak olarak kullanılıyor.

### Collapsible Panel (2025-09-06 18:30 +03:00)
- Panel kapalıyken sağ kenarda `Sparkles` ikonlu bir toggle butonu ile açılır (konum: `page.tsx`, orta konteyner `relative`).
- Panel açıkken panelin sol kenarında `ChevronRight` ikonlu bir collapse handle ile kapatılır (konum: `ai-edit-panel.tsx`, `motion.aside` `relative`).
- Klavye kısayolları: `Esc` (kapat), `Ctrl/Cmd + E` (aç/kapa), `page.tsx` içinde global `keydown` listener.
- Açık/kapalı durumu `localStorage('ai_panel_open')` ile kalıcı hale getirildi.
- FAB yaklaşımı, örtüşme/boşluk problemleri ve görsel karmaşayı artırdığı için kaldırıldı; kenar toggles ile UX sadeleştirildi.

## UI/UX İlkeleri
- Collapsible sağ panel (380px, min 320px). Try-on sonucu oluşursa otomatik açılır.
- Preset chips, özel prompt (500 karakter), canlı karakter sayacı, strength slider (0.1–1.0).
- Hızlı aksiyonlar: Aydınlat, Koyulaştır, Renklendir, Keskinleştir.
- Dikey thumbnail galeri: grup hover ile 24px → 80px genişler, orijinal mavi, history mor kenarlık.
- Non-destructive: Orijinal ve tüm versiyonlar saklanır; tıklama ile aktif görsel güncellenir.

## API
- Demo/stub uç: `src/app/api/nano-banana-edit/route.ts`.
- Body: `{ baseImage: string(base64), prompt: string, strength: number }`.
- Response: `{ success, data: { generatedImage: base64, meta: { prompt, strength, durationMs, model }}}`.
- Gerçek servis entegrasyonu bu uçta yapılacak; UI değişmez.

## Entegrasyon Noktaları
- `EditPage` try-on tamamlandığında: `setTryOnResult(image)` + `setIsAiPanelOpen(true)` + `setSelectedImageIndex(-1)`.
- `AiEditPanel.onSubmit` → API çağrısı → `editHistory.push()` → `selectedImageIndex = last` → `aiLastResponse = meta`.
- `ModelViewer.processedImage` her seçimde senkronize edilir (before/after/split korunur).

## Gelecek Geliştirmeler
- Undo/Redo ileri-geri butonları (seçili index üzerinden navigasyon).
- Gerçek AI düzenleme servisi, güvenli anahtar yönetimi.
- Export/Paylaşım entegrasyonları.
- E2E ve görsel regresyon testleri.

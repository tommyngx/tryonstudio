## [2025-09-07 21:36] - Edit Başlığı Markalama: "TryOn Studio"

### 🔤 Metin/Marka Güncellemesi
- Edit sayfasındaki başlık metni markaya uygun olacak şekilde güncellendi: "TryOnX Studio" → "TryOn Studio".

### 📁 Etkilenen Dosyalar
- Güncellendi: `src/i18n/en.json` (`common.studio_title`)
- Güncellendi: `src/i18n/tr.json` (`common.studio_title`)

### ✅ Beklenen Sonuç
- Edit sayfasında görünen stüdyo başlığı artık "TryOn Studio" olarak görüntülenir (TR/EN).

## [2025-09-07 21:22] - Combo Sekmesinde Hedef Bölge Gizlendi

### 🎯 UX Düzenlemesi
- Üst+Alt (combo) akışında “Hedef Bölge” seçeneği artık gösterilmiyor. Combo akışı zaten `upper + lower` olarak sabit çalıştığı için kullanıcı seçimi etkisizdi.
- Tek parça (single) akışında “Hedef Bölge” seçeneği görünmeye devam eder.
- "Fit" (normal/slim/oversize) seçeneği her iki akışta da görünür ve API'ye iletilir.

### 📁 Etkilenen Dosyalar
- Güncellendi: `src/components/edit/clothing-panel.tsx` (OptionsBlock koşullu render: hedef bölge sadece `activeTab==='single'` iken)

### ✅ Beklenen Sonuç
- Kullanıcıda kafa karışıklığı azalır; combo akışında etkisiz bir kontrol gösterilmez.

## [2025-09-07 17:17] - Try-On Sonrası AI Panel Otomatik Açılıyor

### 🔄 Davranış Değişikliği
- "Try with AI" (virtual try-on) işlemi başarıyla tamamlandığında sağdaki AI Düzenleme Paneli artık otomatik olarak açılır.
- Amaç: Kullanıcının deneme sonucu üzerinden hızlıca düzenlemeye devam edebilmesini sağlamak.

### 📁 Etkilenen Dosyalar
- Güncellendi: `src/app/edit/page.tsx` (`handleTryOnResult` içerisinde `setIsAiPanelOpen(true)`).

## [2025-09-07 17:07] - Clothing Panel: "Your Model" Yükleme UI Eklendi

### ✨ Yeni Özellik
- "Your Model" (self) sekmesi aktifken kullanıcı artık kendi model fotoğrafını panel içinden yükleyebilir, önizleyebilir, değiştirebilir veya kaldırabilir.
- Yüklenen fotoğraf `data URL` olarak `onModelSelect` ile `EditPage`'e aktarılır; `handleTryOnResult` zaten data URL'i desteklediği için try-on akışı sorunsuz çalışır.

### 🔧 Teknik Ayrıntılar
- `src/components/edit/clothing-panel.tsx`:
  - Yeni state/ref: `selfModelDataUrl`, `selfModelInputRef`.
  - Yeni handler: `handleSelfModelUpload(files)`; tip/boyut doğrulaması (JPEG/PNG/WEBP/GIF/BMP/HEIC/HEIF, <=10MB), base64 dönüşümü ve `onModelSelect(dataUrl)` çağrısı.
  - UI: self sekmesinde gizli input, yükleme kartı, önizleme, "Change" ve "Remove" aksiyonları.
  - Kalıcılık: `localStorage('self_model_data_url')` ile son yüklenen self model hatırlanır; self sekmesine geçince otomatik yüklenir.
- `src/i18n/en.json`: `clothing.model.*` altına self upload metinleri eklendi (`self_upload_title`, `self_upload_button`, `self_change_button`, `self_remove_button`, `self_preview_alt`, `self_selected_badge`, `self_hint`).

### ✅ Beklenen Sonuç
- Kullanıcılar kendi fotoğraflarını kolayca model olarak kullanabilir ve try-on deneyimini kişiselleştirebilir.

## [2025-09-07 16:55] - Uygulama Geneli i18n Tamamlandı (TR/EN)

### 🔤 Kapsam ve Durum
- Landing ve Edit akışının tamamındaki kullanıcıya görünen tüm metinler `t()` ile sözlüklerden okunacak şekilde i18n'e geçirildi.
- TR varsayılan dil, EN sözlüğü aynı anahtar yapısı ile dolduruldu. Dil değiştirici (TR/EN) header üzerinde hazır.

### 📁 Etkilenen/Yeni Dosyalar
- Güncellendi: `src/app/page.tsx` (Landing `home.*`)
- Güncellendi: `src/app/edit/page.tsx` (mevcut i18n kullanımı korunup genişletildi)
- Güncellendi: `src/components/conditional-header.tsx` (nav etiketleri + dil toggle)
- Güncellendi: `src/components/conditional-footer.tsx` (telif metni)
- Güncellendi: `src/components/clothing-selector.tsx`
- Güncellendi: `src/components/photo-upload.tsx`
- Güncellendi: `src/components/tryon-canvas.tsx`
- Güncellendi: `src/components/edit/clothing-panel.tsx`
- Güncellendi: `src/components/edit/control-panel.tsx`
- Güncellendi: `src/components/edit/ai-edit-panel.tsx`
- Güncellendi: `src/components/edit/ai-response-card.tsx`
- Güncellendi: `src/components/edit/thumbnail-gallery.tsx`
- Güncellendi: `src/components/edit/video-player.tsx`
- Güncellendi: `src/components/edit/model-viewer.tsx`
- Güncellendi: `src/i18n/tr.json`, `src/i18n/en.json` (home, header, footer, clothing, clothingSelector, controlPanel, aiEditPanel(+presets), aiResponseCard, thumbnail, videoPlayer, modelViewer, photoUpload, tryonCanvas)

### ✅ Notlar
- Interpolasyon: `{year}`, `{index}`, `{name}`, `{value}`, `{status}`, `{text}` gibi dinamik değerler destekleniyor.
- Anahtar bulunamadığında `t()` anahtar stringini döndürerek UI kırılmasını önler (geliştirme sırasında görünür uyarı etkisi yaratır).
- Debug/console log metinleri geliştirici amaçlı olup i18n kapsamı dışında bırakıldı; istenirse ayrıca İngilizceleştirilebilir.

## [2025-09-07 16:04] - Clothing Panel i18n'e geçirildi

### 🔤 Dönüşüm
- `src/components/edit/clothing-panel.tsx` içindeki tüm kullanıcıya görünen metinler `t()` ile sözlüklerden okunacak şekilde dönüştürüldü.
- Etkilenen metinler: başlıklar, tab etiketleri, yükleme alanı metinleri, format/hata mesajları, model seçim alanı, durum rozetleri ve alt kısımdaki "AI ile Dene" buton metni/tooltips.

### 📁 Etkilenen Dosyalar
- Güncellendi: `src/components/edit/clothing-panel.tsx`
- Güncellendi: `src/i18n/tr.json` (clothing bölümü eklendi)
- Güncellendi: `src/i18n/en.json` (clothing bölümü eklendi)

### ✅ Not
- Interpolasyon kullanımı: öğe sayısı gibi dinamik metinlerde `{count}` değişkeni desteklenir.

## [2025-09-07 15:56] - i18n Altyapısı: TR Kaynak Dil ve Edit Page Migrasyonu

### ✨ Yeni
- Hafif i18n iskeleti eklendi: JSON sözlükler (`tr.json`, `en.json`), `createTranslator(t)` yardımcı fonksiyonu, `I18nProvider` ve `useI18n()` hook.
- Varsayılan dil Türkçe olacak şekilde global provider entegre edildi (`src/components/providers.tsx`).
- `src/app/edit/page.tsx` içindeki görünen sabit metinler sözlüğe taşınarak `t()` ile kullanılacak hale getirildi (alert mesajları, buton etiketleri, başlıklar, tooltipler, video başlığı).

### 📁 Etkilenen/Yeni Dosyalar
- Yeni: `src/i18n/tr.json`, `src/i18n/en.json`, `src/i18n/index.ts`, `src/i18n/provider.tsx`, `src/i18n/useI18n.ts`, `src/i18n/types.ts`
- Güncellendi: `src/components/providers.tsx` (I18nProvider sarmalaması)
- Güncellendi: `src/app/edit/page.tsx` (UI metinleri `t()` ile)

### ✅ Notlar
- Anahtar bulunamadığında `t()` anahtarı döndürerek kırılmayı önler.
- Basit interpolasyon desteği: `{name}`, `{count}` vb. değişkenler şablonda yerini alır.
- TR tamamlandıktan sonra EN çevirileri aynı anahtar yapısı ile hızla doldurulabilir.

## [2025-09-07 13:47] - Üst Giyim Prompt Güçlendirildi

### 🎯 İyileştirme
- `nano-banana` try-on akışında ÜST GİYİM (upper) prompt’una, kıyafetin model üzerinde açıkça ve görünür şekilde değişmesini zorunlu kılan net bir talimat eklendi:
  - "Ensure the TOP garment is clearly and visibly changed on the model to MATCH the provided CLOTHING IMAGE (color, print/wordmarks, neckline, sleeves, silhouette, and fit must be recognizable at first glance)."

### 📁 Etkilenen Dosyalar
- `src/app/api/nano-banana/route.ts` (fonksiyon: `createUpperOnlyPrompt`)

### ✅ Beklenen Sonuç
- Özellikle düz/sade üst kıyafetlerde bile değişimin ilk bakışta fark edilir olması.

## [2025-09-07 13:50] - Try-On Sonuçları Geçmişe Ekleniyor ve Gösteriliyor

### 🔧 Davranış Değişikliği
- Başarılı `virtual try-on` sonucu artık hem ana görüntüleyicide gösteriliyor hem de `editHistory` listesine yeni bir öğe olarak ekleniyor ve otomatik seçiliyor.
- Böylece oluşturulan sonuçlar her zaman sağdaki dikey thumbnail galerisinde görünür ve kullanıcı geçmişte gezinip geri dönebilir.

### 📁 Etkilenen Dosyalar
- `src/app/edit/page.tsx` (fonksiyon: `handleTryOnResult` içinde başarılı yanıt işleme)

### 🧪 Notlar
- History öğesi `EditHistoryItem` yapısına uygun olarak meta ile birlikte eklenir; `model` alanı yoksa varsayılan `gemini-2.5-flash-image-preview` kullanılır.

## [2025-09-07 13:27] - Face Swap Özelliği Kaldırıldı

### 🔥 Değişiklikler
- UI: `src/components/edit/clothing-panel.tsx` içinden Face Swap toggle, kullanıcı fotoğrafı yükleme alanı, ilgili state ve callback'ler kaldırıldı.
- Edit Sayfası: `src/app/edit/page.tsx` içindeki `faceSwappedModel`, `userPhotoBase64`, `isFaceSwapping`, `handleFaceSwap`, `handleTryOnWithSwappedModel` ve tüm kullanım yerleri kaldırıldı. Akış sadece `selectedModel` ve `tryOnResult` ile sadeleştirildi.
- API: `src/app/api/face-swap/route.ts` ve `src/app/api/ai/face-swap/route.ts` artık `410 Gone` dönüyor (özellik devre dışı). `src/app/api/nano-banana/route.ts` içinde Face Swap ile ilgili `operationType==='faceswap'` dalı ve prompt kaldırıldı; bu tip istekler `410 Gone` ile reddediliyor.
- Lib: `src/lib/api.ts` içindeki `performFaceSwap` yardımcı fonksiyonu kaldırıldı. `src/lib/config.ts` içindeki `ai.replicate.models.faceSwap` ve `features.faceSwap` bayrakları temizlendi.

### ✨ Sonuçlar
- Kod tabanı sadeleşti ve bakım yükü azaldı.
- Try-on ve AI Edit akışları Face Swap bağımlılığı olmadan tutarlı çalışıyor.

# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

## [2025-01-07 12:55] - Try-On ve AI Düzenleme Paneli Ayrıştırıldı

### 🔧 Düzeltmeler
- **Bağımsız Try-On:** Sol panel try-on işlemi AI düzenleme geçmişinden ayrıştırıldı
- **Conflict Çözümü:** Try-on sonuçları artık AI düzenleme thumbnail'ları ile karışmıyor
- **Görsel Öncelik:** Try-on sonucu > Face swap > Orijinal model sıralaması
- **Panel Kontrolü:** Try-on sonrası AI paneli otomatik açılmıyor

### 📝 Yapılan İyileştirmeler
- `tryOnResult` state'i bağımsız çalışıyor
- Try-on sonuçları `editHistory`'ye eklenmek yerine ayrı tutuluyor
- Görsel seçim mantığı try-on öncelikli olarak güncellendi
- İndirme fonksiyonu try-on sonuçlarını destekliyor

## [2025-01-07 12:53] - API Response Debug Logging Eklendi

### 🔧 Düzeltmeler
- **Detaylı API Logging:** Google AI API response'unu adım adım izleme
- **Response Analizi:** Candidates, parts ve image data kontrolü
- **Hata Tespiti:** API'nin döndürdüğü veri yapısını detaylı loglama
- **Görsel Data Kontrolü:** Base64 image data'nın varlığı ve boyutu kontrolü

### 📝 Yapılan İyileştirmeler
- `nano-banana/route.ts`: Comprehensive response logging eklendi
- API response'unun her aşaması loglanıyor
- Image data bulunup bulunmadığı detaylı kontrol ediliyor
- Text response ve image data ayrı ayrı loglanıyor

## [2025-01-07 12:50] - Kıyafet Kategori Sistemi Sadeleştirildi

### Düzeltmeler
- **Kategori Seçici Kaldırıldı:** Gereksiz kıyafet kategori seçim UI'ı kaldırıldı
- **Varsayılan Kategori:** `clothingCategory` field'ı interface'den çıkarıldı
- **Hedef Bölge Tasarımı:** Kullanıcı dostu buton tabanlı seçim sistemi eklendi
- **Kesim Stili UI:** Modern kart tasarımı ile görsel iyileştirme

### Yapılan İyileştirmeler
- `UploadedClothing` interface sadeleştirildi
- Hedef bölge seçimi: Emoji ikonlu buton grid (👔 Üst, 👖 Alt, 👗 Elbise)
- Kesim stili seçimi: Açıklamalı buton grid (Normal, Slim, Oversize)
- Gereksiz kategori değiştirme mantığı temizlendi

## [2025-01-07 12:47] - Google Vision API Quota Aşımı Sorunu Çözüldü

### Tespit Edilen Gerçek Sorun
- **API Quota:** Google Vision API günlük kullanım kotası aşıldı (429 Too Many Requests)
- **Hata Kodu:** `GoogleGenerativeAIFetchError: Resource has been exhausted (e.g. check quota)`

### Düzeltmeler
- **Quota Hatası Yakalama:** 429 status code için özel hata mesajı eklendi
- **Kullanıcı Bilgilendirme:** Quota aşımı durumunda açıklayıcı çözüm önerileri
- **Debug Logging:** Try-on işlemlerinde detaylı hata yakalama ve logging eklendi

### Yapılan İyileştirmeler
- `nano-banana/route.ts`: Quota aşımı için özel error handling
- `EditPage`: Quota hatası için kullanıcı dostu uyarı mesajı
- Hata mesajlarında çözüm önerileri (quota artırma, bekleme, farklı key)

## [2025-01-07 12:40] - AI ile Dene Butonu Hata Düzeltmeleri

### Düzeltmeler
- **Kritik:** "AI ile Dene" butonunun çalışmaması sorunu araştırıldı ve çözüldü
- **API Key:** `.env.example` dosyası oluşturuldu - `GOOGLE_VISION_API_KEY` eksikliği tespit edildi
- **Hata Yönetimi:** Try-on işlemlerinde detaylı hata yakalama ve logging eklendi
- **Debug:** Clothing panel ve edit sayfasında kapsamlı debug logları eklendi

### Tespit Edilen Ana Sorunlar
1. **Environment Variables:** `.env.local` dosyası eksik - Google Vision API key bulunamıyor
2. **Hata Mesajları:** API çağrısı başarısız olduğunda kullanıcıya net bilgi verilmiyordu
3. **Debug Eksikliği:** Try-on akışında hangi aşamada hata oluştuğu belirsizdi

### Yapılan İyileştirmeler
- `ClothingPanel`: Try-on başlatma ve callback çağrısı için detaylı loglar
- `EditPage`: API çağrısı öncesi/sonrası durum kontrolü ve hata yakalama
- `.env.example`: Gerekli environment variables için şablon dosya
- Hata mesajlarında daha açıklayıcı bilgiler

### Kullanıcı Aksiyonları Gerekli
1. `.env.local` dosyası oluşturun ve `GOOGLE_VISION_API_KEY` ekleyin
2. Google Vision API key'inizi Google Cloud Console'dan alın
3. Uygulamayı yeniden başlatın

## 2025-09-07

- 12:24: Tekrar yükleme (aynı dosyayı seçince yüklenmeme) hatası düzeltildi. Gizli `input[type="file"]` değerleri yükleme SONRASI ve tıklama ÖNCESİ sıfırlanıyor; kullanıcı fotoğrafı ve kıyafet görselleri kaldırıldığında veya değiştirildiğinde `URL.revokeObjectURL(...)` ile blob URL'leri serbest bırakılıyor. Dosya: `src/components/edit/clothing-panel.tsx`.
- 12:03: UI düzeni iyileştirildi: Yükleme alanı üstte, "Hedef Bölge/Kesim/Üstü zorla değiştir" kontrolleri alta taşındı. Kullanıcı akışı sadeleşti ve rakip düzenine uygun hale getirildi. Dosya: `src/components/edit/clothing-panel.tsx`.
- 12:00: Try-on seçenekleri eklendi: `region (upper/lower/dress)`, `fit (normal/slim/oversize)`, `forceReplaceUpper`. Bu seçenekler `ClothingPanel` → `EditPage` → `API` akışında iletiliyor ve promptlara ek direktif olarak yansıtılıyor. Dosyalar: `clothing-panel.tsx`, `app/edit/page.tsx`, `app/api/nano-banana/route.ts`.

- 11:38: **KULLANICI DENEYİMİ İYİLEŞTİRMESİ**: Kıyafet kategorisi seçici UI eklendi. Kullanıcılar yüklenen kıyafetlerin kategorisini (Üst Giyim/Alt Giyim/Elbise) manuel olarak değiştirebilir. Dropdown menü ile kolay kategori seçimi, emoji ikonları ve görsel geri bildirim. `UploadedClothing` interface'ine `clothingCategory` alanı eklendi. Dosya: `src/components/edit/clothing-panel.tsx`.
- 11:34: **KRİTİK DÜZELTME**: Kıyafetlerin modele düzgün yansımaması sorunu çözüldü. Alt giyim prompt'unda "UPPER GARMENT" yerine "LOWER GARMENT" kullanılacak şekilde düzeltildi. Tek parça kıyafetler için 'single' tipi 'dress' olarak normalize edildi. Çoklu kıyafet akışında ana kıyafet 'upper', ek kıyafet 'lower' olarak sabitlendi. Dosyalar: `src/app/api/nano-banana/route.ts`, `src/components/edit/clothing-panel.tsx`.
- 09:45: Tek parça (upper) prompt güçlendirildi: CLOTHING IMAGE'ı birebir uygulanacak üst parça olarak vurgulandı; yaka/sleeve/silhouette/fit eşleşmesi ve tipografik logo/print koruma talimatları netleştirildi. İçerik sonundaki açıklama mesajı normalize İngilizce garment etiketi ile güncellendi. Dosya: `src/app/api/nano-banana/route.ts`.
- 01:17: ModelViewer içinde "AI Sonucu" yazılı overlay etiketi kaldırıldı; görsel üzerinde gereksiz metin kalabalığı azaltıldı. Dosya: `src/components/edit/model-viewer.tsx`.
- 01:10: Pan alanı genişletildi: Görsel oluşturma alanı artık tam alan üzerinde (inset-0) etkileşimli; önceki çerçeve (inset-4) kısıtı kaldırıldı. Header'a zoom butonlarının yanına Reset (100%) eklendi. `ModelViewer`'a `resetSignal` prop'u ve çift tık ile reset davranışı eklendi. Dosyalar: `src/components/edit/model-viewer.tsx`, `src/app/edit/page.tsx`.
- 01:00: Model görüntüleyicide sorunsuz zoom & pan etkileşimi eklendi. Mouse wheel/trackpad pinch ile zoom (ctrl/cmd destekli), mouse sürükleme ve tek parmak touch ile pan, ok tuşları ile pan; +/− ile zoom; R ile reset eklendi. Transformlar tek bir wrapper üzerinde `translate + scale` ile uygulanıyor. `onZoomChange` prop'u ile üstteki zoom kontrolleriyle tam senkron çalışır. Dosyalar: `src/components/edit/model-viewer.tsx`, `src/app/edit/page.tsx`.
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

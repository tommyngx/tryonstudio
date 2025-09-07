# Memory - Clothing Panel i18n (2025-09-07 16:04 +03:00)
- `src/components/edit/clothing-panel.tsx` i18n'e geçirildi. Tüm kullanıcıya görünen metinler sözlüğe taşındı; `useI18n().t()` ile çağrılıyor.
- TR ve EN sözlüklerine `clothing` alanı eklendi (tabs, upload alanı, hata mesajları, model seçim, durum rozetleri, buton metinleri).
- Amaç: Metinleri merkezileştirmek ve EN adaptasyonunu hızlandırmak; komponentleri metinden bağımsızlaştırmak.

## Memory - Combo Akışında Hedef Bölge Gizleme (2025-09-07 21:22 +03:00)
- Karar: Üst+Alt (combo) akışında “Hedef Bölge” kontrolü gizlendi. Çünkü combo prompt’u zaten `upper + lower` sabit kombinasyonu ile çalışıyor; kullanıcı seçimi etkisizdi.
- Single akışında “Hedef Bölge” kontrolü görünmeye devam eder.
- "Fit" (normal/slim/oversize) seçeneği her iki akışta da görünür ve API'ye iletilir.
- Etkilenen dosya: `src/components/edit/clothing-panel.tsx` (OptionsBlock içinde `activeTab==='single'` koşulu ile bölge seçimi render edilir).

# Memory - i18n Altyapısı (2025-09-07 15:56 +03:00)
- Hafif i18n iskeleti kuruldu: `src/i18n/tr.json`, `src/i18n/en.json`, `src/i18n/index.ts` (createTranslator + interpolate), `src/i18n/provider.tsx` (Context + Provider), `src/i18n/useI18n.ts` (hook), `src/i18n/types.ts`.
- Global entegrasyon: `src/components/providers.tsx` içinde `I18nProvider` ile tüm uygulama sarmalandı (React Query üstünde çalışır durumda).
- İlk migrasyon: `src/app/edit/page.tsx` içindeki görünen sabit metinler sözlüğe taşındı ve `t()` ile kullanılacak hale getirildi. Alert mesajları, buton etiketleri, başlıklar, tooltip ve video başlığı kapsandı.
- Varsayılan dil: TR. Persist: `localStorage('lang')`. Anahtar bulunamazsa `t()` anahtarı döndürerek UI kırılmasını engeller.

# Memory - AI Edit Panel, Thumbnail Gallery
### Try-On Sonucunu Geçmişe Ekleme (2025-09-07 13:50 +03:00)
- Başarılı virtual try-on sonucu artık `editHistory` listesine ekleniyor ve otomatik seçiliyor; aynı zamanda ana görüntüleyicide gösteriliyor.
- Amaç: Üretilen sonucun her zaman sağdaki dikey thumbnail galeride görünmesi ve kullanıcıların geçmişte gezinerek karşılaştırabilmesi.
- Dosya: `src/app/edit/page.tsx` (fonksiyon: `handleTryOnResult` içinde başarılı yanıt işleme)

### Upper Prompt Güçlendirme (2025-09-07 13:47 +03:00)
- Üst giyim için kullanılan prompt netleştirildi: "Ensure the TOP garment is clearly and visibly changed on the model to MATCH the provided CLOTHING IMAGE (color, print/wordmarks, neckline, sleeves, silhouette, and fit must be recognizable at first glance)."
- Amaç: Özellikle düz renk veya düşük kontrastlı tasarımlarda bile model üzerindeki değişimin ilk bakışta anlaşılır olmasını sağlamak.
- Dosya: `src/app/api/nano-banana/route.ts` (fonksiyon: `createUpperOnlyPrompt`).


### Face Swap Kaldırma (2025-09-07 13:27 +03:00)
- Face Swap özelliği projeden çıkarıldı. UI (Clothing Panel), Edit sayfası state/akış, API uçları ve config/helper referansları temizlendi.
- `src/app/api/face-swap/route.ts` ve `src/app/api/ai/face-swap/route.ts` artık 410 Gone döner.
- `src/app/api/nano-banana/route.ts` içinde Face Swap ile ilgili parametre ve dallar kaldırıldı; bu parametreler gelirse 410 döner.
- Self (Kendiniz) modu aynen devam ediyor: Kullanıcı fotoğrafı doğrudan model olarak seçilir, Face Swap yok.
### ModelViewer Safe Area Clamp (2025-09-07 09:41 +03:00)
- Pan/zoom artık güvenli alan ile sınırlandırılıyor: Container boyutu + görselin doğal (intrinsic) boyutları ölçülüyor, object-contain baz boyut hesaplanıyor (scale=1), ardından ölçek sonrası boyutlara göre pan clamp uygulanıyor.
- Translate ve scale ayrı katmanlarda: Dış katman `translate3d(panX, panY, 0)`; iç katman `transform: translate(-50%, -50%) scale(s)` ve `width/height = baseW/baseH`.
- Ölçüm: `ResizeObserver` ile container ölçümleri, `window.Image()` ile naturalWidth/Height alımı. Safe margin: min(containerW, containerH) * 0.08.
- Zoom değişiminde mevcut pan, yeni sınırlara göre otomatik yeniden clamp'lenir. Wheel/mouse/touch/keyboard pan akışları aynı clamp fonksiyonunu kullanır.
### ModelViewer Etkileşimleri (2025-09-07 01:00 +03:00)
- ModelViewer'a sorunsuz zoom & pan eklendi.
- Zoom: Mouse wheel/trackpad pinch (ctrl/cmd) ile; klavye `+`/`-` ile. Min 25%, max 400%, step 10.
- Pan: Mouse sürükleme ve tek parmak touch hareketi ile (ok tuşları ile de pan mümkün).
- Reset: `R` ile pan ve zoom 0/100'e döner.
- Uygulama tek bir transform wrapper üzerinde `translate(x,y) + scale(s)` ile yapılır; Next `Image` bileşenleri `select-none` ve `draggable={false}`.
- Üst çubuktaki zoom kontrolü ile senkron için `onZoomChange` prop'u eklendi ve `EditPage` içinde `setZoomLevel` bağlandı.

### Kendiniz Akışı (2025-09-07 00:05 +03:00)
- "Kendiniz" seçeneği eklendi. Bu modda Face Swap YOK; kullanıcı fotoğrafı doğrudan model olarak kullanılır.
- Kullanıcı fotoğrafını yüklediğinde bu fotoğraf doğrudan model olarak seçilir (`onModelSelect(imageUrl)`).
- Alt akış (AI ile Dene) ve try-on mantığı değişmeden çalışır; seçilen model artık kullanıcının fotoğrafıdır.
- Dosya: `src/components/edit/clothing-panel.tsx` (self bölümü, gizli file input, `handleUserPhotoUpload` içinde auto-select).


Tarih: 2025-09-06 22:20 (+03:00)

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

### Face Swap Özelliği (2025-09-06 22:20 +03:00)
- **Face Swap API**: `src/app/api/face-swap/route.ts` - Easel Advanced Face Swap modeli kullanır
- **UI Entegrasyonu**: `ClothingPanel` bileşenine Face Swap toggle ve kullanıcı fotoğrafı yükleme alanı eklendi
- **Akış**: Kullanıcı fotoğrafı + manken model → Face swap → Virtual try-on
- **State Yönetimi**: 
  - `userPhotoBase64`: Kullanıcının yüklediği fotoğraf (base64)
  - `faceSwappedModel`: Face swap sonucu (data URL)
  - `isFaceSwapping`: Face swap işlem durumu
- **Entegrasyon**: Face swap sonucu varsa try-on işleminde swap'lenmiş model kullanılır
- **UX**: Toggle ile aktif/pasif, fotoğraf önizleme, loading durumları

## Gelecek Geliştirmeler
- Undo/Redo ileri-geri butonları (seçili index üzerinden navigasyon).
- Gerçek AI düzenleme servisi, güvenli anahtar yönetimi.
- Export/Paylaşım entegrasyonları.
- E2E ve görsel regresyon testleri.
- Face swap kalite ayarları ve yüz algılama hassasiyeti kontrolü.

### Clothing Panel Cinsiyet Dropdown Dönüşümü (2025-09-07 00:00 +03:00)
- Önceden `clothing-panel.tsx` içinde cinsiyet seçimi iki buton (👨 Erkek / 👩 Kadın) olarak sunuluyordu.
- Bu bölüm şık ve erişilebilir bir `select` dropdown ile değiştirildi. Dosya: `src/components/edit/clothing-panel.tsx`.
- State: `genderTab` aynı şekilde korunuyor; `useEffect` (`genderTab` bağımlı) `onModelSelect` ile varsayılan modeli (erkek/kadın) otomatik atamaya devam ediyor.
- UI Etkisi: Sadece üstteki seçim kontrolü değişti; altında yer alan "Model Grid" gösterimi ve seçim davranışı aynen korunuyor.

### Re-upload Hatası ve Blob URL Yönetimi (2025-09-07 12:24 +03:00)
- Sorun: Tek parça akışında aynı dosya yeniden seçildiğinde `onChange` tetiklenmiyor ve dosya yüklenmiyor gibi algılanıyordu. Kök neden: `input[type="file"]` değerinin yükleme sonrası sıfırlanmaması.
- Çözüm: `src/components/edit/clothing-panel.tsx` içinde gizli dosya inputu için iki taraflı reset eklendi:
  - Yükleme SONRASI `finally` içinde `fileInputRef.current.value = ''`
  - Tıklama ÖNCESİ `onClick` handler'larında `fileInputRef.current.value = ''`
- Ek: Kullanıcı fotoğrafı ve üst/alt giyim akışlarında önceki blob URL'leri `URL.revokeObjectURL(...)` ile kaldırma/değiştirme sırasında serbest bırakıldı. Böylece bellek sızıntıları önlendi.

### Self Model Yükleme UI (2025-09-07 17:07 +03:00)
- `src/components/edit/clothing-panel.tsx` içine, `genderTab==='self'` durumunda kullanıcıya model fotoğrafını yükleme/önizleme/değiştirme/kaldırma arayüzü eklendi.
- Teknik: Gizli dosya inputu (`selfModelInputRef`), `handleSelfModelUpload(files)` ile tip/boyut doğrulama (JPEG/PNG/WEBP/GIF/BMP/HEIC/HEIF, ≤10MB), base64 `data URL` üretimi ve `onModelSelect(dataUrl)` ile `EditPage`'e aktarım.
- Kalıcılık: `localStorage('self_model_data_url')` ile son yüklenen self model hatırlanır; self sekmesine geçildiğinde otomatik uygulanır.
- i18n: EN ve TR sözlüklerine `clothing.model.self_*` anahtarları eklendi (title, button, change/remove, preview_alt, selected_badge, hint).
- Amaç: Kullanıcının kendi fotoğrafını doğrudan model olarak seçip kişiselleştirilmiş try-on deneyimi yaşaması.

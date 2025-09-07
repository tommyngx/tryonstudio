# Development Checklist - AI Edit Panel & Thumbnail Gallery

- [x] Sağ panel: `AiEditPanel` bileşeni (collapsible, 380px, preset + custom prompt, counter, strength slider)
- [x] AI Yanıt Kartı: `AiResponseCard` (prompt, strength, süre, model)
- [x] Dikey Thumbnail Galerisi: `ThumbnailGallery` (orijinal + history, seçili göstergeleri)
- [x] EditPage entegrasyonu: state yönetimi (`editHistory`, `selectedImageIndex`, `isAiPanelOpen`, `aiLastResponse`)
- [x] Try-on sonrası panel otomatik açılır
- [x] ControlPanel: "AI Düzenle" butonu
- [x] API Stub: `src/app/api/nano-banana-edit/route.ts`
- [x] Tek parça akışında inference sadece `EditPage` üzerinden çağrılır (UI içinden çift çağrı yok)
- [x] `clothingType` normalizasyonu (single → kıyafet) ve prompt tutarlılığı
- [x] Güvenli debug logları (base64 uzunluk metrikleri, flag'ler) eklendi
- [x] Üst giyim (upper) prompt'u görünür değişim vurgusu ile güçlendirildi
- [x] Clothing Panel UX: Cinsiyet seçimi toggle butonlarından dropdown'a geçirildi (erişilebilir `select`, Tailwind stilleri)
- [x] Clothing Panel UX: Dropdown değişimi sonrası model grid ve otomatik model seçim davranışı korundu (useEffect ile)
- [x] Clothing Panel UX: Dropdown'a "Kendiniz" seçeneği eklendi; seçilince Face Swap otomatik açılır ve özel bilgilendirme bölümü görünür
// Face Swap kaldırıldı: Self modda kullanıcı fotoğrafı doğrudan model olarak kullanılır
- [x] Clothing Panel UX: Dropdown'a "Kendiniz" seçeneği eklendi; bu modda kullanıcı fotoğrafı doğrudan model olarak seçilir (Face Swap yok)
- [x] ModelViewer: Sorunsuz zoom & pan (wheel/pinch zoom, mouse/touch pan, klavye ok tuşları, +/- zoom, R reset)
- [x] Zoom senkronizasyonu: `onZoomChange` ile üstteki butonlarla tam uyum
- [x] ModelViewer: Pan/zoom safe area clamp (sonsuz kaydırma yok, container + intrinsic ölçüme dayalı)
- [x] Dokümantasyon güncellemesi: CHANGELOG ve memory kaydı eklendi
- [x] Try-on sonucu geçmişe eklenir ve otomatik seçilir; thumbnail galerisinde görünür
- [x] Tekrar yükleme hatası: Gizli `input[type="file"]` değerleri yükleme sonrası ve tıklama öncesi sıfırlanıyor (re-upload garanti)
- [x] Blob URL yönetimi: Kaldırma/değiştirme akışlarında `URL.revokeObjectURL(...)` ile nesne URL’leri serbest bırakılıyor
- [x] Clothing Panel: "Your Model" (self) sekmesinde kullanıcı model fotoğrafı yükleme/önizleme/değiştir/kaldır UI'si ve `onModelSelect` entegrasyonu
- [x] Edit sayfası başlığı markaya göre güncellendi: "TryOn Studio"
- [ ] Undo/Redo ileri-geri butonları (opsiyonel)
- [ ] Gerçek AI edit servisine entegrasyon (API key, güvenlik)
- [ ] İndirme/Paylaşma entegrasyonları (export options)
- [ ] E2E testler ve görsel regresyon testleri

## Özellik Değişiklikleri

- [x] Face Swap özelliği kaldırıldı (UI, API uçları 410 Gone, config ve helper temizliği)
- [x] Upper prompt güçlendirildi: "Ensure the TOP garment is clearly and visibly changed ..." direktifi eklendi (`createUpperOnlyPrompt`)
- [x] "Your Model" (self) yükleme özelliği: Panel içinden kullanıcı fotoğrafı yüklenir, `localStorage('self_model_data_url')` ile hatırlanır ve `EditPage`'e `data URL` olarak aktarılır
- [x] Combo akışında “Hedef Bölge” kontrolü gizlendi; Single akışında gösterilmeye devam eder. "Fit" seçeneği her iki akışta da görünür ve API'ye iletilir.

## UX - Collapsible Panel

- [x] Panel kapalıyken sağ kenarda toggle butonu (Sparkles) ile açma
- [x] Panel açıkken sol kenarda collapse handle (Chevron) ile kapatma
- [x] Klavye kısayolları: Esc (kapat), Ctrl/Cmd + E (aç/kapa)
- [x] Panel açık/kapalı durumu localStorage ile kalıcı

## i18n Rollout Checklist

- [x] i18n iskeleti oluşturuldu (`src/i18n/`): `tr.json`, `en.json`, `index.ts`, `provider.tsx`, `useI18n.ts`, `types.ts`
- [x] Global provider entegrasyonu (`src/components/providers.tsx` içinde `I18nProvider`)
- [x] `src/app/edit/page.tsx` sözlüğe geçirildi ve `t()` ile metinler kullanılıyor
- [x] `src/components/edit/clothing-panel.tsx` i18n’e geçirildi
- [x] `src/components/clothing-selector.tsx`, `src/components/conditional-footer.tsx` ve diğer UI bileşenleri i18n’e geçirildi
- [x] Dil seçici (TR/EN) minimal UI eklendi (varsayılan TR)
- [x] EN çevirileri tamamlandı ve toggle ile doğrulandı
- [ ] Smoke testler: kritik anahtarların render kontrolü (opsiyonel)

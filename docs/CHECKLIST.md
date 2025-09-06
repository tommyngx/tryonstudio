# Development Checklist - AI Edit Panel & Thumbnail Gallery

- [x] Sağ panel: `AiEditPanel` bileşeni (collapsible, 380px, preset + custom prompt, counter, strength slider)
- [x] AI Yanıt Kartı: `AiResponseCard` (prompt, strength, süre, model)
- [x] Dikey Thumbnail Galerisi: `ThumbnailGallery` (orijinal + history, seçili göstergeleri)
- [x] EditPage entegrasyonu: state yönetimi (`editHistory`, `selectedImageIndex`, `isAiPanelOpen`, `aiLastResponse`)
- [x] Try-on sonrası panel otomatik açılır
- [x] ControlPanel: "AI Düzenle" butonu
- [x] API Stub: `src/app/api/nano-banana-edit/route.ts`
- [ ] Undo/Redo ileri-geri butonları (opsiyonel)
- [ ] Gerçek AI edit servisine entegrasyon (API key, güvenlik)
- [ ] İndirme/Paylaşma entegrasyonları (export options)
- [ ] E2E testler ve görsel regresyon testleri

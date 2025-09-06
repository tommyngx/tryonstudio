# 🚀 TryOnX - AI Sanal Giyim Deneme Uygulaması

AI ile çalışan sanal kıyafet deneme, face swap ve 360° video oluşturma uygulaması.

## ✨ Özellikler

- 🤖 **AI Face Swap**: Gelişmiş yapay zeka ile yüz değiştirme
- 👕 **Sanal Kıyafet Deneme**: Üst ve alt giyim parçalarını gerçekçi şekilde deneme
- 📹 **360° Video Oluşturma**: Kıyafetli halınızın 360° videosunu oluşturma
- 🔍 **Ürün Arama**: Google Lens ile beğendiğiniz kıyafetleri bulma
- ⚡ **Hızlı İşlem**: Saniyeler içinde profesyonel sonuçlar

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand, TanStack Query
- **AI Services**: Replicate API, OpenAI, Stability AI
- **Storage**: Google Cloud Storage, Cloudinary
- **Deployment**: Vercel

## 🚀 Kurulum

1. **Repository'yi klonlayın:**
   ```bash
   git clone <repository-url>
   cd tryonx
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Environment dosyasını yapılandırın:**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` dosyasına gerekli API anahtarlarını ekleyin.

4. **Development sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

5. **Tarayıcıda açın:**
   [http://localhost:3000](http://localhost:3000)

## 🔧 Gerekli API Anahtarları

MVP çalıştırması için bu API anahtarlarına ihtiyacınız var:

- **Replicate API Token**: AI modelleri için
- **Google Vision API Key**: Ürün arama için
- **Cloudinary Credentials**: Görsel yönetimi için

## 📖 Kullanım

1. **Fotoğraf Yükleme**: Yüz veya tam boy fotoğrafınızı yükleyin
2. **Kıyafet Seçimi**: Üst ve alt kıyafetlerden beğendiklerinizi seçin
3. **AI İşleme**: Yapay zeka ile sanal deneme yapın
4. **Sonuç**: 360° video oluşturun ve ürünleri arayın

## 🎯 MVP Özellikleri

✅ Fotoğraf yükleme ve önizleme  
✅ Kıyafet seçim sistemi  
✅ AI işleme simülasyonu  
🔄 Gerçek AI API entegrasyonu  
🔄 360° video oluşturma  
🔄 Ürün arama entegrasyonu  

## 🔗 Geliştirme Aşamaları

### Phase 1 - Temel MVP (✅ Tamamlandı)
- [x] Proje yapısı ve konfigürasyon
- [x] Ana sayfa ve bileşenler
- [x] Fotoğraf yükleme sistemi
- [x] Kıyafet seçim arayüzü
- [x] AI işleme simülasyonu

### Phase 2 - AI Entegrasyonu (🔄 Devam Ediyor)
- [ ] Replicate API entegrasyonu
- [ ] Face swap implementasyonu
- [ ] Virtual try-on API'si
- [ ] Görsel kalite optimizasyonu

### Phase 3 - Video & E-commerce (🔮 Planlanan)
- [ ] 360° video generation
- [ ] Google Lens API
- [ ] Ürün arama ve link sistemi
- [ ] Sosyal medya paylaşım

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Katkı

Pull request'ler memnuniyetle karşılanır! Büyük değişiklikler için önce issue açarak tartışalım.

## 📧 İletişim

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.
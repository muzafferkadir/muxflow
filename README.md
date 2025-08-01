# MuxFlow

**Open-source library for building AI workflow applications, inspired by Google Opal**

MuxFlow, Google Opal'dan ilham alan ve AI destekli mini uygulamalar oluşturmaya yönelik açık kaynak bir workflow builder'dır. Prompt'ları, AI modellerini ve araçları birbirine bağlayarak güçlü iş akışları oluşturmanıza olanak tanır.

## 🌟 Özellikler

- **Visual Workflow Editor**: N8N benzeri drag-and-drop arayüzü
- **AI Node Support**: AI prompt, transformation ve processing node'ları
- **Real-time Preview**: Workflow'unuzun gerçek zamanlı önizlemesi
- **Modern UI/UX**: Tailwind CSS ile modern ve responsive tasarım
- **TypeScript**: Tip güvenliği için tam TypeScript desteği
- **React Flow**: Güçlü workflow visualization engine

## 🚀 Kurulum

```bash
# Projeyi klonlayın
git clone https://github.com/user/muxflow.git
cd muxflow

# Bağımlılıkları yükleyin
npm install

# Development server'ı başlatın
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📋 Kullanım

### Temel Workflow Oluşturma

1. **Sol panel**: Farklı node tiplerini içeren toolbar
2. **Ana canvas**: Workflow'unuzu oluşturacağınız alan
3. **Sağ panel**: Workflow preview ve kod görünümü

### Node Tipleri

- **Input Node**: AI tarafından tasarlanan form componentleri (text, select, checkbox vb.) - Veriler localStorage'de saklanır
- **Show/Display Node**: İçerik görüntüleme sayfaları - AI prompta göre sayfa tasarımı yapar
- **Action Node**: İşlem yapma node'u - Fonksiyonlar, hesaplamalar, client-side API istekleri

### Node Ekleme

Node'ları iki şekilde ekleyebilirsiniz:
1. Sol paneldeki node'a tıklayarak
2. Node'u sürükleyip canvas'a bırakarak

### AI Agent Sistemi

MuxFlow'da workflow'unuzu oluşturduktan sonra:

1. **Description Zorunluluğu**: Her node için açıklayıcı bir description girin
2. **AI Analysis**: Yapay zeka workflow'unuzu analiz eder ve todo listesi oluşturur
3. **Sequential Execution**: AI, görevleri sırayla gerçekleştirir
4. **Browser-Only**: Sadece client-side teknolojiler kullanır (HTML, CSS, JS)
5. **Static Export**: Sonuç olarak deploy edilebilir statik dosyalar üretir

### AI Integration (OpenRouter)

MuxFlow, OpenRouter API üzerinden Google Gemini Flash 1.5 modelini kullanır:

1. **API Configuration**: `.env.local` dosyasında OpenRouter token'ınızı tanımlayın
2. **Node Generation**: Her node türü için optimize edilmiş AI prompts
3. **Code Generation**: HTML, CSS, JavaScript kod üretimi
4. **Error Handling**: API hatalarını yakalama ve kullanıcıya bildirim
5. **Export System**: Tüm generated code'u tek HTML dosyasında birleştirme

#### Kurulum
```bash
# .env.local dosyası oluşturun
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-token-here
NEXT_PUBLIC_DEFAULT_MODEL=google/gemini-flash-1.5
```

### Kısıtlamalar ve Odak

- ❌ Server-side işlemler (database, backend API'ler)
- ❌ Karmaşık authentication sistemleri
- ✅ localStorage ile veri saklama
- ✅ Client-side API istekleri
- ✅ SPA (Single Page Application) yaklaşımı
- ✅ Hızlı deployment için statik dosyalar

## 🎯 Google Opal ile Benzerlikler

MuxFlow, [Google Opal](https://developers.googleblog.com/en/introducing-opal/)'ın temel özelliklerini açık kaynak olarak sunar:

- ✅ Visual workflow creation
- ✅ AI-powered processing steps
- ✅ No-code approach
- ✅ Real-time preview
- ✅ Shareable workflows

## 🛠 Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Workflow Engine**: React Flow
- **Icons**: Lucide React
- **UI Components**: Custom React components

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── page.tsx          # Ana sayfa
│   └── layout.tsx        # Root layout
├── components/
│   ├── WorkflowEditor.tsx    # Ana workflow editörü
│   ├── PreviewPanel.tsx      # Preview paneli
│   ├── NodeToolbar.tsx       # Node toolbar
│   └── nodes/
│       └── CustomNode.tsx    # Custom node component
└── ...
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🔗 Bağlantılar

- [Google Opal Blog Post](https://developers.googleblog.com/en/introducing-opal/)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**MuxFlow** - AI workflow'larınızı görselleştirin ve otomatikleştirin!

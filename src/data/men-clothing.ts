export interface ClothingSet {
  id: string
  name: string
  category: string
  type: 'single' | 'combo'
  image: string
  description: string
  colors: string[]
  sizes: string[]
  price?: number
  brand?: string
}

// Erkek tek parça kıyafetler
export const menSingleClothing: ClothingSet[] = [
  {
    id: 'men_shirt_001',
    name: 'Beyaz Oxford Gömlek',
    category: 'Gömlek',
    type: 'single',
    image: '/images/clothing/men/single/shirts/white-oxford.jpg',
    description: 'Klasik beyaz oxford gömlek, hem iş hem günlük kullanım',
    colors: ['Beyaz', 'Mavi', 'Gri'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 299,
    brand: 'ClassicFit'
  },
  {
    id: 'men_shirt_002',
    name: 'Lacivert Polo T-Shirt',
    category: 'T-Shirt',
    type: 'single',
    image: '/images/clothing/men/single/shirts/navy-polo.jpg',
    description: 'Rahat ve şık polo t-shirt',
    colors: ['Lacivert', 'Beyaz', 'Gri', 'Siyah'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 199,
    brand: 'SportWear'
  },
  {
    id: 'men_suit_001',
    name: 'Antrasit Takım Elbise',
    category: 'Takım',
    type: 'single',
    image: '/images/clothing/men/single/suits/charcoal-suit.jpg',
    description: 'Modern kesim antrasit takım elbise',
    colors: ['Antrasit', 'Lacivert', 'Siyah'],
    sizes: ['48', '50', '52', '54'],
    price: 1299,
    brand: 'FormalWear'
  }
]

// Erkek kıyafet kombinasyonları
export const menComboClothing: ClothingSet[] = [
  {
    id: 'men_combo_001',
    name: 'İş Kombinasyonu',
    category: 'Business',
    type: 'combo',
    image: '/images/clothing/men/combo/business/shirt-trouser-set.jpg',
    description: 'Beyaz gömlek + antrasit pantolon kombinasyonu',
    colors: ['Beyaz/Antrasit', 'Mavi/Lacivert'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 599,
    brand: 'BusinessPro'
  },
  {
    id: 'men_combo_002',
    name: 'Casual Kombini',
    category: 'Casual',
    type: 'combo',
    image: '/images/clothing/men/combo/casual/tshirt-jeans-set.jpg',
    description: 'Polo t-shirt + jean pantolon kombinasyonu',
    colors: ['Lacivert/Denim', 'Gri/Siyah'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 399,
    brand: 'CasualFit'
  },
  {
    id: 'men_combo_003',
    name: 'Resmi Akşam Kıyafeti',
    category: 'Formal',
    type: 'combo',
    image: '/images/clothing/men/combo/formal/evening-formal-set.jpg',
    description: 'Smokin gömlek + pantolon + papyon set',
    colors: ['Siyah/Beyaz', 'Lacivert/Beyaz'],
    sizes: ['48', '50', '52', '54'],
    price: 899,
    brand: 'EveningWear'
  }
]

// Tüm erkek kıyafetlerini birleştir
export const allMenClothing = [...menSingleClothing, ...menComboClothing]

// Kategoriye göre filtrele
export const getMenClothingByType = (type: 'single' | 'combo') => {
  return allMenClothing.filter(item => item.type === type)
}

// Kategori listesi
export const menClothingCategories = {
  single: ['Gömlek', 'T-Shirt', 'Takım', 'Casual'],
  combo: ['Business', 'Casual', 'Formal']
}

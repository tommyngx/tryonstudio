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
  // Eksik görseller kaldırıldı - hata vermeyen kıyafetler eklenebilir
]

// Erkek kıyafet kombinasyonları
export const menComboClothing: ClothingSet[] = [
  // Eksik görseller kaldırıldı - hata vermeyen kıyafetler eklenebilir
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

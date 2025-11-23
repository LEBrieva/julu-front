import type { HeroCategoryConfig } from '../../../shared/components/hero-category-card/hero-category-card.component';
import type { CompactCategoryConfig } from '../../../shared/components/compact-category-card/compact-category-card.component';

// Categoría Hero (destacada)
export const HERO_CATEGORY: HeroCategoryConfig = {
  id: 'oversize',
  name: 'Oversize',
  tagline: 'Mais vendido',
  description: 'Conforto supremo com estilo urbano. O ajuste perfeito para quem busca liberdade de movimento sem sacrificar o visual.',
  benefits: [
    'Máximo conforto e amplitude',
    'Estilo streetwear moderno',
    'Versátil para qualquer ocasião'
  ],
  image: '/assets/images/categories/oversize.jpg',
  queryParams: { style: 'oversize' }
};

// Categorías secundarias (4 cards compactas)
export const COMPACT_CATEGORIES: CompactCategoryConfig[] = [
  {
    id: 'regular',
    name: 'Regular',
    image: '/assets/images/categories/regular.jpg',
    queryParams: { style: 'regular' }
  },
  {
    id: 'slim',
    name: 'Slim Fit',
    image: '/assets/images/categories/slim.jpg',
    queryParams: { style: 'slim_fit' }
  },
  {
    id: 'straight',
    name: 'Straight',
    image: '/assets/images/categories/straight.jpg',
    queryParams: { style: 'straight' }
  },
  {
    id: 'skinny',
    name: 'Skinny',
    image: '/assets/images/categories/skinny.jpg',
    queryParams: { style: 'skinny' }
  }
];


import type { HeroCategoryConfig } from '../../../shared/components/hero-category-card/hero-category-card.component';
import type { CompactCategoryConfig } from '../../../shared/components/compact-category-card/compact-category-card.component';

// Categoría Hero (destacada)
export const HERO_CATEGORY: HeroCategoryConfig = {
  id: 'oversize',
  name: 'Oversize',
  tagline: 'Lo más vendido',
  description: 'Comodidad suprema con estilo urbano. El fit perfecto para quienes buscan libertad de movimiento sin sacrificar el look.',
  benefits: [
    'Máxima comodidad y amplitud',
    'Estilo streetwear moderno',
    'Versátil para cualquier ocasión'
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


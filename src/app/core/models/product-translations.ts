import {
  ProductCategory,
  ProductStyle,
  ProductSize,
  ProductColor,
  ProductStatus
} from './product.model';

/**
 * Traduções de enums de produtos para Português (pt-BR)
 */

// Categorias
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  remera: 'Camiseta',
  pantalon: 'Calça',
  chaqueta: 'Jaqueta',
  zapatillas: 'Tênis',
  botas: 'Botas',
  shorts: 'Shorts',
  vestido: 'Vestido',
  blusa: 'Blusa'
};

// Estilos
export const PRODUCT_STYLE_LABELS: Record<ProductStyle, string> = {
  // Estilos para camisetas/blusas
  regular: 'Regular',
  oversize: 'Oversize',
  slim_fit: 'Slim Fit',
  // Estilos para calças/jeans/shorts
  straight: 'Reta',
  skinny: 'Skinny',
  relaxed: 'Relaxada',
  bootcut: 'Bootcut',
  // Estilos para moletons/jaquetas
  classic: 'Clássico',
  cropped: 'Cropped',
  oversized: 'Oversized',
  // Estilos para calçados
  casual: 'Casual',
  formal: 'Formal',
  deportivo: 'Esportivo',
  urbano: 'Urbano',
  // Estilos para vestidos/saias
  a_line: 'Linha A',
  bodycon: 'Justo',
  maxi: 'Longo',
  mini: 'Mini',
  midi: 'Midi'
};

// Tamanhos (mantém as mesmas siglas)
export const PRODUCT_SIZE_LABELS: Record<ProductSize, string> = {
  P: 'P',
  M: 'M',
  G: 'G',
  GG: 'GG'
};

// Cores
export const PRODUCT_COLOR_LABELS: Record<ProductColor, string> = {
  black: 'Preto',
  white: 'Branco',
  gray: 'Cinza',
  navy: 'Azul Marinho',
  red: 'Vermelho',
  blue: 'Azul'
};

// Status
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  out_of_stock: 'Fora de Estoque'
};

/**
 * Helpers para obter labels traduzidos
 */
export function getCategoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORY_LABELS[category] || category;
}

export function getStyleLabel(style: ProductStyle): string {
  return PRODUCT_STYLE_LABELS[style] || style;
}

export function getSizeLabel(size: ProductSize): string {
  return PRODUCT_SIZE_LABELS[size] || size;
}

export function getColorLabel(color: ProductColor): string {
  return PRODUCT_COLOR_LABELS[color] || color;
}

export function getStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_LABELS[status] || status;
}

/**
 * Arrays para dropdowns (mantém valor original + label traduzido)
 */
export const CATEGORY_OPTIONS = Object.entries(PRODUCT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as ProductCategory, label })
);

export const STYLE_OPTIONS = Object.entries(PRODUCT_STYLE_LABELS).map(
  ([value, label]) => ({ value: value as ProductStyle, label })
);

export const SIZE_OPTIONS = Object.entries(PRODUCT_SIZE_LABELS).map(
  ([value, label]) => ({ value: value as ProductSize, label })
);

export const COLOR_OPTIONS = Object.entries(PRODUCT_COLOR_LABELS).map(
  ([value, label]) => ({ value: value as ProductColor, label })
);

export const STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as ProductStatus, label })
);

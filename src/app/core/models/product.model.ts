/**
 * Modelos relacionados con Productos
 *
 * Estos interfaces representan las estructuras de datos que vienen del backend NestJS.
 * Son equivalentes a los DTOs y enums del backend.
 */

// ===========================
// ENUMS
// ===========================

/**
 * Estados de producto (debe coincidir con el backend)
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock'
}

/**
 * Categorías de producto (debe coincidir con el backend)
 */
export enum ProductCategory {
  REMERA = 'remera',
  PANTALON = 'pantalon',
  CHAQUETA = 'chaqueta',
  ZAPATILLAS = 'zapatillas',
  BOTAS = 'botas',
  SHORTS = 'shorts',
  VESTIDO = 'vestido',
  BLUSA = 'blusa'
}

/**
 * Estilos de producto (debe coincidir con el backend)
 */
export enum ProductStyle {
  // Estilos para camisetas/remeras/polos/blusas
  REGULAR = 'regular',
  OVERSIZE = 'oversize',
  SLIM_FIT = 'slim_fit',

  // Estilos para pantalones/jeans/shorts
  STRAIGHT = 'straight',
  SKINNY = 'skinny',
  RELAXED = 'relaxed',
  BOOTCUT = 'bootcut',

  // Estilos para sudaderas/hoodies/chaquetas
  CLASSIC = 'classic',
  CROPPED = 'cropped',
  OVERSIZED = 'oversized',

  // Estilos para calzado
  CASUAL = 'casual',
  FORMAL = 'formal',
  DEPORTIVO = 'deportivo',
  URBANO = 'urbano',

  // Estilos para vestidos/faldas
  A_LINE = 'a_line',
  BODYCON = 'bodycon',
  MAXI = 'maxi',
  MINI = 'mini',
  MIDI = 'midi'
}

/**
 * Tallas de producto (para futura fase de variantes)
 */
export enum ProductSize {
  P = 'P',
  M = 'M',
  G = 'G',
  GG = 'GG',
}

/**
 * Colores de producto (para futura fase de variantes)
 */
export enum ProductColor {
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  NAVY = 'navy',
  RED = 'red',
  BLUE = 'blue'
}

/**
 * Mapeo de categorías a estilos permitidos
 * Usado para validación en el frontend
 */
export const CATEGORY_STYLE_MAP: Record<ProductCategory, ProductStyle[]> = {
  [ProductCategory.REMERA]: [
    ProductStyle.REGULAR,
    ProductStyle.OVERSIZE,
    ProductStyle.SLIM_FIT
  ],
  [ProductCategory.BLUSA]: [
    ProductStyle.REGULAR,
    ProductStyle.OVERSIZE,
    ProductStyle.SLIM_FIT
  ],
  [ProductCategory.PANTALON]: [
    ProductStyle.STRAIGHT,
    ProductStyle.SKINNY,
    ProductStyle.RELAXED,
    ProductStyle.BOOTCUT
  ],
  [ProductCategory.SHORTS]: [
    ProductStyle.STRAIGHT,
    ProductStyle.SKINNY,
    ProductStyle.RELAXED
  ],
  [ProductCategory.CHAQUETA]: [
    ProductStyle.CLASSIC,
    ProductStyle.CROPPED,
    ProductStyle.OVERSIZED
  ],
  [ProductCategory.ZAPATILLAS]: [
    ProductStyle.CASUAL,
    ProductStyle.DEPORTIVO,
    ProductStyle.URBANO
  ],
  [ProductCategory.BOTAS]: [
    ProductStyle.CASUAL,
    ProductStyle.FORMAL,
    ProductStyle.URBANO
  ],
  [ProductCategory.VESTIDO]: [
    ProductStyle.A_LINE,
    ProductStyle.BODYCON,
    ProductStyle.MAXI,
    ProductStyle.MINI,
    ProductStyle.MIDI
  ]
};

// ===========================
// INTERFACES - RESPONSES
// ===========================

/**
 * Interface de Variante
 */
export interface ProductVariant {
  sku: string;
  size: ProductSize;
  color: ProductColor;
  stock: number;
  price: number;
}

/**
 * Interface del Producto completo (respuesta de detalle)
 * Devuelto por: GET /products/findById, POST /products, PATCH /products/:id
 */
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  images?: string[];
  variants: ProductVariant[];
  status: ProductStatus;
  category: ProductCategory;
  style: ProductStyle;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de Producto en listado (respuesta simplificada para tabla)
 * Devuelto por: GET /products (con paginación)
 */
export interface ProductListItem {
  id: string;
  name: string;
  code: string;
  basePrice: number;
  status: string;
  category?: string;
  style?: string;
  totalVariants: number;
  totalStock: number;
  tags?: string[];
}

// ===========================
// INTERFACES - DTOs
// ===========================

/**
 * DTO para crear producto
 * Enviado a: POST /products
 *
 * NOTA: En la versión simplificada (FASE 5), solo usamos campos básicos.
 * Las variantes se agregarán en fases futuras.
 */
export interface CreateProductDto {
  name: string;
  code: string;
  description?: string;
  basePrice: number;
  category: ProductCategory;
  style: ProductStyle;
  variants: CreateProductVariantDto[]; // Array de variantes (al menos 1)
  tags?: string[];
}

/**
 * DTO para crear variante
 */
export interface CreateProductVariantDto {
  size: ProductSize;
  color: ProductColor;
  stock: number;
  price: number;
}

/**
 * DTO para actualizar producto
 * Enviado a: PATCH /products/:id
 */
export interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  basePrice?: number;
  category?: ProductCategory;
  style?: ProductStyle;
  status?: ProductStatus;
  tags?: string[];
  images?: string[];
}

/**
 * DTO para agregar variante a un producto existente
 * Enviado a: POST /products/:id/variants
 */
export interface AddVariantDto {
  size: ProductSize;
  color: ProductColor;
  stock: number;
  price: number;
}

/**
 * DTO para actualizar una variante específica
 * Enviado a: PATCH /products/:id/variants/:sku
 */
export interface UpdateSingleVariantDto {
  stock?: number;
  price?: number;
}

/**
 * DTO para filtrar productos (query params)
 * Usado en: GET /products?page=1&limit=10&search=...
 */
export interface FilterProductDto {
  search?: string;      // Búsqueda por texto (nombre/descripción)
  page?: number;        // Número de página (default: 1)
  limit?: number;       // Items por página (default: 10)
  category?: ProductCategory;
  style?: ProductStyle;
  code?: string;
  status?: ProductStatus;
  tags?: string[];
  size?: ProductSize;
  color?: ProductColor;
}

// ===========================
// HELPERS
// ===========================

/**
 * Obtiene los estilos válidos para una categoría
 */
export function getValidStylesForCategory(category: ProductCategory): ProductStyle[] {
  return CATEGORY_STYLE_MAP[category] || [];
}

/**
 * Valida si un estilo es válido para una categoría
 */
export function isValidStyleForCategory(category: ProductCategory, style: ProductStyle): boolean {
  return getValidStylesForCategory(category).includes(style);
}

/**
 * Convierte enum a opciones de dropdown
 * Ej: { label: 'Remera', value: 'remera' }
 */
export function enumToOptions<T extends Record<string, string>>(
  enumObj: T
): { label: string; value: string }[] {
  return Object.values(enumObj).map((value) => ({
    label: formatEnumValue(value),
    value: value
  }));
}

/**
 * Formatea un valor de enum para mostrar en UI
 * Ej: 'out_of_stock' → 'Out Of Stock'
 */
export function formatEnumValue(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Obtiene la clase de severidad de PrimeNG según el estado
 */
export function getStatusSeverity(status: ProductStatus): 'success' | 'danger' | 'warn' {
  switch (status) {
    case ProductStatus.ACTIVE:
      return 'success';
    case ProductStatus.INACTIVE:
      return 'danger';
    case ProductStatus.OUT_OF_STOCK:
      return 'warn';
    default:
      return 'warn';
  }
}

// ===========================
// HELPERS - VARIANTES
// ===========================

/**
 * Formatea el tamaño de producto para mostrar en UI
 */
export function formatSize(size: ProductSize): string {
  return size.toUpperCase();
}

/**
 * Formatea el color de producto para mostrar en UI
 */
export function formatColor(color: ProductColor): string {
  const colorMap: Record<ProductColor, string> = {
    [ProductColor.BLACK]: 'Negro',
    [ProductColor.WHITE]: 'Blanco',
    [ProductColor.GRAY]: 'Gris',
    [ProductColor.NAVY]: 'Azul Marino',
    [ProductColor.RED]: 'Rojo',
    [ProductColor.BLUE]: 'Azul'
  };
  return colorMap[color] || formatEnumValue(color);
}

/**
 * Formatea el estilo de producto para mostrar en UI
 */
export function formatStyle(style: ProductStyle): string {
  const styleMap: Record<ProductStyle, string> = {
    [ProductStyle.REGULAR]: 'Regular',
    [ProductStyle.OVERSIZE]: 'Oversize',
    [ProductStyle.SLIM_FIT]: 'Slim Fit',
    [ProductStyle.STRAIGHT]: 'Recto',
    [ProductStyle.SKINNY]: 'Ajustado',
    [ProductStyle.RELAXED]: 'Relajado',
    [ProductStyle.BOOTCUT]: 'Bootcut',
    [ProductStyle.CLASSIC]: 'Clásico',
    [ProductStyle.CROPPED]: 'Corto',
    [ProductStyle.OVERSIZED]: 'Oversize',
    [ProductStyle.CASUAL]: 'Casual',
    [ProductStyle.FORMAL]: 'Formal',
    [ProductStyle.DEPORTIVO]: 'Deportivo',
    [ProductStyle.URBANO]: 'Urbano',
    [ProductStyle.A_LINE]: 'Línea A',
    [ProductStyle.BODYCON]: 'Ajustado',
    [ProductStyle.MAXI]: 'Maxi',
    [ProductStyle.MINI]: 'Mini',
    [ProductStyle.MIDI]: 'Midi'
  };
  return styleMap[style] || formatEnumValue(style);
}

/**
 * Obtiene el código hexadecimal de un color
 */
export function getColorHex(color: ProductColor): string {
  const colorHexMap: Record<ProductColor, string> = {
    [ProductColor.BLACK]: '#000000',
    [ProductColor.WHITE]: '#FFFFFF',
    [ProductColor.GRAY]: '#6B7280',
    [ProductColor.NAVY]: '#1E3A8A',
    [ProductColor.RED]: '#DC2626',
    [ProductColor.BLUE]: '#3B82F6'
  };
  return colorHexMap[color] || '#6B7280';
}

/**
 * Obtiene el color de texto apropiado según el color de fondo
 */
export function getTextColor(color: ProductColor): string {
  // Colores claros necesitan texto oscuro, colores oscuros necesitan texto claro
  const lightColors = [ProductColor.WHITE];
  return lightColors.includes(color) ? '#000000' : '#FFFFFF';
}

/**
 * Obtiene la severidad de PrimeNG según el tamaño
 */
export function getSizeSeverity(size: ProductSize): 'info' | 'success' | 'warn' | 'danger' {
  switch (size) {
    case ProductSize.P:
      return 'info';
    case ProductSize.M:
    case ProductSize.G:
      return 'success';
    case ProductSize.GG:
      return 'danger';
    default:
      return 'warn';
  }
}

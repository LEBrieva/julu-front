# Cambios Requeridos en el Backend

## Overview

Este documento detalla los cambios necesarios en el backend de NestJS para soportar la nueva funcionalidad de selectores de variantes en las tarjetas de producto del catálogo público.

**Fecha:** 2025-11-17  
**Versión Frontend:** Actualizada con selectores de variantes  
**Estado:** 🔴 Cambio Requerido en Backend

---

## 🎯 Objetivo

Permitir que las tarjetas de producto en el catálogo público (`/products`) muestren selectores de color y tamaño, y permitan agregar productos al carrito directamente sin navegar al detalle.

## 📋 Cambios Necesarios

### 1. Actualizar Endpoint GET /products/catalog

**Endpoint Actual:**
```
GET /api/products/catalog?page=1&limit=12&category=remera
```

**Response Actual:**
```typescript
{
  data: ProductListItem[];
  meta: PaginationMeta;
}

interface ProductListItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  basePrice: number;
  status: string;
  category?: string;
  style?: string;
  totalVariants: number;    // ⚠️ Solo contador
  totalStock: number;        // ⚠️ Solo total
  tags?: string[];
  destacado?: boolean;
  images?: string[];
  featuredImageIndex?: number;
}
```

**Response Requerida:**
```typescript
{
  data: ProductListItemWithVariants[];
  meta: PaginationMeta;
}

interface ProductListItemWithVariants {
  id: string;
  name: string;
  code: string;
  description?: string;
  basePrice: number;
  status: string;
  category?: string;
  style?: string;
  totalVariants: number;
  totalStock: number;
  variants: ProductVariant[];  // ✅ NUEVO: Array completo de variantes
  tags?: string[];
  destacado?: boolean;
  images?: string[];
  featuredImageIndex?: number;
}

interface ProductVariant {
  sku: string;
  size: 'P' | 'M' | 'G' | 'GG';
  color: 'black' | 'white' | 'gray' | 'navy' | 'red' | 'blue';
  stock: number;
  priceModifier?: number;
  price?: number;  // Precio calculado (basePrice + priceModifier)
}
```

### 2. Cambios en el Controlador

**Archivo:** `src/products/products.controller.ts`

El endpoint `findAllCatalog` ya debe estar devolviendo los productos, pero necesita incluir las variantes completas.

**Implementación Recomendada:**

```typescript
@Get('catalog')
@Public()
async findAllCatalog(
  @Query() filterDto: FilterProductDto,
): Promise<{ data: ProductListItemWithVariants[]; meta: PaginationMeta }> {
  const { page = 1, limit = 12, ...filters } = filterDto;
  const skip = (page - 1) * limit;

  // Buscar productos con variantes incluidas
  const [products, total] = await this.productsService.findAllForCatalog({
    skip,
    take: limit,
    filters,
    includeVariants: true,  // ✅ NUEVO parámetro
  });

  return {
    data: products.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      basePrice: product.basePrice,
      status: product.status,
      category: product.category,
      style: product.style,
      totalVariants: product.variants.length,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
      variants: product.variants,  // ✅ NUEVO: Incluir variantes completas
      tags: product.tags,
      destacado: product.destacado,
      images: product.images,
      featuredImageIndex: product.featuredImageIndex,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 3. Cambios en el Servicio

**Archivo:** `src/products/products.service.ts`

Actualizar el método que busca productos para el catálogo:

```typescript
async findAllForCatalog(options: {
  skip: number;
  take: number;
  filters: any;
  includeVariants?: boolean;
}): Promise<[Product[], number]> {
  const { skip, take, filters, includeVariants = false } = options;

  const query = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.variants', 'variant')  // ✅ JOIN con variantes
    .where('product.status = :status', { status: 'active' })
    .skip(skip)
    .take(take);

  // Aplicar filtros (category, style, etc.)
  if (filters.category) {
    query.andWhere('product.category = :category', { category: filters.category });
  }

  if (filters.style) {
    query.andWhere('product.style = :style', { style: filters.style });
  }

  // ... otros filtros

  // Ejecutar query
  const [products, total] = await query.getManyAndCount();

  return [products, total];
}
```

### 4. Consideraciones de Performance

#### 4.1 Impacto en el Tamaño de la Respuesta

**Antes:**
```json
{
  "id": "uuid",
  "name": "Remera Oversize",
  "totalVariants": 12,
  "totalStock": 150
}
```
**Tamaño aproximado:** ~200 bytes por producto

**Después:**
```json
{
  "id": "uuid",
  "name": "Remera Oversize",
  "totalVariants": 12,
  "totalStock": 150,
  "variants": [
    { "sku": "REM-001-P-BLACK", "size": "P", "color": "black", "stock": 10, "price": 15000 },
    { "sku": "REM-001-M-BLACK", "size": "M", "color": "black", "stock": 15, "price": 15000 },
    // ... 10 más
  ]
}
```
**Tamaño aproximado:** ~1.2 KB por producto

**Análisis:**
- Catálogo de 12 productos: 2.4 KB → 14.4 KB (~6x más grande)
- Catálogo de 24 productos: 4.8 KB → 28.8 KB (~6x más grande)
- **Conclusión:** Aumento manejable, especialmente con gzip (~50% compresión)

#### 4.2 Optimizaciones Recomendadas

1. **Caching:**
   ```typescript
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(300) // 5 minutos
   @Get('catalog')
   async findAllCatalog(...) { ... }
   ```

2. **Paginación Eficiente:**
   - Mantener límite de 12-24 productos por página
   - No enviar más de lo necesario

3. **Índices en Base de Datos:**
   ```sql
   CREATE INDEX idx_product_status ON products(status);
   CREATE INDEX idx_product_category ON products(category);
   CREATE INDEX idx_variant_stock ON product_variants(stock);
   ```

4. **Comprensión HTTP:**
   - Asegurar que NestJS tenga comprensión habilitada
   ```typescript
   // main.ts
   import * as compression from 'compression';
   app.use(compression());
   ```

### 5. Endpoints Afectados

✅ **Endpoint Principal:**
- `GET /api/products/catalog` - **REQUIERE ACTUALIZACIÓN**

✅ **Endpoints NO Afectados:**
- `GET /api/products` (admin) - Ya incluye variantes
- `GET /api/products/:id` (detalle) - Ya incluye variantes
- `POST /api/cart/items` - Sin cambios necesarios

### 6. Validación y Testing

#### 6.1 Casos de Prueba

1. **Productos con múltiples variantes:**
   ```
   GET /api/products/catalog?page=1&limit=12
   
   Verificar que cada producto tenga:
   - Array `variants` con al menos 1 elemento
   - Cada variante con `sku`, `size`, `color`, `stock`, `price`
   ```

2. **Productos sin stock:**
   ```
   GET /api/products/catalog
   
   Verificar que:
   - Productos con stock = 0 en todas las variantes no aparezcan
   - O aparezcan con variants vacío (decidir comportamiento)
   ```

3. **Filtros combinados:**
   ```
   GET /api/products/catalog?category=remera&style=oversize
   
   Verificar que:
   - Los productos devueltos cumplan ambos filtros
   - Las variantes estén incluidas correctamente
   ```

#### 6.2 Tests Unitarios

```typescript
describe('ProductsController - Catalog', () => {
  it('should return products with variants array', async () => {
    const result = await controller.findAllCatalog({
      page: 1,
      limit: 12,
    });

    expect(result.data).toBeDefined();
    expect(result.data[0].variants).toBeInstanceOf(Array);
    expect(result.data[0].variants.length).toBeGreaterThan(0);
    expect(result.data[0].variants[0]).toHaveProperty('sku');
    expect(result.data[0].variants[0]).toHaveProperty('size');
    expect(result.data[0].variants[0]).toHaveProperty('color');
    expect(result.data[0].variants[0]).toHaveProperty('stock');
  });

  it('should only include variants with stock > 0', async () => {
    const result = await controller.findAllCatalog({
      page: 1,
      limit: 12,
    });

    result.data.forEach(product => {
      product.variants.forEach(variant => {
        expect(variant.stock).toBeGreaterThan(0);
      });
    });
  });
});
```

### 7. Documentación de API (Swagger)

Actualizar la documentación de Swagger:

```typescript
@ApiOperation({ 
  summary: 'Obtener catálogo público de productos',
  description: 'Devuelve productos activos con variantes completas para el catálogo público'
})
@ApiResponse({
  status: 200,
  description: 'Catálogo de productos obtenido exitosamente',
  schema: {
    properties: {
      data: {
        type: 'array',
        items: {
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            variants: {
              type: 'array',
              items: {
                properties: {
                  sku: { type: 'string' },
                  size: { enum: ['P', 'M', 'G', 'GG'] },
                  color: { enum: ['black', 'white', 'gray', 'navy', 'red', 'blue'] },
                  stock: { type: 'number' },
                  price: { type: 'number' },
                }
              }
            }
          }
        }
      },
      meta: {
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          totalPages: { type: 'number' },
        }
      }
    }
  }
})
@Get('catalog')
async findAllCatalog(...) { ... }
```

---

## 🔄 Flujo de Datos Completo

### Frontend → Backend

1. **Usuario navega al catálogo:**
   ```
   GET /api/products/catalog?page=1&limit=12&category=remera
   ```

2. **Backend responde con productos + variantes:**
   ```json
   {
     "data": [
       {
         "id": "prod-123",
         "name": "Remera Oversize Negra",
         "basePrice": 15000,
         "variants": [
           { "sku": "REM-001-P-BLACK", "size": "P", "color": "black", "stock": 10, "price": 15000 },
           { "sku": "REM-001-M-BLACK", "size": "M", "color": "black", "stock": 15, "price": 15000 },
           { "sku": "REM-001-P-WHITE", "size": "P", "color": "white", "stock": 8, "price": 15000 }
         ]
       }
     ],
     "meta": { "page": 1, "limit": 12, "total": 45, "totalPages": 4 }
   }
   ```

3. **Frontend muestra selectores:**
   - Extrae colores únicos: `['black', 'white']`
   - Usuario selecciona `black`
   - Muestra tamaños disponibles para `black`: `['P', 'M']`
   - Usuario selecciona `M`
   - Habilita botón "Agregar al Carrito"

4. **Usuario agrega al carrito:**
   ```json
   POST /api/cart/items
   {
     "productId": "prod-123",
     "variantSKU": "REM-001-M-BLACK",
     "quantity": 1
   }
   ```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Datos en Response** | Contadores (totalVariants, totalStock) | Array completo de variantes |
| **Tamaño Response** | ~2.4 KB (12 productos) | ~14.4 KB (12 productos) |
| **Llamadas al Backend** | 1 (catálogo) + 1 por cada "Ver detalle" | 1 (catálogo) |
| **UX** | Navegación obligatoria al detalle | Compra directa desde catálogo |
| **Conversión esperada** | Baseline | +15-30% (reducción de fricción) |

---

## ✅ Checklist de Implementación

### Backend

- [ ] Actualizar `ProductListItem` interface/DTO para incluir `variants[]`
- [ ] Modificar `findAllCatalog` en el controlador
- [ ] Actualizar `findAllForCatalog` en el servicio para incluir JOIN con variantes
- [ ] Agregar caching al endpoint (opcional pero recomendado)
- [ ] Verificar que solo se devuelvan variantes con stock > 0
- [ ] Actualizar documentación de Swagger
- [ ] Escribir tests unitarios
- [ ] Escribir tests e2e
- [ ] Verificar performance con 50+ productos
- [ ] Habilitar compresión HTTP si no está activa

### Base de Datos

- [ ] Verificar índices en `products.status`
- [ ] Verificar índices en `products.category`
- [ ] Verificar índices en `product_variants.stock`
- [ ] Ejecutar EXPLAIN ANALYZE en query de catálogo
- [ ] Optimizar si es necesario

### Deployment

- [ ] Actualizar backend primero (retrocompatible)
- [ ] Verificar en staging
- [ ] Deploy frontend
- [ ] Monitorear tamaño de respuestas
- [ ] Monitorear tiempos de carga

---

## 🚨 Notas Importantes

1. **Retrocompatibilidad:** El cambio **NO es retrocompatible** con el frontend anterior, ya que el frontend actualizado espera el array `variants`.

2. **Orden de Deploy:**
   - ✅ **Correcto:** Deploy backend primero (incluirá `variants`), luego frontend
   - ❌ **Incorrecto:** Deploy frontend primero (buscará `variants` que no existen)

3. **Alternativa Sin Cambio en Backend:**
   - Si no se puede actualizar el backend inmediatamente, el frontend puede hacer llamadas individuales al endpoint `GET /products/:id` para cada producto al cargar el catálogo
   - **Desventaja:** Múltiples llamadas (N+1 queries)
   - **No recomendado** para producción

4. **Migración Gradual:**
   - Opción 1: Nuevo endpoint `GET /products/catalog-v2` con variantes
   - Opción 2: Query param `?includeVariants=true` en endpoint actual
   - Frontend puede detectar y adaptarse

---

## 📞 Contacto

Para dudas sobre la implementación de estos cambios, contactar al equipo de frontend.

**Autor:** Equipo Frontend  
**Fecha:** 2025-11-17  
**Prioridad:** Alta 🔴


# Plan de Implementación: Mejoras en Product Card

## Overview

Mejorar las tarjetas de producto (`ProductCardComponent`) del catálogo público para permitir la selección de variantes (color y tamaño) y agregar productos al carrito directamente desde el catálogo, sin necesidad de navegar al detalle del producto. Esto mejorará significativamente la experiencia de usuario y aumentará la tasa de conversión al reducir la fricción en el proceso de compra.

## Requirements

### Funcionales

1. **Visualización de Colores Disponibles**
   - Mostrar todos los colores disponibles del producto como círculos de color
   - Los colores deben ser clickeables
   - El color seleccionado debe tener indicador visual (borde destacado)
   - Mostrar solo colores que tengan stock disponible

2. **Visualización de Tamaños Disponibles**
   - Mostrar todos los tamaños disponibles (P, M, G, GG) como botones o badges
   - Los tamaños deben ser clickeables
   - El tamaño seleccionado debe tener indicador visual
   - Mostrar solo tamaños que tengan stock para el color seleccionado
   - Deshabilitar tamaños sin stock

3. **Botón Agregar al Carrito**
   - Botón visible y accesible en la tarjeta
   - Solo habilitado cuando hay color y tamaño seleccionados
   - Al hacer clic, agregar el producto con la variante seleccionada
   - Mostrar feedback visual al agregar (loading state)
   - Abrir el cart drawer automáticamente después de agregar

4. **Gestión de Estado**
   - Mantener la selección de color/tamaño local en cada card
   - Actualizar dinámicamente los tamaños disponibles según el color seleccionado
   - Calcular y mostrar el precio de la variante (basePrice + priceModifier)

5. **Validaciones**
   - Verificar stock antes de permitir agregar
   - Validar que existe la combinación color-tamaño
   - Manejar errores de forma amigable

### No Funcionales

1. **UI/UX**
   - Diseño limpio y moderno siguiendo Tailwind CSS
   - Transiciones suaves al seleccionar variantes
   - Responsive para móvil, tablet y desktop
   - Mantener consistencia con el diseño actual

2. **Performance**
   - No afectar el tiempo de carga del catálogo
   - Minimizar re-renders innecesarios
   - Usar signals y computed para reactividad eficiente

3. **Accesibilidad**
   - Botones con labels accesibles
   - Indicadores de estado claros
   - Keyboard navigation

4. **Mantenibilidad**
   - Código limpio y documentado
   - Reutilizar componentes existentes cuando sea posible
   - Separación de responsabilidades

## Implementation Steps

### Paso 1: Preparación y Análisis

**Archivos a revisar:**
- `src/app/shared/components/product-card/product-card.component.ts`
- `src/app/shared/components/product-card/product-card.component.html`
- `src/app/shared/components/product-card/product-card.component.css`
- `src/app/core/models/product.model.ts`
- `src/app/core/services/cart.service.ts`

**Tareas:**
1. ✅ Revisar estructura actual del ProductCard
2. ✅ Analizar modelo de Product y ProductVariant
3. ✅ Entender el funcionamiento del CartService
4. ✅ Identificar helpers existentes en product.model.ts
5. Documentar flujo de datos actual

### Paso 2: Actualizar TypeScript del ProductCard

**Archivo:** `src/app/shared/components/product-card/product-card.component.ts`

**Cambios a implementar:**

1. **Agregar imports necesarios:**
   ```typescript
   import { inject, signal, computed, effect } from '@angular/core';
   import { CartService } from '../../../core/services/cart.service';
   import { ProductColor, ProductSize, getColorHex, formatColor, formatSize } from '../../../core/models/product.model';
   import { ButtonModule } from 'primeng/button';
   import { TooltipModule } from 'primeng/tooltip';
   ```

2. **Agregar signals para gestionar estado local:**
   ```typescript
   // Estado de variantes seleccionadas
   private selectedColorSignal = signal<ProductColor | null>(null);
   private selectedSizeSignal = signal<ProductSize | null>(null);
   private isAddingToCart = signal<boolean>(false);
   
   // Signals públicos computados
   selectedColor = this.selectedColorSignal.asReadonly();
   selectedSize = this.selectedSizeSignal.asReadonly();
   ```

3. **Agregar computed signals para datos derivados:**
   ```typescript
   // Colores únicos disponibles (con stock > 0)
   availableColors = computed(() => {
     const prod = this.product();
     if (!('variants' in prod) || !prod.variants) return [];
     
     const colorsWithStock = prod.variants
       .filter(v => v.stock > 0)
       .map(v => v.color);
     
     return [...new Set(colorsWithStock)];
   });
   
   // Tamaños disponibles según el color seleccionado
   availableSizes = computed(() => {
     const prod = this.product();
     const color = this.selectedColor();
     
     if (!color || !('variants' in prod)) return [];
     
     return prod.variants
       .filter(v => v.color === color && v.stock > 0)
       .map(v => v.size);
   });
   
   // Variante actualmente seleccionada (combinación color + tamaño)
   selectedVariant = computed(() => {
     const prod = this.product();
     const color = this.selectedColor();
     const size = this.selectedSize();
     
     if (!color || !size || !('variants' in prod)) return null;
     
     return prod.variants.find(
       v => v.color === color && v.size === size
     );
   });
   
   // Precio final (base + modificador de variante)
   finalPrice = computed(() => {
     const variant = this.selectedVariant();
     const prod = this.product();
     
     if (variant?.price) {
       return variant.price;
     }
     
     return prod.basePrice;
   });
   
   // Precio formateado
   formattedFinalPrice = computed(() => {
     return new Intl.NumberFormat('es-AR', {
       style: 'currency',
       currency: 'ARS',
       minimumFractionDigits: 0
     }).format(this.finalPrice());
   });
   
   // Verificar si se puede agregar al carrito
   canAddToCart = computed(() => {
     return this.selectedColor() !== null 
       && this.selectedSize() !== null 
       && this.selectedVariant() !== null
       && !this.isAddingToCart();
   });
   ```

4. **Agregar métodos para gestionar selección:**
   ```typescript
   // Seleccionar color
   selectColor(color: ProductColor): void {
     this.selectedColorSignal.set(color);
     
     // Verificar si el tamaño actual sigue disponible
     const availableSizes = this.availableSizes();
     const currentSize = this.selectedSize();
     
     if (currentSize && !availableSizes.includes(currentSize)) {
       // Si el tamaño no está disponible, resetear
       this.selectedSizeSignal.set(null);
     } else if (!currentSize && availableSizes.length > 0) {
       // Auto-seleccionar el primer tamaño disponible
       this.selectedSizeSignal.set(availableSizes[0]);
     }
   }
   
   // Seleccionar tamaño
   selectSize(size: ProductSize): void {
     this.selectedSizeSignal.set(size);
   }
   
   // Obtener hex de color para visualización
   getColorHex(color: ProductColor): string {
     return getColorHex(color);
   }
   
   // Obtener nombre del color
   getColorName(color: ProductColor): string {
     return formatColor(color);
   }
   
   // Formatear tamaño
   formatSize(size: ProductSize): string {
     return formatSize(size);
   }
   ```

5. **Agregar método para agregar al carrito:**
   ```typescript
   private cartService = inject(CartService);
   
   addToCart(event: Event): void {
     event.stopPropagation(); // Prevenir navegación al detalle
     
     const variant = this.selectedVariant();
     const prod = this.product();
     
     if (!variant || !this.canAddToCart()) return;
     
     this.isAddingToCart.set(true);
     
     const request = {
       productId: prod.id,
       variantSKU: variant.sku,
       quantity: 1
     };
     
     const snapshot = {
       name: prod.name,
       image: this.productImage(),
       size: formatSize(variant.size),
       color: formatColor(variant.color),
       price: this.finalPrice()
     };
     
     this.cartService.addItem(request, snapshot).subscribe({
       next: () => {
         this.isAddingToCart.set(false);
         // El CartService ya abre el drawer automáticamente
       },
       error: (error) => {
         console.error('Error agregando al carrito:', error);
         this.isAddingToCart.set(false);
       }
     });
   }
   ```

6. **Agregar effect para auto-selección inicial:**
   ```typescript
   constructor() {
     // Auto-seleccionar primera combinación disponible
     effect(() => {
       const colors = this.availableColors();
       
       if (colors.length > 0 && !this.selectedColor()) {
         this.selectColor(colors[0]);
       }
     });
   }
   ```

### Paso 3: Actualizar HTML del ProductCard

**Archivo:** `src/app/shared/components/product-card/product-card.component.html`

**Cambios a implementar:**

1. **Agregar sección de selectores de variantes (después del precio, antes de los tags):**
   ```html
   <!-- Selectores de Variantes -->
   <div class="variant-selectors mt-3 space-y-3" (click)="$event.stopPropagation()">
     <!-- Selector de Color -->
     @if (availableColors().length > 0) {
       <div>
         <label class="text-xs font-medium text-gray-600 mb-2 block">
           Color: {{ selectedColor() ? getColorName(selectedColor()!) : 'Selecciona' }}
         </label>
         <div class="flex gap-2 flex-wrap">
           @for (color of availableColors(); track color) {
             <button
               type="button"
               (click)="selectColor(color)"
               [pTooltip]="getColorName(color)"
               tooltipPosition="top"
               class="color-swatch"
               [class.selected]="selectedColor() === color"
               [style.backgroundColor]="getColorHex(color)"
             >
               @if (selectedColor() === color) {
                 <i class="pi pi-check text-white text-xs"></i>
               }
             </button>
           }
         </div>
       </div>
     }
     
     <!-- Selector de Tamaño -->
     @if (selectedColor() && availableSizes().length > 0) {
       <div>
         <label class="text-xs font-medium text-gray-600 mb-2 block">
           Tamaño
         </label>
         <div class="flex gap-2 flex-wrap">
           @for (size of availableSizes(); track size) {
             <button
               type="button"
               (click)="selectSize(size)"
               class="size-button"
               [class.selected]="selectedSize() === size"
             >
               {{ formatSize(size) }}
             </button>
           }
         </div>
       </div>
     }
   </div>
   ```

2. **Actualizar sección de precio para mostrar precio final:**
   ```html
   <!-- Precio -->
   <div class="flex items-center justify-between mt-3">
     <div class="flex flex-col">
       @if (selectedVariant() && finalPrice() !== product().basePrice) {
         <span class="text-sm text-gray-400 line-through">
           {{ formattedPrice() }}
         </span>
       }
       <span class="text-2xl font-bold text-primary-600">
         {{ formattedFinalPrice() }}
       </span>
     </div>
   </div>
   ```

3. **Agregar botón "Agregar al Carrito" (después de los selectores):**
   ```html
   <!-- Botón Agregar al Carrito -->
   <div class="mt-3" (click)="$event.stopPropagation()">
     <p-button
       label="Agregar al Carrito"
       icon="pi pi-shopping-cart"
       [disabled]="!canAddToCart()"
       [loading]="isAddingToCart()"
       (onClick)="addToCart($event)"
       styleClass="w-full"
       [severity]="canAddToCart() ? 'primary' : 'secondary'"
     ></p-button>
   </div>
   ```

4. **Mantener el click en el card pero excluir las áreas interactivas:**
   - Ya agregamos `(click)="$event.stopPropagation()"` en los selectores y botón
   - El click en el card principal seguirá navegando al detalle

### Paso 4: Agregar Estilos CSS

**Archivo:** `src/app/shared/components/product-card/product-card.component.css`

**Estilos a agregar:**

```css
/* ========== SELECTORES DE VARIANTES ========== */

/* Contenedor de selectores */
.variant-selectors {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

/* Selector de Color (círculos) */
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-swatch.selected {
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Casos especiales para colores claros */
.color-swatch[style*="background-color: rgb(255, 255, 255)"],
.color-swatch[style*="background-color: #FFFFFF"],
.color-swatch[style*="background-color: #ffffff"] {
  border: 2px solid #d1d5db;
}

.color-swatch[style*="background-color: rgb(255, 255, 255)"].selected,
.color-swatch[style*="background-color: #FFFFFF"].selected,
.color-swatch[style*="background-color: #ffffff"].selected {
  border: 3px solid #3b82f6;
}

/* Selector de Tamaño (botones) */
.size-button {
  min-width: 44px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #4b5563;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #eff6ff;
}

.size-button.selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
}

.size-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}

/* ========== RESPONSIVE ========== */

/* Tablets y móviles */
@media (max-width: 768px) {
  .color-swatch {
    width: 28px;
    height: 28px;
  }
  
  .size-button {
    min-width: 40px;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
}

/* Animación al agregar al carrito */
@keyframes pulse-success {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.adding-to-cart {
  animation: pulse-success 0.5s ease-in-out;
}
```

### Paso 5: Actualizar Imports en el Componente

**Archivo:** `src/app/shared/components/product-card/product-card.component.ts`

**Agregar imports de módulos PrimeNG:**

```typescript
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// En el array de imports del @Component
imports: [
  CommonModule,
  CardModule,
  TagModule,
  ImageModule,
  ButtonModule,    // NUEVO
  TooltipModule    // NUEVO
]
```

### Paso 6: Consideraciones para ProductListItem

**Problema:** `ProductListItem` no incluye el array `variants`, solo información agregada (`totalVariants`, `totalStock`).

**Soluciones:**

**Opción A (Recomendada):** Actualizar el backend para incluir variantes en ProductListItem
- Modificar el endpoint `GET /products/catalog`
- Agregar campo `variants: ProductVariant[]` al DTO de respuesta
- Solo para la vista pública del catálogo

**Opción B:** Deshabilitar selectores si no hay variantes
- En el template, verificar si el producto tiene variantes
- Si es `ProductListItem`, mostrar mensaje "Ver detalles para opciones"
- Solo permitir agregar desde la página de detalle

**Implementación temporal (Opción B):**

```typescript
// En el computed
hasVariants = computed(() => {
  const prod = this.product();
  return 'variants' in prod && Array.isArray(prod.variants);
});
```

```html
<!-- En el template -->
@if (hasVariants()) {
  <!-- Mostrar selectores -->
} @else {
  <p class="text-sm text-gray-500 italic mt-3">
    Ver detalles para seleccionar opciones
  </p>
}
```

### Paso 7: Testing Manual

**Casos de prueba:**

1. **Selección de Variantes:**
   - ✅ Seleccionar color actualiza tamaños disponibles
   - ✅ Cambiar color mantiene tamaño si está disponible
   - ✅ Cambiar color resetea tamaño si no está disponible
   - ✅ Precio se actualiza según variante seleccionada

2. **Agregar al Carrito:**
   - ✅ Botón deshabilitado sin selección completa
   - ✅ Botón habilitado con color y tamaño seleccionados
   - ✅ Loading state mientras se agrega
   - ✅ Drawer se abre automáticamente
   - ✅ Producto aparece en el carrito con variante correcta

3. **Edge Cases:**
   - ✅ Producto sin variantes (mostrar mensaje o deshabilitar)
   - ✅ Producto con una sola variante (auto-seleccionar)
   - ✅ Todas las variantes sin stock
   - ✅ Error al agregar al carrito

4. **UI/UX:**
   - ✅ Colores se visualizan correctamente
   - ✅ Hover states funcionan
   - ✅ Selección visible claramente
   - ✅ Responsive en móvil/tablet/desktop
   - ✅ Click en selectores no navega al detalle

5. **Performance:**
   - ✅ No re-renders innecesarios
   - ✅ Catálogo carga rápido con múltiples cards

### Paso 8: Ajustes de UX Adicionales

**Mejoras opcionales:**

1. **Indicador de Stock Bajo:**
   ```typescript
   isLowStock = computed(() => {
     const variant = this.selectedVariant();
     return variant && variant.stock > 0 && variant.stock <= 5;
   });
   ```
   
   ```html
   @if (isLowStock()) {
     <p class="text-xs text-orange-600 mt-1">
       <i class="pi pi-exclamation-triangle"></i>
       ¡Solo quedan {{ selectedVariant()!.stock }} unidades!
     </p>
   }
   ```

2. **Animación al Agregar:**
   - Agregar clase temporal al hacer click
   - Mostrar ícono de check brevemente

3. **Quick View Modal (Fase Futura):**
   - Botón alternativo "Vista Rápida"
   - Modal con más detalles sin navegar

### Paso 9: Documentación

**Archivos a actualizar:**

1. **README.md** - Agregar sección sobre funcionalidad del catálogo
2. **Comentarios en código** - JSDoc en métodos clave
3. **CHANGELOG** (si existe) - Documentar nueva feature

### Paso 10: Verificación Final

**Checklist antes de considerar completo:**

- [ ] Código TypeScript implementado y funcional
- [ ] Template HTML actualizado con selectores
- [ ] Estilos CSS aplicados correctamente
- [ ] Imports de PrimeNG agregados
- [ ] Manejo de ProductListItem vs Product
- [ ] Testing manual completado
- [ ] Responsive verificado en diferentes dispositivos
- [ ] Accesibilidad básica verificada
- [ ] Código documentado
- [ ] Sin errores de linter
- [ ] Sin warnings de TypeScript
- [ ] Performance aceptable (< 3s para cargar catálogo)

## Notas Técnicas

### Arquitectura de Signals

El uso de signals de Angular proporciona:
- **Reactividad eficiente**: Solo se re-renderizan las partes afectadas
- **Computed memoization**: Los valores derivados se cachean automáticamente
- **Fine-grained updates**: Mejor performance que change detection tradicional

### Gestión de Estado

Estado local en cada card:
- ✅ **Ventaja**: Simplicidad, no necesita state management global
- ✅ **Ventaja**: Cada card es independiente
- ❌ **Desventaja**: Estado se pierde al salir del catálogo
- ❌ **Desventaja**: No sincronizado entre cards del mismo producto

Para una versión avanzada, considerar:
- Guardar selecciones en sessionStorage
- Servicio compartido para recordar preferencias de usuario

### Consideraciones de Backend

Si se opta por **Opción A** (recomendada), coordinar con backend:

**Endpoint a modificar:** `GET /products/catalog`

**Response actual:**
```typescript
{
  data: ProductListItem[];
  meta: PaginationMeta;
}
```

**Response propuesto:**
```typescript
// ProductListItem con variantes
interface ProductListItemWithVariants extends ProductListItem {
  variants: ProductVariant[];
}
```

**Ventajas:**
- Frontend puede mostrar selectores en catálogo
- No necesita llamadas adicionales al backend
- Experiencia de usuario mejorada

**Desventajas:**
- Respuesta ligeramente más grande (pero manejable)
- Requiere cambio en backend

### Alternativas Consideradas

1. **Componente Separado de Variantes:**
   - Crear `VariantSelectorComponent` reutilizable
   - **Pros**: Más modular, reutilizable
   - **Contras**: Más complejidad, más archivos
   - **Decisión**: Implementar en el futuro si se necesita en otros lugares

2. **Modal de Quick Add:**
   - Click abre modal con selectores
   - **Pros**: No cambia diseño del card
   - **Contras**: Paso adicional para el usuario
   - **Decisión**: No implementar por ahora

3. **Hover State con Selectores:**
   - Mostrar selectores solo al hover
   - **Pros**: Card más limpio
   - **Contras**: No funciona en móvil, dificulta UX
   - **Decisión**: No implementar

## Estimación de Esfuerzo

- **Paso 1-2 (TypeScript)**: 2-3 horas
- **Paso 3 (HTML)**: 1-2 horas
- **Paso 4 (CSS)**: 1-2 horas
- **Paso 5-6 (Imports/Ajustes)**: 1 hora
- **Paso 7 (Testing)**: 2-3 horas
- **Paso 8-10 (Mejoras/Docs)**: 1-2 horas

**Total estimado**: 8-13 horas de desarrollo

## Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| ProductListItem sin variantes | Alto | Alta | Implementar Opción B temporal, coordinar con backend para Opción A |
| Performance con muchos productos | Medio | Media | Usar signals, lazy loading, virtual scrolling si es necesario |
| Complejidad en mobile | Medio | Media | Testing exhaustivo en dispositivos móviles |
| Conflicto con navegación al detalle | Bajo | Media | stopPropagation en elementos interactivos |

## Próximos Pasos (Futuro)

1. **Selector de Cantidad:** Permitir elegir cantidad antes de agregar
2. **Wishlist:** Botón de favoritos en el card
3. **Comparador:** Seleccionar productos para comparar
4. **Quick View:** Modal con más detalles
5. **Filtros por Disponibilidad:** Mostrar solo productos con stock
6. **Notificaciones de Restock:** Suscribirse a alertas cuando vuelva stock

---

**Fecha de Creación:** 2025-11-17  
**Versión:** 1.0  
**Estado:** Pendiente de Implementación


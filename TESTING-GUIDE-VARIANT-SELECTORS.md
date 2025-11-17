# Guía de Testing: Selectores de Variantes en Product Cards

## Overview

Esta guía proporciona los pasos para probar manualmente la nueva funcionalidad de selectores de color/tamaño y botón "Agregar al Carrito" en las tarjetas de producto del catálogo.

**Fecha:** 2025-11-17  
**Funcionalidad:** Selectores de Variantes en Product Cards  
**Componente:** `ProductCardComponent`

---

## ⚠️ Prerequisitos

Antes de comenzar el testing, asegurar que:

1. ✅ **Backend actualizado** con el endpoint `GET /products/catalog` devolviendo el array de `variants`
   - Ver: `BACKEND-CHANGES-REQUIRED.md`
2. ✅ **Frontend compilado** sin errores
3. ✅ **Base de datos** con productos que tengan múltiples variantes
4. ✅ **Servidor de desarrollo** corriendo (`npm start`)

---

## 🧪 Casos de Prueba

### 1. Visualización de Selectores de Color

**Objetivo:** Verificar que los colores disponibles se muestren correctamente

#### Pasos:
1. Navegar al catálogo público: `http://localhost:4200/products`
2. Localizar una tarjeta de producto con múltiples colores
3. Verificar la sección "Color" dentro de la tarjeta

#### Verificaciones:
- [ ] Se muestran círculos de color para cada color disponible
- [ ] Los círculos tienen el color correcto (hex codes)
- [ ] El color blanco tiene borde visible (gris claro)
- [ ] Al hacer hover sobre un círculo, se muestra un tooltip con el nombre del color
- [ ] Hay un label que dice "Color: [nombre del color seleccionado]"
- [ ] El primer color está auto-seleccionado al cargar la página

#### Resultado Esperado:
```
✅ Colores visibles como círculos clickeables
✅ Tooltip muestra nombre en español (ej: "Negro", "Blanco")
✅ Auto-selección del primer color disponible
```

---

### 2. Selección de Color

**Objetivo:** Verificar que se pueda seleccionar un color y que actualice los tamaños disponibles

#### Pasos:
1. En una tarjeta de producto, observar el color actualmente seleccionado
2. Click en un color diferente
3. Observar cambios en:
   - Indicador visual del color seleccionado
   - Tamaños disponibles (si cambian)
   - Precio (si hay modificador)

#### Verificaciones:
- [ ] El color clickeado muestra un borde azul más grueso
- [ ] Aparece un ícono de check (✓) en el color seleccionado
- [ ] Los tamaños se actualizan para mostrar solo los disponibles para ese color
- [ ] Si el tamaño previamente seleccionado no está disponible, se resetea
- [ ] Si hay un solo tamaño disponible, se auto-selecciona
- [ ] La transición es suave (animación CSS)

#### Resultado Esperado:
```
✅ Color seleccionado visualmente destacado
✅ Tamaños actualizados dinámicamente
✅ Label "Color:" actualizado con el nuevo color
```

---

### 3. Visualización de Selectores de Tamaño

**Objetivo:** Verificar que los tamaños disponibles se muestren correctamente

#### Pasos:
1. Seleccionar un color en una tarjeta
2. Observar la sección "Tamaño" que aparece debajo
3. Verificar los botones de tamaño

#### Verificaciones:
- [ ] Se muestran botones para cada tamaño disponible (P, M, G, GG)
- [ ] Solo se muestran tamaños con stock > 0 para el color seleccionado
- [ ] Los botones tienen el texto del tamaño claro y legible
- [ ] Si hay auto-selección, el primer tamaño está seleccionado

#### Resultado Esperado:
```
✅ Tamaños mostrados como botones clickeables
✅ Solo tamaños con stock disponible
✅ Diseño consistente con los colores
```

---

### 4. Selección de Tamaño

**Objetivo:** Verificar que se pueda seleccionar un tamaño

#### Pasos:
1. Con un color seleccionado, click en un tamaño disponible
2. Observar cambios visuales
3. Verificar el botón "Agregar al Carrito"

#### Verificaciones:
- [ ] El tamaño clickeado cambia de estilo (fondo azul, texto blanco)
- [ ] Los otros tamaños mantienen su estilo normal
- [ ] El botón "Agregar al Carrito" se habilita (deja de estar gris)
- [ ] Si hay modificador de precio, el precio se actualiza

#### Resultado Esperado:
```
✅ Tamaño seleccionado visualmente destacado
✅ Botón "Agregar al Carrito" habilitado
✅ Precio actualizado si corresponde
```

---

### 5. Actualización de Precio

**Objetivo:** Verificar que el precio se actualice según la variante seleccionada

#### Pasos:
1. Observar el precio base mostrado inicialmente
2. Seleccionar una variante con `priceModifier` diferente de 0
3. Observar los cambios en el precio

#### Verificaciones:
- [ ] Si la variante tiene precio diferente, se muestra el nuevo precio
- [ ] Si el precio cambió, el precio base aparece tachado arriba
- [ ] El formato de precio es correcto (ARS con separador de miles)
- [ ] La transición es clara y visible

#### Resultado Esperado:
```
Ejemplo:
$15.000 (tachado)
$17.500 (en grande, azul)

✅ Precio actualizado correctamente
✅ Precio base visible cuando hay diferencia
```

---

### 6. Indicador de Stock Bajo

**Objetivo:** Verificar que se muestre advertencia cuando el stock es bajo

#### Pasos:
1. Seleccionar una variante con stock ≤ 5 unidades
2. Buscar el mensaje de advertencia

#### Verificaciones:
- [ ] Aparece un mensaje en naranja: "¡Solo quedan X unidades!"
- [ ] El mensaje incluye el ícono de advertencia (⚠️)
- [ ] El texto es legible y no obstruye otros elementos
- [ ] Solo aparece cuando stock ≤ 5

#### Resultado Esperado:
```
⚠️ ¡Solo quedan 3 unidades!

✅ Advertencia visible en productos con stock bajo
```

---

### 7. Botón "Agregar al Carrito" - Estado Deshabilitado

**Objetivo:** Verificar que el botón esté deshabilitado cuando faltan selecciones

#### Pasos:
1. Cargar el catálogo
2. Observar el botón "Agregar al Carrito" en diferentes estados:
   - Solo color seleccionado
   - Sin color ni tamaño
   - Después de cambiar color (si resetea tamaño)

#### Verificaciones:
- [ ] Botón gris (secondary) cuando está deshabilitado
- [ ] Cursor "not-allowed" al hacer hover
- [ ] No se puede hacer click
- [ ] El label del botón sigue siendo visible

#### Resultado Esperado:
```
✅ Botón deshabilitado cuando falta información
✅ Feedback visual claro del estado deshabilitado
```

---

### 8. Botón "Agregar al Carrito" - Estado Habilitado

**Objetivo:** Verificar que el botón se habilite cuando hay color y tamaño seleccionados

#### Pasos:
1. Seleccionar color y tamaño en una tarjeta
2. Observar el botón "Agregar al Carrito"

#### Verificaciones:
- [ ] Botón azul (primary) cuando está habilitado
- [ ] Cursor "pointer" al hacer hover
- [ ] Efecto hover visible (más oscuro)
- [ ] Se puede hacer click

#### Resultado Esperado:
```
✅ Botón habilitado y visualmente atractivo
✅ Hover state funcional
```

---

### 9. Agregar Producto al Carrito

**Objetivo:** Verificar que se agregue el producto al carrito con la variante correcta

#### Pasos:
1. Seleccionar color (ej: Negro) y tamaño (ej: M)
2. Click en "Agregar al Carrito"
3. Observar:
   - Estado de loading
   - Apertura del drawer
   - Contenido del drawer

#### Verificaciones:
- [ ] El botón muestra un spinner de loading mientras procesa
- [ ] El drawer del carrito se abre automáticamente
- [ ] El producto aparece en el drawer con:
  - Nombre correcto
  - Color correcto ("Negro")
  - Tamaño correcto ("M")
  - Precio correcto
  - Cantidad: 1
- [ ] El contador del carrito (badge en header) se actualiza
- [ ] No se navega al detalle del producto

#### Resultado Esperado:
```
✅ Producto agregado al carrito
✅ Drawer abierto mostrando el producto
✅ Información de variante correcta
✅ No navegación al detalle
```

---

### 10. Prevención de Navegación al Detalle

**Objetivo:** Verificar que interactuar con selectores no navegue al detalle

#### Pasos:
1. Click en un selector de color
2. Click en un selector de tamaño
3. Click en el botón "Agregar al Carrito"
4. Click en el espacio vacío de la tarjeta (fuera de selectores/botones)

#### Verificaciones:
- [ ] Click en colores NO navega al detalle
- [ ] Click en tamaños NO navega al detalle
- [ ] Click en botón carrito NO navega al detalle
- [ ] Click en cualquier otra parte SÍ navega al detalle

#### Resultado Esperado:
```
✅ Selectores y botón no activan navegación
✅ Click general en tarjeta sí navega al detalle
```

---

### 11. Modo Vista List (Horizontal)

**Objetivo:** Verificar que los selectores funcionen en modo lista horizontal

#### Pasos:
1. En el catálogo, cambiar a vista "List" (si hay toggle)
2. O encontrar una página que use `viewMode="list"`
3. Verificar todos los pasos anteriores en este modo

#### Verificaciones:
- [ ] Selectores se muestran correctamente en layout horizontal
- [ ] Botón "Agregar" visible a la derecha (versión corta del label)
- [ ] Funcionalidad idéntica al modo grid
- [ ] Responsive en móvil

#### Resultado Esperado:
```
✅ Funcionalidad completa en modo list
✅ Layout adaptado pero funcional
```

---

### 12. Responsive - Mobile

**Objetivo:** Verificar que los selectores funcionen en dispositivos móviles

#### Pasos:
1. Abrir DevTools y cambiar a vista móvil (iPhone 12, 375x667)
2. Navegar al catálogo
3. Verificar selectores de color y tamaño

#### Verificaciones:
- [ ] Círculos de color son más pequeños pero clickeables (28px)
- [ ] Botones de tamaño son más pequeños pero clickeables (min 36px)
- [ ] El botón "Agregar al Carrito" es full-width
- [ ] Labels legibles
- [ ] Espaciado adecuado (no sobrepuestos)
- [ ] Scroll funcional si es necesario

#### Resultado Esperado:
```
✅ Selectores funcionales en móvil
✅ Tamaño de botones adecuado para touch (min 44px)
✅ Layout responsive sin overflow
```

---

### 13. Responsive - Tablet

**Objetivo:** Verificar que los selectores funcionen en tablets

#### Pasos:
1. DevTools → iPad (768x1024)
2. Verificar catálogo

#### Verificaciones:
- [ ] Círculos de color tamaño intermedio (28px)
- [ ] Botones de tamaño legibles
- [ ] Grid de productos adecuado (3-4 columnas)
- [ ] Todo funcional

#### Resultado Esperado:
```
✅ Experiencia óptima en tablet
```

---

### 14. Edge Case: Producto sin Variantes

**Objetivo:** Verificar comportamiento cuando el producto no tiene variantes

#### Pasos:
1. Buscar o crear un producto sin variantes (array vacío o undefined)
2. Ver cómo se muestra en el catálogo

#### Verificaciones:
- [ ] No se muestran selectores de color ni tamaño
- [ ] Aparece mensaje: "Ver detalles para más opciones"
- [ ] No hay botón "Agregar al Carrito"
- [ ] Click en la tarjeta sí navega al detalle

#### Resultado Esperado:
```
Ver detalles para más opciones

✅ Mensaje alternativo mostrado
✅ Navegación al detalle disponible
```

---

### 15. Edge Case: Producto con Una Sola Variante

**Objetivo:** Verificar auto-selección cuando solo hay una opción

#### Pasos:
1. Encontrar producto con una sola variante (ej: solo Negro-M)
2. Observar el comportamiento al cargar

#### Verificaciones:
- [ ] Color auto-seleccionado
- [ ] Tamaño auto-seleccionado
- [ ] Botón "Agregar al Carrito" habilitado inmediatamente
- [ ] Se puede agregar sin interacción previa

#### Resultado Esperado:
```
✅ Variante única auto-seleccionada
✅ Botón habilitado desde el inicio
✅ UX optimizada para caso simple
```

---

### 16. Edge Case: Cambio de Color Resetea Tamaño

**Objetivo:** Verificar que al cambiar color se resetee el tamaño si no está disponible

#### Pasos:
1. Producto con:
   - Negro: P, M, G
   - Blanco: M, G, GG
2. Seleccionar Negro + P
3. Cambiar a Blanco
4. Observar qué pasa con el tamaño

#### Verificaciones:
- [ ] Al cambiar a Blanco, el tamaño P se deselecciona (no disponible)
- [ ] Se auto-selecciona el primer tamaño disponible (M)
- [ ] El botón permanece habilitado
- [ ] Label de "Tamaño" se actualiza

#### Resultado Esperado:
```
✅ Tamaño reseteado cuando no está disponible
✅ Auto-selección inteligente del siguiente disponible
```

---

### 17. Performance: Catálogo con 24 Productos

**Objetivo:** Verificar que la funcionalidad no afecte negativamente el performance

#### Pasos:
1. Cargar catálogo con 24 productos (2 páginas)
2. Abrir DevTools → Performance
3. Grabar mientras se interactúa con selectores

#### Verificaciones:
- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Selección de color responde en < 100ms
- [ ] Selección de tamaño responde en < 100ms
- [ ] No hay lags o freezes
- [ ] Memory usage estable

#### Resultado Esperado:
```
✅ Performance aceptable
✅ No degradación visible
```

---

### 18. Multiple Cards: Independencia de Estado

**Objetivo:** Verificar que cada tarjeta mantenga su propio estado

#### Pasos:
1. En el catálogo, seleccionar color/tamaño en la tarjeta #1
2. Seleccionar color/tamaño diferente en la tarjeta #2
3. Verificar que ambas mantengan sus selecciones independientes

#### Verificaciones:
- [ ] Tarjeta #1 mantiene su selección
- [ ] Tarjeta #2 mantiene su selección
- [ ] No hay interferencia entre cards
- [ ] Se pueden agregar ambos al carrito correctamente

#### Resultado Esperado:
```
✅ Cada tarjeta es independiente
✅ Sin conflictos de estado entre cards
```

---

### 19. Agregar Múltiples Productos

**Objetivo:** Verificar que se puedan agregar varios productos desde el catálogo

#### Pasos:
1. Agregar producto #1 (Negro, M) al carrito
2. Esperar a que se complete (drawer abre)
3. Cerrar drawer
4. Agregar producto #2 (Blanco, G) al carrito
5. Verificar drawer

#### Verificaciones:
- [ ] Ambos productos aparecen en el carrito
- [ ] Cantidades correctas (1 de cada uno)
- [ ] Variantes correctas
- [ ] Subtotal correcto
- [ ] No hay duplicados incorrectos

#### Resultado Esperado:
```
Carrito:
- Producto #1 (Negro, M) x1 - $15.000
- Producto #2 (Blanco, G) x1 - $18.000
Subtotal: $33.000

✅ Múltiples productos agregados correctamente
```

---

### 20. Usuario Anónimo vs Autenticado

**Objetivo:** Verificar que funcione tanto para usuarios guest como autenticados

#### Pasos Parte A (Usuario Anónimo):
1. Abrir ventana de incógnito
2. Navegar al catálogo (sin login)
3. Agregar producto al carrito
4. Verificar que se guarde en localStorage

#### Verificaciones:
- [ ] Funcionalidad completa sin login
- [ ] Producto se agrega a carrito guest (localStorage)
- [ ] Drawer muestra el producto
- [ ] Al recargar página, producto persiste

#### Pasos Parte B (Usuario Autenticado):
1. Hacer login
2. Agregar producto al carrito
3. Verificar que se sincronice con el backend

#### Verificaciones:
- [ ] Funcionalidad completa con login
- [ ] Producto se agrega al carrito del servidor
- [ ] Si había productos guest, se hace merge
- [ ] Al recargar, productos persisten (desde servidor)

#### Resultado Esperado:
```
✅ Funciona para usuarios anónimos
✅ Funciona para usuarios autenticados
✅ Merge de carrito guest → servidor funcional
```

---

## 📋 Checklist Resumen

### Funcionalidad Core
- [ ] Colores se muestran correctamente
- [ ] Colores son seleccionables
- [ ] Tamaños se muestran según color seleccionado
- [ ] Tamaños son seleccionables
- [ ] Precio se actualiza correctamente
- [ ] Indicador de stock bajo funciona
- [ ] Botón "Agregar al Carrito" habilita/deshabilita correctamente
- [ ] Agregar al carrito funciona
- [ ] Drawer se abre automáticamente
- [ ] Producto correcto aparece en carrito

### UX/UI
- [ ] Diseño consistente con el resto de la app
- [ ] Transiciones suaves
- [ ] Feedback visual claro
- [ ] Tooltips funcionan
- [ ] Hover states correctos

### Responsive
- [ ] Mobile (< 640px) funcional
- [ ] Tablet (640-1024px) funcional
- [ ] Desktop (> 1024px) funcional

### Edge Cases
- [ ] Producto sin variantes manejado
- [ ] Producto con una variante auto-selecciona
- [ ] Cambio de color resetea tamaño si es necesario
- [ ] Múltiples productos independientes

### Performance
- [ ] Carga rápida (< 3s)
- [ ] Interacciones responsive (< 100ms)
- [ ] Sin memory leaks

### Integración
- [ ] Usuario anónimo funciona
- [ ] Usuario autenticado funciona
- [ ] Merge de carritos funciona

---

## 🐛 Reporte de Bugs

Si encuentras algún problema durante el testing, documentarlo así:

### Template de Bug Report

```markdown
**Bug:** [Título descriptivo]

**Severidad:** 🔴 Crítico / 🟡 Alto / 🟢 Medio / ⚪ Bajo

**Pasos para Reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Esperado:**
[Qué debería pasar]

**Resultado Actual:**
[Qué pasa realmente]

**Screenshots:**
[Si aplica]

**Ambiente:**
- Browser: Chrome 120
- Dispositivo: Desktop / Mobile
- Usuario: Anónimo / Autenticado

**Logs de Consola:**
```
[Errores de consola si hay]
```
```

---

## ✅ Criterio de Aceptación

La funcionalidad se considera **COMPLETA** cuando:

1. ✅ Todos los casos de prueba básicos (1-10) pasan
2. ✅ Funciona en al menos 2 navegadores (Chrome + Safari/Firefox)
3. ✅ Funciona en mobile y desktop
4. ✅ No hay errores críticos de UI
5. ✅ Performance aceptable (< 3s carga, < 100ms interacciones)
6. ✅ No hay errores en consola del navegador
7. ✅ Integración con carrito funcional

---

## 📞 Soporte

Para reportar problemas o dudas sobre el testing:
- Revisar `PLAN-MEJORAS-PRODUCT-CARD.md` para detalles de implementación
- Revisar `BACKEND-CHANGES-REQUIRED.md` si hay problemas de integración

**Autor:** Equipo Frontend  
**Fecha:** 2025-11-17


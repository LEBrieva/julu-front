# 🎨 Guía de Estilos - E-Commerce Frontend

Esta guía documenta las mejores prácticas para estilos en este proyecto para evitar problemas de diseño.

## 📚 Tabla de Contenidos
1. [Stack de Estilos](#stack-de-estilos)
2. [Jerarquía de Estilos](#jerarquía-de-estilos)
3. [Trabajando con PrimeNG](#trabajando-con-primeng)
4. [Reglas de Oro](#reglas-de-oro)
5. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 🏗️ Stack de Estilos

### 1. **PrimeNG 20.2.0** (Componentes UI)
- Biblioteca de componentes enterprise-grade
- Tiene su propio sistema de temas (Aura)
- Priorizar sus clases y configuraciones oficiales

### 2. **TailwindCSS 3.4.18** (Utilidades)
- Para layout, spacing, colores
- Solo en templates HTML, NO en archivos CSS de componentes
- Usar para elementos custom, no para componentes de PrimeNG

### 3. **CSS Estándar** (Componentes específicos)
- Para estilos únicos del componente
- Sin `@apply` de Tailwind (causa problemas de compilación)
- CSS vanilla puro

---

## 📊 Jerarquía de Estilos

### Orden de especificidad (de menor a mayor):
```
1. Estilos globales (styles.css)
2. Tema de PrimeNG (Aura)
3. Clases de Tailwind
4. CSS del componente
5. Estilos inline
6. !important (❌ EVITAR)
```

### ✅ Estrategia correcta:
1. **Primero**: Buscar clase de PrimeNG (ej: `.p-password-fluid`)
2. **Segundo**: Usar Tailwind para layout/spacing
3. **Tercero**: CSS del componente para estilos únicos
4. **Último recurso**: `::ng-deep` (solo si es necesario)
5. **NUNCA**: `!important` (salvo casos extremos documentados)

---

## 🎯 Trabajando con PrimeNG

### ❌ INCORRECTO (lo que NO hacer):

```html
<!-- Mal: Peleando contra PrimeNG -->
<p-password
  [style]="{'width': '100%'}"
  styleClass="custom-password"
/>
```

```css
/* Mal: Usando !important para sobrescribir */
:host ::ng-deep .custom-password {
  width: 100% !important;
}
```

### ✅ CORRECTO (lo que SÍ hacer):

```html
<!-- Bien: Usando clases oficiales de PrimeNG -->
<p-password
  styleClass="p-password-fluid"
  [toggleMask]="true"
  [feedback]="false"
/>
```

**Sin CSS adicional necesario** - PrimeNG ya lo maneja.

---

## 🔍 Clases Útiles de PrimeNG 20

### Inputs y Formularios:
```html
<!-- Input de texto full-width -->
<input pInputText class="w-full" />

<!-- Password full-width -->
<p-password styleClass="p-password-fluid" />

<!-- Dropdown full-width -->
<p-dropdown styleClass="w-full" />

<!-- Button full-width -->
<p-button styleClass="w-full" />
```

### Mensajes y Notificaciones:
```html
<!-- Toast global (ya configurado en app.component.html) -->
<p-toast />

<!-- Mensaje inline -->
<p-message severity="error" text="Error message" />
```

### Layouts:
```html
<!-- Card -->
<p-card>
  <ng-template pTemplate="header">Header</ng-template>
  <ng-template pTemplate="content">Content</ng-template>
</p-card>
```

---

## ⚠️ Reglas de Oro

### 1. **Busca primero en la documentación**
Antes de escribir CSS custom:
- [PrimeNG Components](https://primeng.org/components)
- Buscar en la sección "Styling" de cada componente
- Revisar ejemplos de código

### 2. **Evita `!important` a toda costa**
Si necesitas `!important`, probablemente estás haciendo algo mal.

**Excepciones válidas:**
- Sobrescribir estilos inline de librerías de terceros (último recurso)
- Utility classes globales
- Estilos de accesibilidad críticos

**Documentar siempre:**
```css
/*
 * NOTA: Usando !important porque [razón específica]
 * Alternativas evaluadas: [lista de alternativas que no funcionaron]
 */
.clase {
  property: value !important;
}
```

### 3. **No uses `@apply` en archivos CSS de componentes**
```css
/* ❌ NO hacer */
.mi-clase {
  @apply flex items-center;
}

/* ✅ SÍ hacer */
.mi-clase {
  display: flex;
  align-items: center;
}
```

**Razón**: Tailwind no escanea archivos `.css` de componentes, causando que las clases no se generen.

### 4. **`::ng-deep` solo cuando sea absolutamente necesario**
```css
/* Usar solo para componentes de terceros */
:host ::ng-deep .p-component-internal {
  /* estilos */
}
```

**Nota**: `::ng-deep` está deprecated, pero es la única forma de estilizar componentes encapsulados de PrimeNG.

---

## 🎨 Casos de Uso Comunes

### 1. Input full-width
```html
<!-- Con PrimeNG -->
<input pInputText class="w-full" />

<!-- Sin PrimeNG -->
<input class="w-full px-3 py-2 border rounded" />
```

### 2. Password con toggle
```html
<p-password
  formControlName="password"
  styleClass="p-password-fluid"
  [toggleMask]="true"
  [feedback]="false"
/>
```

### 3. Botón full-width con loading
```html
<p-button
  type="submit"
  label="Enviar"
  icon="pi pi-check"
  [loading]="isLoading()"
  styleClass="w-full"
/>
```

### 4. Layout centrado
```html
<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="w-full max-w-md">
    <!-- Contenido -->
  </div>
</div>
```

### 5. Formulario con espaciado
```html
<form class="space-y-4">
  <div class="form-field">
    <label class="block text-sm font-medium text-gray-700">Email</label>
    <input pInputText class="w-full" />
  </div>
</form>
```

---

## 🐛 Debugging de Estilos

### Si un componente no se ve bien:

1. **Inspeccionar en Chrome DevTools**
   - Clic derecho → Inspeccionar
   - Ver qué clases se están aplicando
   - Ver si hay estilos inline sobrescribiendo

2. **Verificar documentación de PrimeNG**
   - ¿Hay una clase oficial para esto?
   - ¿Hay ejemplos en la documentación?

3. **Verificar orden de imports en styles.css**
   ```css
   /* Orden correcto: */
   @import "primeicons/primeicons.css";  /* 1. Icons */
   @tailwind base;                        /* 2. Tailwind base */
   @tailwind components;                   /* 3. Tailwind components */
   @tailwind utilities;                    /* 4. Tailwind utilities */
   ```

4. **Limpiar cache si es necesario**
   ```bash
   rm -rf dist .angular
   npm start
   ```

---

## 📝 Checklist antes de commit

- [ ] ¿Revisé la documentación de PrimeNG primero?
- [ ] ¿Estoy usando clases oficiales de PrimeNG?
- [ ] ¿Evité usar `!important`?
- [ ] ¿Documenté cualquier hack o workaround?
- [ ] ¿El componente es responsive?
- [ ] ¿Los estilos están encapsulados en el componente?
- [ ] ¿Funciona correctamente después de recargar la página?

---

## 🔗 Referencias

- [PrimeNG Documentation](https://primeng.org)
- [PrimeNG Theming](https://primeng.org/theming)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [CSS Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
- [Angular Component Styles](https://angular.dev/guide/components/styling)

---

**Última actualización**: 2025-10-14
**Mantenido por**: Equipo de desarrollo

---

## 🎯 TL;DR (Resumen Ejecutivo)

1. ✅ Usa clases de PrimeNG (ej: `p-password-fluid`)
2. ✅ Tailwind para layout en HTML
3. ✅ CSS vanilla en archivos `.css` de componentes
4. ❌ NO usar `@apply` en CSS de componentes
5. ❌ NO usar `!important` (salvo excepciones documentadas)
6. ❌ NO pelear contra las librerías, trabajar con ellas
7. 📖 SIEMPRE consultar documentación primero

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ProductListComponent - Catálogo público de productos
 *
 * PLACEHOLDER: Este componente será implementado en la FASE 8
 * Por ahora solo muestra un mensaje temporal
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <i class="pi pi-shopping-bag text-6xl text-gray-400 mb-4"></i>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Catálogo de Productos</h1>
        <p class="text-gray-600">Esta página será implementada en la FASE 8</p>
        <p class="text-sm text-gray-500 mt-4">(Componente placeholder)</p>
      </div>
    </div>
  `
})
export class ProductListComponent {}

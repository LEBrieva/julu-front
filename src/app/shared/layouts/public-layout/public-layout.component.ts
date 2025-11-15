import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';

/**
 * Layout público de la tienda
 *
 * ESTRUCTURA:
 * - Header: Logo, navegación, carrito, user menu
 * - Content: <router-outlet> para rutas públicas (home, products, etc.)
 *
 * USADO EN:
 * - Home (/)
 * - Catálogo de productos (/products)
 * - Detalle de producto (/products/:id) - FASE 8c
 * - Cualquier otra página pública
 *
 * NO incluye sidebar (es solo para tienda pública)
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {}

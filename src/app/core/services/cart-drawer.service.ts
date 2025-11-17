import { Injectable, signal } from '@angular/core';

/**
 * CartDrawerService
 *
 * Servicio para controlar la apertura/cierre del CartDrawer desde cualquier parte de la app.
 * Utiliza Signals para reactividad.
 */
@Injectable({
  providedIn: 'root'
})
export class CartDrawerService {
  // Signal para controlar la visibilidad del drawer
  private isOpenSignal = signal(false);

  // Readonly signal expuesto públicamente
  readonly isOpen = this.isOpenSignal.asReadonly();

  /**
   * Abre el drawer
   */
  open(): void {
    this.isOpenSignal.set(true);
  }

  /**
   * Cierra el drawer
   */
  close(): void {
    this.isOpenSignal.set(false);
  }

  /**
   * Alterna el estado del drawer
   */
  toggle(): void {
    this.isOpenSignal.update(value => !value);
  }
}


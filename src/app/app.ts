import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './core/services/auth.service';

/**
 * App Component - Componente raíz de la aplicación
 *
 * CONCEPTOS:
 * - OnInit: Lifecycle hook que se ejecuta después de crear el componente
 *   Similar a un constructor, pero para lógica de inicialización
 * - ToastModule: Componente de PrimeNG que muestra las notificaciones globales
 *   Se coloca aquí para que esté disponible en toda la app
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],  // ⭐ Agregar ToastModule para notificaciones
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private authService = inject(AuthService);

  protected title = 'ecommerce-front';

  /**
   * ngOnInit se ejecuta cuando el componente se inicializa
   * Es el lugar ideal para restaurar la sesión si existe un token guardado
   */
  ngOnInit(): void {
    // Intentar restaurar la sesión del usuario si hay token guardado
    this.authService.initializeAuth();
  }
}

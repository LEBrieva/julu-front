import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * AdminDashboardComponent - Panel de administración
 *
 * PLACEHOLDER: Este componente será implementado en la FASE 4
 * Por ahora solo muestra un mensaje temporal y permite logout
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header simple -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">
            <i class="pi pi-shield text-indigo-600"></i>
            Panel de Administración
          </h1>
          <div class="flex items-center gap-4">
            <p class="text-sm text-gray-600">
              Bienvenido, <strong>{{ currentUser()?.email }}</strong>
            </p>
            <button
              (click)="onLogout()"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              <i class="pi pi-sign-out"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <!-- Contenido -->
      <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="text-center py-12">
          <i class="pi pi-cog text-6xl text-gray-400 mb-4"></i>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Dashboard Admin</h2>
          <p class="text-gray-600">Esta página será implementada en la FASE 4</p>
          <p class="text-sm text-gray-500 mt-4">(Componente placeholder)</p>

          <div class="mt-8 bg-white p-6 rounded-lg shadow max-w-md mx-auto">
            <h3 class="text-lg font-semibold mb-4">Próximas implementaciones:</h3>
            <ul class="text-left space-y-2 text-gray-700">
              <li><i class="pi pi-check-circle text-green-500"></i> FASE 3: Login ✓</li>
              <li><i class="pi pi-circle text-gray-400"></i> FASE 4: Admin Layout</li>
              <li><i class="pi pi-circle text-gray-400"></i> FASE 5: CRUD Productos</li>
              <li><i class="pi pi-circle text-gray-400"></i> FASE 6: Gestión Órdenes</li>
              <li><i class="pi pi-circle text-gray-400"></i> FASE 7: Gestión Usuarios</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Exponer currentUser para el template
  currentUser = this.authService.currentUser;

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout exitoso');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Error en logout:', error);
        // Aunque falle, redirigir al login (clearSession ya se ejecutó)
        this.router.navigate(['/login']);
      }
    });
  }
}

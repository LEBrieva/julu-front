import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AdminDashboardComponent - Panel de administración
 *
 * NOTA: Este componente se renderiza dentro del AdminLayoutComponent,
 * por lo que NO necesita header ni logout (ya están en el layout)
 *
 * PLACEHOLDER: Contenido real será implementado en fases futuras
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Título de la página -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="pi pi-th-large"></i>
          Dashboard
        </h1>
      </div>

      <!-- Contenido -->
      <div class="dashboard-content">
        <div class="placeholder-message">
          <i class="pi pi-cog"></i>
          <h2>Panel de Administración</h2>
          <p>El contenido del dashboard será implementado en próximas fases</p>
        </div>

        <div class="roadmap-card">
          <h3>Roadmap de Desarrollo</h3>
          <ul class="roadmap-list">
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 3: Sistema de Login</span>
            </li>
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 4: Admin Layout</span>
            </li>
            <li>
              <i class="pi pi-circle"></i>
              <span>FASE 5: CRUD Productos</span>
            </li>
            <li>
              <i class="pi pi-circle"></i>
              <span>FASE 6: Gestión de Órdenes</span>
            </li>
            <li>
              <i class="pi pi-circle"></i>
              <span>FASE 7: Gestión de Usuarios</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #212529;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
    }

    .page-title i {
      color: var(--p-primary-color);
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .placeholder-message {
      text-align: center;
      padding: 3rem 1rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .placeholder-message i {
      font-size: 4rem;
      color: #adb5bd;
      margin-bottom: 1rem;
      display: block;
    }

    .placeholder-message h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #212529;
      margin: 0 0 0.5rem 0;
    }

    .placeholder-message p {
      color: #6c757d;
      margin: 0;
    }

    .roadmap-card {
      background-color: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }

    .roadmap-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #212529;
      margin: 0 0 1rem 0;
    }

    .roadmap-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .roadmap-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #495057;
    }

    .roadmap-list li i {
      font-size: 1.25rem;
    }

    .roadmap-list li.completed {
      color: #198754;
    }

    .roadmap-list li.completed i {
      color: #198754;
    }

    .roadmap-list li:not(.completed) i {
      color: #adb5bd;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-title {
        font-size: 1.5rem;
      }

      .placeholder-message {
        padding: 2rem 1rem;
      }

      .placeholder-message i {
        font-size: 3rem;
      }

      .placeholder-message h2 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class AdminDashboardComponent {
  // Sin lógica por ahora, solo un placeholder
}

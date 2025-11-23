import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AdminDashboardComponent - Painel de administração
 *
 * NOTA: Este componente se renderiza dentro do AdminLayoutComponent,
 * por lo que NO necesita header ni logout (já estão no layout)
 *
 * PLACEHOLDER: Conteúdo real será implementado em fases futuras
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
          Painel
        </h1>
      </div>

      <!-- Contenido -->
      <div class="dashboard-content">
        <div class="placeholder-message">
          <i class="pi pi-cog"></i>
          <h2>Painel de Administração</h2>
          <p>O conteúdo do painel será implementado nas próximas fases</p>
        </div>

        <div class="roadmap-card">
          <h3>Roadmap de Desenvolvimento</h3>
          <ul class="roadmap-list">
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 3: Sistema de Login</span>
            </li>
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 4: Admin Layout com Lazy Loading</span>
            </li>
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 5: CRUD de Produtos</span>
              <small class="text-red-400">(Faltam as imagens, adicionar mais tarde)</small>
            </li>
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 6: Gestão de Pedidos</span>
            </li>
            <li class="completed">
              <i class="pi pi-check-circle"></i>
              <span>FASE 7: Gestão de Usuários</span>
            </li>
            <li>
              <i class="pi pi-circle"></i>
              <span>FASE 8: Catálogo Público</span>
            </li>
            <li>
              <i class="pi pi-circle"></i>
              <span>FASE 9: Carrinho e Checkout</span>
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
  // Sem lógica por enquanto, apenas um placeholder
}

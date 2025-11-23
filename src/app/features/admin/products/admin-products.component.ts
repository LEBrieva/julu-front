import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services and models
import { ProductService } from '../../../core/services/product.service';
import {
  ProductListItem,
  ProductStatus,
  formatEnumValue,
  getStatusSeverity
} from '../../../core/models/product.model';
import { PaginationInfo } from '../../../core/models/api-response.model';

/**
 * AdminProductsComponent - Lista de productos (Admin)
 *
 * Funcionalidades:
 * - DataTable con paginación
 * - Búsqueda por texto
 * - Activar/Desactivar productos (no se eliminan)
 * - Navegación a formulario de crear/editar
 */
@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  // Services
  private productService = inject(ProductService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // State
  products: ProductListItem[] = [];
  loading = false;
  searchTerm = '';

  // Dialog destacado - mostrar nota solo cuando se está activando
  showDestacadoNote = false;

  // Para headless dialog de activar/desactivar
  pendingStatusChange: { productName: string; action: string } | null = null;

  // Pagination
  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 10;
  first = 0; // Índice del primer registro en la tabla (para resetear paginación)
  pagination: PaginationInfo | null = null;

  // Helper functions (para usar en template)
  formatEnumValue = formatEnumValue;
  getStatusSeverity = getStatusSeverity;
  ProductStatus = ProductStatus;

  ngOnInit(): void {
    // Resetear estado al inicializar (importante para cuando se vuelve a esta ruta)
    this.searchTerm = '';
    this.currentPage = 1;
    this.first = 0;
    this.products = [];
    this.totalRecords = 0;
    // La tabla disparará onLazyLoad automáticamente
  }

  /**
   * Carrega produtos com paginação e filtros
   */
  loadProducts(page: number, rows: number): void {
    this.loading = true;

    const filters = {
      page: page,
      limit: rows,
      search: this.searchTerm || undefined
    };

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.data;
        this.pagination = response.pagination;
        this.totalRecords = response.pagination.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar produtos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar os produtos. Tente novamente.'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Trata o evento de lazy load da PrimeNG Table
   * Este método é disparado automaticamente quando:
   * - A tabela é inicializada
   * - Muda a página
   * - Muda o número de linhas por página
   * - A tabela é resetada (first muda)
   */
  onPageChange(event: any): void {
    // Validar que event.page exista (pode ser undefined no primeiro carregamento)
    const page = (event.page !== undefined ? event.page : 0) + 1; // PrimeNG usa índice 0, backend usa 1
    const rows = event.rows || this.rowsPerPage;
    const first = event.first !== undefined ? event.first : 0;

    this.first = first;
    this.currentPage = page;
    this.rowsPerPage = rows;

    this.loadProducts(page, rows);
  }

  /**
   * Trata a busca por texto
   * Reseta a paginação e força recarga
   */
  onSearch(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadProducts(1, this.rowsPerPage);
  }

  /**
   * Limpa o filtro de busca
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.first = 0;
    this.currentPage = 1;
    this.loadProducts(1, this.rowsPerPage);
  }

  /**
   * Navega para o formulário de criar produto
   */
  createProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  /**
   * Navega para o formulário de editar produto
   */
  editProduct(product: ProductListItem): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  /**
   * Ver detalhes do produto (navega para o modo visualização)
   */
  viewProduct(product: ProductListItem): void {
    this.router.navigate(['/admin/products', product.id]);
  }

  /**
   * Toggle status do produto (ativar/desativar)
   * NOTA: Produtos não são deletados, apenas o status é alterado
   */
  toggleProductStatus(product: ProductListItem): void {
    const isActive = product.status === ProductStatus.ACTIVE;
    const action = isActive ? 'desativar' : 'ativar';
    const actionCaps = isActive ? 'Desativar' : 'Ativar';

    // Guardar informação da alteração para o headless dialog
    this.pendingStatusChange = {
      productName: product.name,
      action: actionCaps
    };

    this.confirmationService.confirm({
      key: 'toggleStatus',
      message: `Tem certeza que deseja ${action} o produto?`,
      header: `${actionCaps} Produto`,
      icon: isActive ? 'pi pi-times-circle' : 'pi pi-check-circle',
      acceptLabel: actionCaps,
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loading = true;

        const action$ = isActive
          ? this.productService.deactivateProduct(product.id)
          : this.productService.activateProduct(product.id);

        action$.subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Produto ${isActive ? 'desativado' : 'ativado'} com sucesso`
            });
            // Recarregar lista mantendo paginação atual
            this.loadProducts(this.currentPage, this.rowsPerPage);
          },
          error: (error) => {
            console.error('Erro ao alterar status do produto:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível alterar o status do produto. Tente novamente.'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  /**
   * Toggle status de destaque do produto
   * Valida que o limite de 12 produtos em destaque não seja excedido (validação server-side)
   */
  onToggleDestacado(product: ProductListItem): void {
    const isDestacado = product.destacado;
    const action = isDestacado ? 'remover dos destaques' : 'marcar como destaque';
    const actionCaps = isDestacado ? 'Remover dos Destaques' : 'Marcar como Destaque';

    // Mostrar nota apenas quando se está ativando (marcar como destaque)
    this.showDestacadoNote = !isDestacado;

    this.confirmationService.confirm({
      key: 'destacado',
      message: `Tem certeza que deseja ${action} o produto "${product.name}"?`,
      header: actionCaps,
      icon: isDestacado ? 'pi pi-star-fill' : 'pi pi-star',
      acceptLabel: 'Confirmar',
      accept: () => {
        this.loading = true;

        this.productService.toggleDestacado(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Produto ${isDestacado ? 'removido dos destaques' : 'marcado como destaque'} com sucesso`
            });
            // Recarregar lista mantendo paginação atual
            this.loadProducts(this.currentPage, this.rowsPerPage);
          },
          error: (error) => {
            console.error('Erro ao alterar status de destaque:', error);

            // Tratamento específico do erro de limite alcançado
            const errorMessage = error.error?.message || error.message;
            const isLimitError = errorMessage?.includes('Máximo de produtos em destaque alcançado');

            this.messageService.add({
              severity: 'error',
              summary: isLimitError ? 'Limite Alcançado' : 'Erro',
              detail: isLimitError
                ? 'Já há 12 produtos em destaque. Desative outro produto primeiro.'
                : 'Não foi possível alterar o status de destaque. Tente novamente.'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  /**
   * Determina se o botão de toggle deve mostrar "Ativar" ou "Desativar"
   */
  getToggleButtonLabel(status: string): string {
    return status === ProductStatus.ACTIVE ? 'Desativar' : 'Ativar';
  }

  /**
   * Determina o ícone do botão de toggle
   */
  getToggleButtonIcon(status: string): string {
    return status === ProductStatus.ACTIVE ? 'pi pi-times-circle' : 'pi pi-check-circle';
  }

  /**
   * Determina a severidade do botão de toggle
   */
  getToggleButtonSeverity(status: string): 'success' | 'danger' {
    return status === ProductStatus.ACTIVE ? 'danger' : 'success';
  }
}

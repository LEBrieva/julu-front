import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductListItem } from '../../../core/models/product.model';
import { getErrorMessage } from '../../utils/form-errors.util';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Popover } from 'primeng/popover';
import { ConfirmationService, MessageService } from 'primeng/api';

/**
 * Header público da loja
 *
 * CARACTERÍSTICAS:
 * - Logo clicável para a página inicial
 * - Navegação: Início, Produtos
 * - Ícone de carrinho com badge (preparado para FASE 9)
 * - Menu de usuário se está logado (avatar + dropdown)
 * - Botão "Entrar" se NÃO está logado
 * - Responsivo com menu hamburger em mobile
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    AvatarModule,
    ConfirmPopupModule,
    InputTextModule,
    PasswordModule,
    Popover
  ],
  providers: [ConfirmationService],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.css'
})
export class PublicHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cartDrawerService = inject(CartDrawerService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  // Público para acesso no template
  confirmationService = inject(ConfirmationService);

  // Signals
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  isAdmin = this.authService.isAdmin;
  loadingLogin = signal(false);
  searchVisible = signal(false);
  searchResults = signal<ProductListItem[]>([]);
  searchLoading = signal(false);

  // Badge do carrinho (reativo)
  cartItemsCount = this.cartService.totalItems;

  // Formulários
  loginForm: FormGroup;
  searchControl = new FormControl('');

  // Inscrições
  private searchSubscription?: Subscription;

  // ViewChild para o input de busca
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Helper para erros de validação
  getErrorMessage = getErrorMessage;

  constructor() {
    // Inicializar formulário de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Configurar busca em tempo real com debounce
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        tap((query) => {
          // Ativar carregamento IMEDIATAMENTE se há texto válido (antes do debounce)
          if (query && query.trim().length > 0) {
            this.searchLoading.set(true);
          }
        }),
        debounceTime(300), // Aguardar 300ms após o usuário parar de digitar
        distinctUntilChanged(), // Emitir apenas se o valor mudou
        switchMap((query) => {
          // Se a query está vazia, limpar resultados
          if (!query || query.trim().length === 0) {
            this.searchResults.set([]);
            this.searchLoading.set(false);
            return of({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
          }

          // Chamar o serviço de busca (catálogo público)
          return this.productService.getPublicCatalog({
            search: query.trim(),
            page: 1,
            limit: 8 // Limitar a 8 resultados
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.searchResults.set(response.data);
          this.searchLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao buscar produtos:', error);
          this.searchResults.set([]);
          this.searchLoading.set(false);
        }
      });

    // Listener para fechar modal com ESC
    document.addEventListener('keydown', this.handleEscKey.bind(this));
  }

  ngOnDestroy(): void {
    // Limpar inscrição ao destruir o componente
    this.searchSubscription?.unsubscribe();

    // Limpar listener de ESC
    document.removeEventListener('keydown', this.handleEscKey.bind(this));
  }

  /**
   * Lidar com a tecla ESC para fechar modal
   */
  private handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.searchVisible()) {
      this.closeSearchModal();
    }
  }

  /**
   * Navegar para o perfil do usuário (FASE 11)
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navegar para a aba de pedidos no perfil do usuário
   */
  goToOrders(): void {
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  /**
   * Navegar para o painel admin (somente se é admin)
   */
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Ir para a página de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Abrir o drawer do carrinho ou navegar para /cart se já estamos lá
   */
  goToCart(): void {
    const currentUrl = this.router.url;

    // Se já estamos em /cart, não fazer nada (já estamos vendo o carrinho)
    if (currentUrl.startsWith('/cart')) {
      return;
    }

    // Se estamos em checkout, navegar para /cart (não abrir drawer)
    if (currentUrl.startsWith('/checkout')) {
      this.router.navigate(['/cart']);
      return;
    }

    // Em qualquer outra página, abrir o drawer
    this.cartDrawerService.open();
  }

  /**
   * Logout do sistema
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erro ao fazer logout:', error);
        // Forçar logout local mesmo que a requisição falhe
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Obter iniciais do usuário para o avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';

    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';

    return firstInitial + lastInitial || 'U';
  }

  /**
   * Abrir popup de login
   */
  openLoginPopup(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '', // Lidamos com isso no template customizado
      acceptVisible: false, // Ocultar botão de aceitar
      rejectVisible: false, // Ocultar botão de rejeitar
      closable: true // Permitir fechar com X ou ESC
    });
  }

  /**
   * Manipulador do envio do formulário de login
   */
  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loadingLogin.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loadingLogin.set(false);

        // Fechar popup
        this.confirmationService.close();

        // Resetar formulário
        this.loginForm.reset();

        // Mostrar toast de boas-vindas
        this.messageService.add({
          severity: 'success',
          summary: 'Bem-vindo',
          detail: `Olá ${response.user.firstName}!`,
          life: 3000
        });

        // Permanecer na página atual (NÃO redirecionar)
      },
      error: (error) => {
        this.loadingLogin.set(false);
        // O error.interceptor já mostrou o toast de erro
      }
    });
  }

  /**
   * Abrir modal de busca e focar no input
   */
  openSearchModal(): void {
    this.searchVisible.set(true);

    // Aguardar a atualização do DOM e focar no input
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 0);
  }

  /**
   * Fechar modal de busca e limpar estado
   */
  closeSearchModal(): void {
    this.searchVisible.set(false);
    this.searchControl.setValue('', { emitEvent: false }); // Não emitir evento para evitar busca
    this.searchResults.set([]);
    this.searchLoading.set(false);
  }

  /**
   * Navegar para detalhe do produto e fechar modal
   */
  goToProduct(productId: string): void {
    this.closeSearchModal();
    this.router.navigate(['/products', productId]);
  }

  /**
   * Ver todos os resultados em /products com o termo de busca
   */
  viewAllResults(): void {
    const searchTerm = this.searchControl.value;
    if (searchTerm && searchTerm.trim().length > 0) {
      this.closeSearchModal();
      this.router.navigate(['/products'], {
        queryParams: { search: searchTerm.trim() }
      });
    }
  }
}

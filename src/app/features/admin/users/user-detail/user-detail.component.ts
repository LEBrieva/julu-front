import { Component, input, output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Models & Services
import { User, UserRole, UserStatus } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';

// Shared Components
import { AvatarOverlayComponent } from '../../../../shared/components/avatar-overlay/avatar-overlay.component';

/**
 * UserDetailComponent - Modal de detalhe de usuário
 *
 * Features:
 * - Mostra todos os dados do usuário em formato legível
 * - Avatar ou iniciais
 * - Informações pessoais
 * - Status e função com tags
 * - Datas formatadas
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    Select,
    InputTextModule,
    ConfirmDialogModule,
    AvatarOverlayComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Inputs
  user = input.required<User | null>();
  visible = input.required<boolean>();
  readonly = input<boolean>(false);  // Modo solo lectura

  // Outputs
  visibleChange = output<boolean>();
  userUpdated = output<User>();

  // Enums
  readonly UserRole = UserRole;
  readonly UserStatus = UserStatus;

  // Opções para dropdown de status
  readonly statusOptions = [
    { label: 'Ativo', value: UserStatus.ACTIVE },
    { label: 'Inativo', value: UserStatus.INACTIVE }
  ];

  // Valores editáveis (rastreiam mudanças locais)
  editableStatus = signal<UserStatus>(UserStatus.ACTIVE);
  editablePhone = signal<string>('');

  // Avatar
  selectedAvatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  showAvatarOverlay = signal(false);

  // Alterações pendentes para o dialog headless
  pendingChanges: string[] = [];

  // Detecta se há alterações pendentes
  hasChanges = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return false;

    const statusChanged = this.editableStatus() !== currentUser.status;
    const phoneChanged = this.editablePhone() !== (currentUser.phone || '');
    const avatarChanged = this.selectedAvatarFile() !== null;

    return statusChanged || phoneChanged || avatarChanged;
  });

  constructor() {
    // Effect para sincronizar valores editáveis quando o usuário muda
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.editableStatus.set(currentUser.status);
        this.editablePhone.set(currentUser.phone || '');
        // Resetar avatar ao mudar de usuário
        this.selectedAvatarFile.set(null);
        this.avatarPreview.set(null);
      }
    });
  }

  /**
   * Fecha o dialog
   */
  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  /**
   * Abre o overlay com o avatar ampliado (apenas se não for somente leitura)
   */
  onAvatarClick(): void {
    // Em modo somente leitura, não permitir mudança de avatar
    if (!this.readonly()) {
      this.showAvatarOverlay.set(true);
    }
  }

  /**
   * Fecha o overlay do avatar
   */
  closeAvatarOverlay(): void {
    this.showAvatarOverlay.set(false);
  }

  /**
   * Manipula a seleção de um novo avatar desde o overlay
   */
  onAvatarSelected(file: File): void {
    // Salvar arquivo selecionado
    this.selectedAvatarFile.set(file);

    // Gerar preview para mostrar no dialog principal após fechar o overlay
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Manipula erros de validação do avatar
   */
  onAvatarValidationError(error: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Arquivo inválido',
      detail: error
    });
  }

  /**
   * Salva as alterações do formulário (status, telefone e avatar)
   */
  saveChanges(): void {
    const currentUser = this.user();
    if (!currentUser || !currentUser.id || !this.hasChanges()) {
      return;
    }

    // Construir lista de alterações para o dialog headless
    this.pendingChanges = [];
    if (this.editableStatus() !== currentUser.status) {
      this.pendingChanges.push(`Status: ${this.editableStatus() === UserStatus.ACTIVE ? 'Ativo' : 'Inativo'}`);
    }
    if (this.editablePhone() !== (currentUser.phone || '')) {
      const phoneValue = this.editablePhone() || '(vazio)';
      this.pendingChanges.push(`Telefone: ${phoneValue}`);
    }
    if (this.selectedAvatarFile()) {
      this.pendingChanges.push(`Avatar: Nova imagem selecionada`);
    }

    this.confirmationService.confirm({
      key: 'saveChanges',
      message: `Deseja salvar as seguintes alterações para ${currentUser.firstName} ${currentUser.lastName}?`,
      header: 'Confirmar Alterações',
      icon: 'pi pi-save',
      acceptLabel: 'Sim, salvar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const userToUpdate = this.user();
        if (!userToUpdate || !userToUpdate.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível obter o ID do usuário'
          });
          return;
        }

        // Determinar o que precisa ser atualizado
        const hasBasicChanges = this.editableStatus() !== userToUpdate.status ||
                               this.editablePhone() !== (userToUpdate.phone || '');
        const hasAvatarChange = this.selectedAvatarFile() !== null;

        // Preparar dados básicos para atualizar
        const updateData: any = {};
        if (this.editableStatus() !== userToUpdate.status) {
          updateData.status = this.editableStatus();
        }
        if (this.editablePhone() !== (userToUpdate.phone || '')) {
          updateData.phone = this.editablePhone() || undefined;
        }

        // Criar observable inicial
        let saveObservable = of(userToUpdate);

        // Se houver alterações básicas, atualizar primeiro
        if (hasBasicChanges && Object.keys(updateData).length > 0) {
          saveObservable = this.userService.updateUser(userToUpdate.id, updateData);
        }

        // Se houver avatar, encadear o upload
        if (hasAvatarChange) {
          const avatarFile = this.selectedAvatarFile();
          if (avatarFile) {
            saveObservable = saveObservable.pipe(
              switchMap(() => this.userService.uploadAvatar(userToUpdate.id, avatarFile))
            );
          }
        }

        // Executar as atualizações
        saveObservable.subscribe({
          next: (updatedUser) => {
            // Emitir o usuário atualizado para o componente pai
            this.userUpdated.emit(updatedUser);

            // Sincronizar valores editáveis
            this.editableStatus.set(updatedUser.status);
            this.editablePhone.set(updatedUser.phone || '');

            // Limpar avatar temporário
            this.selectedAvatarFile.set(null);
            this.avatarPreview.set(null);

            this.messageService.add({
              severity: 'success',
              summary: 'Alterações salvas',
              detail: `Usuário ${updatedUser.firstName} ${updatedUser.lastName} atualizado com sucesso`
            });

            // Fechar o dialog
            this.closeDialog();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao salvar alterações',
              detail: error.error?.message || 'Ocorreu um erro ao atualizar o usuário'
            });
          }
        });
      }
    });
  }

  /**
   * Formata data completa
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtém a severidade do Tag de acordo com a função
   */
  getRoleSeverity(role: UserRole): 'success' | 'danger' {
    return role === UserRole.ADMIN ? 'danger' : 'success';
  }

  /**
   * Obtém a severidade do Tag de acordo com o status
   */
  getStatusSeverity(status: UserStatus): 'success' | 'secondary' {
    return status === UserStatus.ACTIVE ? 'success' : 'secondary';
  }
}

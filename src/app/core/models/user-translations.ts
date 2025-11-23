import { UserRole, UserStatus } from './user.model';

/**
 * Traduções de enums de usuários para Português (pt-BR)
 */

// Funções/Papéis
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  user: 'Usuário'
};

// Status
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo'
};

/**
 * Helpers para obter labels traduzidos
 */
export function getRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role] || role;
}

export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status] || status;
}

/**
 * Arrays para dropdowns
 */
export const ROLE_OPTIONS = Object.entries(USER_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as UserRole, label })
);

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as UserStatus, label })
);

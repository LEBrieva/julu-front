/**
 * Mensagens de validação centralizadas (pt-BR)
 *
 * Este arquivo contém todas as mensagens de erro de validação
 * reutilizáveis em toda a aplicação.
 *
 * VANTAGENS:
 * - Consistência: Mesma mensagem para o mesmo erro em todos os formulários
 * - Manutenção: Alterar uma mensagem em um só lugar
 * - i18n: Traduções centralizadas em português brasileiro
 * - Reutilização: Não repetir código em cada componente
 *
 * USO:
 * import { VALIDATION_MESSAGES } from '@shared/constants/validation-messages';
 * const message = VALIDATION_MESSAGES['required'];
 */

/**
 * Interface para as mensagens de erro que requerem parâmetros
 * Exemplo: minlength precisa saber qual é o mínimo (minlength: 6)
 */
export interface ValidationMessage {
  (params?: any): string;
}

/**
 * Mensagens de validação por tipo de erro
 *
 * TIPOS DE ERROS COMUNS:
 * - required: Campo obrigatório
 * - email: Email inválido
 * - minlength: Comprimento mínimo
 * - maxlength: Comprimento máximo
 * - min: Valor mínimo (números)
 * - max: Valor máximo (números)
 * - pattern: Padrão regex não cumprido
 * - Custom: Validações personalizadas (ex: passwordMismatch)
 */
export const VALIDATION_MESSAGES: { [key: string]: ValidationMessage } = {
  // Campo obrigatório
  required: () => 'Este campo é obrigatório',

  // Email
  email: () => 'Digite um e-mail válido',

  // Comprimento de texto
  minlength: (params) =>
    `Deve ter pelo menos ${params.requiredLength} caracteres`,
  maxlength: (params) =>
    `Não pode ter mais de ${params.requiredLength} caracteres`,

  // Valores numéricos
  min: (params) => `O valor mínimo é ${params.min}`,
  max: (params) => `O valor máximo é ${params.max}`,

  // Pattern (regex)
  pattern: () => 'O formato digitado não é válido',

  // Validações personalizadas comuns
  passwordMismatch: () => 'As senhas não coincidem',
  whitespace: () => 'Não pode conter apenas espaços em branco',
  alphanumeric: () => 'Apenas letras e números são permitidos',
  phone: () => 'Digite um número de telefone válido',
  url: () => 'Digite uma URL válida',
  date: () => 'Digite uma data válida',
  strongPassword: () =>
    'A senha deve conter maiúsculas, minúsculas, números e caracteres especiais',

  // Validações específicas de negócio
  uniqueEmail: () => 'Este e-mail já está registrado',
  uniqueUsername: () => 'Este nome de usuário não está disponível',
  invalidCredentials: () => 'E-mail ou senha incorretos',

  // Default para erros não mapeados
  default: () => 'Este campo contém um erro'
};

/**
 * NOTA PARA VALIDACIONES MUY ESPECÍFICAS:
 *
 * Si tienes una validación MUY específica de un formulario en particular
 * (ej: "El código postal de Buenos Aires debe empezar con C1"),
 * es mejor definirla directamente en el componente:
 *
 * // En tu component.ts
 * customErrorMessages = {
 *   postalCodeBuenosAires: 'El código postal de Buenos Aires debe empezar con C1'
 * };
 *
 * Y en el template usar getErrorMessage() para errores genéricos
 * y customErrorMessages para los específicos.
 */

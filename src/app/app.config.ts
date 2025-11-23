import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Registrar locale pt-BR para formatos de data, moeda, números
registerLocaleData(localePtBr, 'pt-BR');

/**
 * Configuração global da aplicação Angular (pt-BR)
 *
 * PROVIDERS EXPLICADOS:
 *
 * - provideRouter: Sistema de rotas do Angular
 * - provideAnimationsAsync: Habilita animações de forma assíncrona (melhor performance)
 * - provideHttpClient: Configura o cliente HTTP com interceptors
 *   - authInterceptor: Injeta o JWT em cada requisição
 *   - errorInterceptor: Gerencia erros globalmente com toasts
 * - providePrimeNG: Configura PrimeNG com o tema Aura (design moderno)
 * - LOCALE_ID: Define pt-BR como locale padrão (data, moeda R$, números)
 * - MessageService: Serviço global do PrimeNG para mostrar toasts/notificações
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // ⭐ Configurar HttpClient com interceptors (ordem: auth primeiro, depois error)
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    providePrimeNG({
      theme: {
        preset: Aura, // Tema moderno do PrimeNG
        options: {
          darkModeSelector: false, // Desabilitar modo escuro por enquanto
        }
      },
      translation: {
        // Traduções PrimeNG pt-BR
        startsWith: 'Começa com',
        contains: 'Contém',
        notContains: 'Não contém',
        endsWith: 'Termina com',
        equals: 'Igual',
        notEquals: 'Diferente',
        noFilter: 'Sem filtro',
        lt: 'Menor que',
        lte: 'Menor ou igual a',
        gt: 'Maior que',
        gte: 'Maior ou igual a',
        is: 'É',
        isNot: 'Não é',
        before: 'Antes',
        after: 'Depois',
        dateIs: 'Data é',
        dateIsNot: 'Data não é',
        dateBefore: 'Data antes de',
        dateAfter: 'Data depois de',
        clear: 'Limpar',
        apply: 'Aplicar',
        matchAll: 'Corresponder Todos',
        matchAny: 'Corresponder Qualquer',
        addRule: 'Adicionar Regra',
        removeRule: 'Remover Regra',
        accept: 'Sim',
        reject: 'Não',
        choose: 'Escolher',
        upload: 'Enviar',
        cancel: 'Cancelar',
        dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        dayNamesMin: ['Do', 'Se', 'Te', 'Qa', 'Qi', 'Sx', 'Sá'],
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        dateFormat: 'dd/mm/yy',
        firstDayOfWeek: 0,
        today: 'Hoje',
        weekHeader: 'Sem',
        weak: 'Fraca',
        medium: 'Média',
        strong: 'Forte',
        passwordPrompt: 'Digite uma senha',
        emptyMessage: 'Nenhum resultado encontrado',
        emptyFilterMessage: 'Nenhum resultado encontrado',
        searchMessage: '{0} resultados disponíveis',
        selectionMessage: '{0} itens selecionados',
        emptySelectionMessage: 'Nenhum item selecionado',
        emptySearchMessage: 'Nenhum resultado encontrado',
        fileChosenMessage: '{0} arquivos',
        noFileChosenMessage: 'Nenhum arquivo escolhido',
        aria: {
          trueLabel: 'Verdadeiro',
          falseLabel: 'Falso',
          nullLabel: 'Não Selecionado',
          star: 'estrela',
          stars: 'estrelas',
          selectAll: 'Selecionar todos',
          unselectAll: 'Desselecionar todos',
          close: 'Fechar',
          previous: 'Anterior',
          next: 'Próximo',
          navigation: 'Navegação',
          scrollTop: 'Rolar para o topo',
          moveTop: 'Mover para o topo',
          moveUp: 'Mover para cima',
          moveDown: 'Mover para baixo',
          moveBottom: 'Mover para o fim',
          moveToTarget: 'Mover para o destino',
          moveToSource: 'Mover para a origem',
          moveAllToTarget: 'Mover tudo para o destino',
          moveAllToSource: 'Mover tudo para a origem',
          pageLabel: 'Página {page}',
          firstPageLabel: 'Primeira Página',
          lastPageLabel: 'Última Página',
          nextPageLabel: 'Próxima Página',
          prevPageLabel: 'Página Anterior',
          rowsPerPageLabel: 'Linhas por página',
          previousPageLabel: 'Página Anterior',
          jumpToPageDropdownLabel: 'Ir para Página',
          jumpToPageInputLabel: 'Ir para Página',
          selectRow: 'Linha selecionada',
          unselectRow: 'Linha não selecionada',
          expandRow: 'Expandir Linha',
          collapseRow: 'Recolher Linha',
          showFilterMenu: 'Mostrar Menu de Filtro',
          hideFilterMenu: 'Ocultar Menu de Filtro',
          filterOperator: 'Operador de Filtro',
          filterConstraint: 'Restrição de Filtro',
          editRow: 'Editar Linha',
          saveEdit: 'Salvar Edição',
          cancelEdit: 'Cancelar Edição',
          listView: 'Visualização em Lista',
          gridView: 'Visualização em Grade',
          slide: 'Deslizar',
          slideNumber: '{slideNumber}',
          zoomImage: 'Ampliar Imagem',
          zoomIn: 'Aumentar Zoom',
          zoomOut: 'Diminuir Zoom',
          rotateRight: 'Girar à Direita',
          rotateLeft: 'Girar à Esquerda'
        }
      }
    }),
    // ⭐ Locale pt-BR: Formata datas, moeda (R$), números, etc
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // ⭐ MessageService: Serviço global para toasts (usado por error.interceptor)
    MessageService
  ]
};

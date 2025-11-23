import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Language = 'pt-BR' | 'es-ES';

export interface Translations {
  [key: string]: string | Translations;
}

/**
 * Serviço de Tradução (i18n)
 *
 * Sistema centralizado de tradução para toda a aplicação.
 * Carrega traduções do JSON e fornece método para obter textos traduzidos.
 *
 * USO:
 * constructor(private translate: TranslationService) {}
 *
 * // Em templates
 * {{ translate.t('common.save') }}
 *
 * // Em componentes
 * this.translate.t('validation.required')
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translationsSignal = signal<Translations>({});
  private currentLangSignal = signal<Language>('pt-BR');

  readonly translations = this.translationsSignal.asReadonly();
  readonly currentLang = this.currentLangSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.loadTranslations('pt-BR');
  }

  /**
   * Carrega arquivo de tradução
   */
  private loadTranslations(lang: Language): void {
    this.http.get<Translations>(`/assets/i18n/${lang}.json`)
      .subscribe({
        next: (translations) => {
          this.translationsSignal.set(translations);
          this.currentLangSignal.set(lang);
        },
        error: (err) => {
          console.error(`Erro ao carregar traduções ${lang}:`, err);
        }
      });
  }

  /**
   * Obtém tradução por chave (suporta nested keys com '.')
   *
   * @example
   * t('common.save') // 'Salvar'
   * t('validation.required') // 'Este campo é obrigatório'
   * t('product.status.active') // 'Ativo'
   */
  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Chave de tradução não encontrada: ${key}`);
        return key;
      }
    }

    // Se tem parâmetros, substitui no texto
    if (params && typeof value === 'string') {
      return this.interpolate(value, params);
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Substitui variáveis no texto
   * @example interpolate('Olá {{name}}', { name: 'João' }) // 'Olá João'
   */
  private interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] || '');
  }

  /**
   * Muda idioma (futura expansão)
   */
  setLanguage(lang: Language): void {
    this.loadTranslations(lang);
  }
}

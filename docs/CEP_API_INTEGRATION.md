# Integração CEP API - Busca Automática de Endereço

## 📋 Visão Geral

Este documento detalha a integração de APIs de busca de CEP (Código de Endereçamento Postal) para auto-preenchimento de endereços no checkout do e-commerce.

### Por que integrar CEP lookup?

- ✅ **UX aprimorada**: Cliente digita apenas CEP → endereço preenchido automaticamente
- ✅ **Redução de erros**: Dados padronizados diretamente dos Correios
- ✅ **Conversão maior**: Checkout mais rápido = menos abandono de carrinho
- ✅ **Validação**: Garante que CEP existe antes de processar pedido

---

## 🔍 Comparação de APIs Disponíveis

### ViaCEP ✅ **RECOMENDADO**

**Status**: Grátis, estável, amplamente adotado

| Aspecto | Detalhes |
|---------|----------|
| **URL Base** | `https://viacep.com.br/ws/{cep}/json` |
| **Autenticação** | Não requerida |
| **Preço** | 100% GRÁTIS |
| **Rate Limit** | Não documentado (política de uso justo) |
| **CORS** | ✅ Habilitado (funciona no browser) |
| **Formatos** | JSON, XML, piped, querty |
| **Confiabilidade** | Alta (comunidade) |

**Exemplo de Request**:
```bash
GET https://viacep.com.br/ws/01001000/json
```

**Exemplo de Response**:
```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7107"
}
```

**Features Avançados**:
- **Busca por endereço**: `GET /ws/{UF}/{cidade}/{logradouro}/json`
- Exemplo: `https://viacep.com.br/ws/RS/Porto Alegre/Domingos/json` (retorna array)

**Tratamento de Erros**:
- **Formato inválido** (não 8 dígitos): `400 Bad Request`
- **CEP não encontrado**: `200 OK` com campo `"erro": true`
- **Validação obrigatória**: Validar formato de 8 dígitos antes de chamar API

**Prós**:
- ✅ Completamente grátis, sem registro
- ✅ Tempos de resposta rápidos
- ✅ Alta disponibilidade (amplamente usado no Brasil)
- ✅ CORS habilitado (seguro no browser)
- ✅ Dados completos (rua, bairro, cidade, estado, IBGE)
- ✅ Busca reversa por nome de rua
- ✅ Suporte comunitário extenso

**Contras**:
- ⚠️ Sem SLA oficial (mantido pela comunidade)
- ⚠️ Rate limits não documentados (respeitar uso justo)

---

### BrasilAPI ✅ **FALLBACK RECOMENDADO**

**Status**: Grátis, open-source, resiliente

| Aspecto | Detalhes |
|---------|----------|
| **URL Base V1** | `https://brasilapi.com.br/api/cep/v1/{cep}` |
| **URL Base V2** | `https://brasilapi.com.br/api/cep/v2/{cep}` (com GPS) |
| **Autenticação** | Não requerida |
| **Preço** | GRÁTIS |
| **Infraestrutura** | Vercel Smart CDN (23 regiões globais) |
| **CORS** | ✅ Habilitado |
| **Fallback** | Múltiplos provedores (ViaCEP, Correios, outros) |

**Por que BrasilAPI existe?**:
- API dos Correios não tem CORS habilitado para browsers
- Centraliza múltiplos provedores com fallback automático
- Latência extremamente baixa devido ao CDN caching

**Exemplo V2 (com coordenadas GPS)**:
```bash
GET https://brasilapi.com.br/api/cep/v2/05010000
```

**Response V2**:
```json
{
  "cep": "05010-000",
  "state": "SP",
  "city": "São Paulo",
  "neighborhood": "Perdizes",
  "street": "Rua Caiubi",
  "location": {
    "type": "Point",
    "coordinates": {
      "longitude": "-46.6753",
      "latitude": "-23.5366"
    }
  }
}
```

**Prós**:
- ✅ Grátis e open-source
- ✅ Múltiplos provedores com fallback (alta resiliência)
- ✅ CDN global (latência ultra-baixa)
- ✅ **Coordenadas GPS na V2** (útil para mapas/rotas)
- ✅ Comunidade ativa (GitHub: BrasilAPI/BrasilAPI)
- ✅ CORS habilitado

**Contras**:
- ⚠️ Política de uso justo (evitar scraping/crawling)
- ⚠️ Mantido pela comunidade (sem SLA pago)

---

### API Oficial dos Correios ❌ **NÃO RECOMENDADO**

**Status**: Complexo, requer contrato comercial

| Aspecto | Detalhes |
|---------|----------|
| **URL Base** | `https://apihom.correios.com.br/cep/v1/endereços/{cep}` |
| **Autenticação** | OAuth (requer credenciais CWS) |
| **Preço** | Requer contrato comercial |
| **Registro** | Conta Meu Correios + Portal CWS |
| **CORS** | ❌ Não habilitado |

**Processo de Registro**:
1. Criar conta em [Meu Correios](https://meucorreios.correios.com.br/)
2. Acessar [Portal CWS](https://cws.correios.com.br/) para gerar código de acesso
3. **Contrato comercial necessário** para recursos completos (cálculo de frete, rastreamento)

**Por que não usar?**:
- ❌ Requer contrato comercial (burocrático, lento)
- ❌ Fluxo de autenticação complexo
- ❌ Sem documentação pública de rate limits
- ❌ Overkill para busca simples de CEP
- ❌ Problemas de CORS para chamadas frontend

**Quando usar**: Integrações enterprise que precisam de cálculo de frete + rastreamento + CEP em uma única API

---

## 🏗️ Arquitetura de Integração

### Por que Backend Proxy? (Abordagem Recomendada)

Mesmo que as APIs sejam gratuitas e habilitadas para CORS, **proxy no backend é best practice**.

| Aspecto | Backend Proxy | Frontend Direto |
|---------|---------------|-----------------|
| **Segurança** | ✅ Esconder endpoint de API | ❌ Expõe API publicamente |
| **Caching** | ✅ Cache server-side (Redis) | ⚠️ Apenas cache do browser |
| **Rate Limiting** | ✅ Controlar abuso | ❌ Dependente do usuário |
| **Monitoramento** | ✅ Rastrear uso/erros | ❌ Visibilidade limitada |
| **Problemas de CORS** | ✅ Sem preocupação com CORS | ⚠️ Depende da API |
| **Fallback** | ✅ Trocar provedor transparentemente | ❌ Cliente precisa saber múltiplos endpoints |

**Veredito**: Backend proxy oferece controle, caching e resiliência superiores.

---

## 🔧 Implementação Backend (NestJS)

### 1. Instalação de Dependências

```bash
npm install @nestjs/axios axios
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store
```

### 2. CepService

**Arquivo**: `src/cep/cep.service.ts`

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { catchError, map, timeout, firstValueFrom } from 'rxjs';

export interface CepResponse {
  cep: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge?: string;
  latitude?: string;
  longitude?: string;
  provider: 'ViaCEP' | 'BrasilAPI';
  fromCache?: boolean;
}

@Injectable()
export class CepService {
  constructor(
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findByCep(cep: string): Promise<CepResponse> {
    // Sanitizar CEP (remover não-numéricos)
    const cleanCep = cep.replace(/\D/g, '');

    // Validar formato
    if (cleanCep.length !== 8) {
      throw new HttpException(
        'CEP inválido. Deve conter 8 dígitos.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar cache primeiro (CEPs não mudam frequentemente)
    const cacheKey = `cep:${cleanCep}`;
    const cached = await this.cacheManager.get<CepResponse>(cacheKey);

    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Buscar em APIs externas com fallback
    let result: CepResponse;

    try {
      // Tentar ViaCEP primeiro (primário)
      result = await this.fetchFromViaCep(cleanCep);
    } catch (error) {
      // Fallback para BrasilAPI
      try {
        result = await this.fetchFromBrasilApi(cleanCep);
      } catch (fallbackError) {
        throw new HttpException(
          'CEP não encontrado em nenhum provedor',
          HttpStatus.NOT_FOUND
        );
      }
    }

    // Cachear por 30 dias (CEPs são dados estáveis)
    await this.cacheManager.set(cacheKey, result, 30 * 24 * 60 * 60 * 1000);

    return result;
  }

  private async fetchFromViaCep(cep: string): Promise<CepResponse> {
    const response = await firstValueFrom(
      this.httpService.get(`https://viacep.com.br/ws/${cep}/json`).pipe(
        timeout(5000), // timeout de 5 segundos
        map(res => res.data),
        catchError(() => {
          throw new HttpException(
            'ViaCEP indisponível',
            HttpStatus.SERVICE_UNAVAILABLE
          );
        })
      )
    );

    // ViaCEP retorna 200 com "erro": true quando CEP não encontrado
    if (response.erro) {
      throw new HttpException('CEP não encontrado', HttpStatus.NOT_FOUND);
    }

    return {
      cep: response.cep,
      street: response.logradouro,
      complement: response.complemento,
      neighborhood: response.bairro,
      city: response.localidade,
      state: response.uf,
      ibge: response.ibge,
      provider: 'ViaCEP'
    };
  }

  private async fetchFromBrasilApi(cep: string): Promise<CepResponse> {
    const response = await firstValueFrom(
      this.httpService.get(`https://brasilapi.com.br/api/cep/v2/${cep}`).pipe(
        timeout(5000),
        map(res => res.data),
        catchError(() => {
          throw new HttpException(
            'BrasilAPI indisponível',
            HttpStatus.SERVICE_UNAVAILABLE
          );
        })
      )
    );

    return {
      cep: response.cep,
      street: response.street,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state,
      latitude: response.location?.coordinates?.latitude,
      longitude: response.location?.coordinates?.longitude,
      provider: 'BrasilAPI'
    };
  }
}
```

### 3. CepController

**Arquivo**: `src/cep/cep.controller.ts`

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CepService } from './cep.service';

@Controller('cep')
export class CepController {
  constructor(private cepService: CepService) {}

  @Get(':cep')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests/minuto
  async findByCep(@Param('cep') cep: string) {
    return this.cepService.findByCep(cep);
  }
}
```

### 4. CepModule

**Arquivo**: `src/cep/cep.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      ttl: 30 * 24 * 60 * 60, // 30 dias padrão
      max: 10000 // máximo 10k CEPs em cache
    })
  ],
  controllers: [CepController],
  providers: [CepService],
  exports: [CepService]
})
export class CepModule {}
```

### 5. Configuração Redis (Produção)

Para produção, substituir cache in-memory por Redis:

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 30 * 24 * 60 * 60, // 30 dias
      max: 50000 // 50k CEPs
    }),
    // ... outros módulos
  ]
})
export class AppModule {}
```

---

## 🎨 Implementação Frontend (Angular)

### 1. CepService

**Arquivo**: `src/app/core/services/cep.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CepResponse {
  cep: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge?: string;
  latitude?: string;
  longitude?: string;
  provider: 'ViaCEP' | 'BrasilAPI';
  fromCache?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CepService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cep`;

  findByCep(cep: string): Observable<CepResponse> {
    // Remover caracteres não-numéricos
    const cleanCep = cep.replace(/\D/g, '');
    return this.http.get<CepResponse>(`${this.apiUrl}/${cleanCep}`);
  }
}
```

### 2. Integração no CheckoutComponent

**Arquivo**: `src/app/features/checkout/checkout.component.ts`

```typescript
import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, filter, tap, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CepService } from '../../core/services/cep.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private cepService = inject(CepService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  loadingCep = signal(false);

  shippingForm = new FormGroup({
    cep: new FormControl('', [Validators.required, this.cepValidator]),
    street: new FormControl({ value: '', disabled: true }),
    number: new FormControl('', Validators.required),
    complement: new FormControl(''),
    neighborhood: new FormControl({ value: '', disabled: true }),
    city: new FormControl({ value: '', disabled: true }),
    state: new FormControl({ value: '', disabled: true })
  });

  // Validador customizado para CEP
  private cepValidator(control: AbstractControl): ValidationErrors | null {
    const cep = control.value?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      return { invalidCep: 'CEP deve conter 8 dígitos' };
    }
    return null;
  }

  ngOnInit() {
    // Auto-preenchimento quando CEP muda
    this.shippingForm.get('cep')?.valueChanges.pipe(
      debounceTime(500), // Aguardar 500ms após usuário parar de digitar
      filter(cep => cep?.replace(/\D/g, '').length === 8), // Apenas CEPs válidos
      tap(() => this.loadingCep.set(true)),
      switchMap(cep => this.cepService.findByCep(cep!)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        // Auto-preencher campos
        this.shippingForm.patchValue({
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state
        });

        this.loadingCep.set(false);

        this.messageService.add({
          severity: 'success',
          summary: 'CEP encontrado',
          detail: `${data.city} - ${data.state}`,
          life: 3000
        });

        // Focar no campo "número" após auto-preenchimento
        setTimeout(() => {
          document.getElementById('number-input')?.focus();
        }, 100);
      },
      error: (err) => {
        this.loadingCep.set(false);

        if (err.status === 404) {
          this.messageService.add({
            severity: 'warn',
            summary: 'CEP não encontrado',
            detail: 'Preencha o endereço manualmente',
            life: 5000
          });

          // Habilitar input manual
          this.enableManualAddress();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro ao buscar CEP',
            detail: 'Tente novamente',
            life: 5000
          });
        }
      }
    });
  }

  private enableManualAddress() {
    this.shippingForm.get('street')?.enable();
    this.shippingForm.get('neighborhood')?.enable();
    this.shippingForm.get('city')?.enable();
    this.shippingForm.get('state')?.enable();
  }

  onSubmit() {
    if (this.shippingForm.invalid) {
      return;
    }

    const formValue = this.shippingForm.getRawValue(); // getRawValue() pega campos disabled também
    console.log('Endereço de entrega:', formValue);
    // Processar checkout...
  }
}
```

### 3. Template HTML

**Arquivo**: `src/app/features/checkout/checkout.component.html`

```html
<form [formGroup]="shippingForm" (ngSubmit)="onSubmit()">
  <h2 class="text-2xl font-bold mb-6">Endereço de Entrega</h2>

  <!-- CEP -->
  <div class="form-field mb-4">
    <label for="cep" class="block font-semibold mb-2">CEP *</label>
    <div class="flex gap-2">
      <p-inputMask
        id="cep"
        formControlName="cep"
        mask="99999-999"
        placeholder="00000-000"
        [styleClass]="'w-full'"
      />
      <p-button
        *ngIf="loadingCep()"
        icon="pi pi-spin pi-spinner"
        [disabled]="true"
        severity="secondary"
      />
    </div>
    <small class="text-red-500" *ngIf="shippingForm.get('cep')?.errors?.['invalidCep'] && shippingForm.get('cep')?.touched">
      {{ shippingForm.get('cep')?.errors?.['invalidCep'] }}
    </small>
  </div>

  <!-- Rua -->
  <div class="form-field mb-4">
    <label for="street" class="block font-semibold mb-2">Rua *</label>
    <input
      id="street"
      pInputText
      formControlName="street"
      placeholder="Será preenchido automaticamente"
      class="w-full"
    />
  </div>

  <div class="grid grid-cols-3 gap-4 mb-4">
    <!-- Número -->
    <div class="form-field col-span-1">
      <label for="number-input" class="block font-semibold mb-2">Número *</label>
      <input
        id="number-input"
        pInputText
        formControlName="number"
        placeholder="123"
        class="w-full"
      />
    </div>

    <!-- Complemento -->
    <div class="form-field col-span-2">
      <label for="complement" class="block font-semibold mb-2">Complemento</label>
      <input
        id="complement"
        pInputText
        formControlName="complement"
        placeholder="Apto 45, Bloco B"
        class="w-full"
      />
    </div>
  </div>

  <!-- Bairro -->
  <div class="form-field mb-4">
    <label for="neighborhood" class="block font-semibold mb-2">Bairro *</label>
    <input
      id="neighborhood"
      pInputText
      formControlName="neighborhood"
      placeholder="Será preenchido automaticamente"
      class="w-full"
    />
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4">
    <!-- Cidade -->
    <div class="form-field">
      <label for="city" class="block font-semibold mb-2">Cidade *</label>
      <input
        id="city"
        pInputText
        formControlName="city"
        placeholder="Será preenchido automaticamente"
        class="w-full"
      />
    </div>

    <!-- Estado -->
    <div class="form-field">
      <label for="state" class="block font-semibold mb-2">Estado *</label>
      <input
        id="state"
        pInputText
        formControlName="state"
        placeholder="SP"
        class="w-full"
      />
    </div>
  </div>

  <p-button
    type="submit"
    label="Continuar para Pagamento"
    icon="pi pi-arrow-right"
    [disabled]="shippingForm.invalid"
    styleClass="w-full"
  />
</form>
```

### 4. Estilos CSS

**Arquivo**: `src/app/features/checkout/checkout.component.css`

```css
.form-field input:disabled,
.form-field ::ng-deep .p-inputtext:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-field label {
  color: #374151;
}

.form-field small.text-red-500 {
  display: block;
  margin-top: 0.25rem;
}
```

---

## 🎯 UX Best Practices

### 1. Loading States

- ✅ Mostrar spinner enquanto busca CEP
- ✅ Desabilitar campos auto-preenchidos durante loading
- ✅ Toast informativo: "Buscando endereço..."

### 2. Auto-fill

- ✅ Pré-preencher todos os campos exceto número/complemento
- ✅ Campos preenchidos ficam desabilitados (fundo cinza)
- ✅ Usuário só digita: CEP → Número → Complemento (opcional)

### 3. Auto-focus

- ✅ Após auto-preenchimento, focar automaticamente no campo "Número"
- ✅ Reduz fricção (usuário não precisa clicar)

### 4. Debounce

- ✅ Aguardar 500ms após usuário parar de digitar
- ✅ Evita requisições desnecessárias (cada dígito)
- ✅ API é chamada apenas quando CEP está completo (8 dígitos)

### 5. Fallback Manual

- ✅ Se CEP não encontrado, mostrar toast: "Preencha manualmente"
- ✅ Habilitar todos os campos para input manual
- ✅ Não bloquear checkout (alguns CEPs novos podem não existir)

### 6. Feedback Visual

- ✅ Toast de sucesso: "CEP encontrado - São Paulo - SP"
- ✅ Toast de aviso: "CEP não encontrado - Preencha manualmente"
- ✅ Toast de erro: "Erro ao buscar CEP - Tente novamente"

### 7. Input Mask

- ✅ Usar `p-inputMask` com formato `99999-999`
- ✅ Facilita digitação correta (hífen automático)
- ✅ Validação visual (8 dígitos obrigatórios)

---

## 🧪 Estratégia de Caching

### Por que cachear CEPs?

- ✅ **Dados estáveis**: CEPs não mudam frequentemente (décadas)
- ✅ **Performance**: Resposta instantânea após primeiro acesso
- ✅ **Custo**: Reduz chamadas às APIs externas (respeita rate limits)
- ✅ **Resiliência**: Se APIs externas caem, cache continua funcionando

### TTL (Time To Live) Recomendado

| Tipo | TTL | Justificativa |
|------|-----|---------------|
| **Produção** | **30 dias** | CEPs são praticamente imutáveis |
| **Desenvolvimento** | 7 dias | Facilita testes com dados atualizados |
| **CEP não encontrado** | 1 hora | Novos CEPs podem ser adicionados rapidamente |

### Chaves de Cache

```
Format: cep:{cleanCep}
Examples:
- cep:01001000
- cep:05010000
```

### Invalidação de Cache

**Quando invalidar?**:
- ⚠️ CEP reportado como incorreto por múltiplos usuários
- ⚠️ Mudança de nomenclatura de rua (raro)
- ⚠️ Atualização de dados dos Correios (anual)

**Como invalidar?**:
```typescript
// Backend
await this.cacheManager.del('cep:01001000');
```

**Invalidação automática**: Não recomendada (CEPs são estáveis)

---

## 📊 Monitoramento e Métricas

### KPIs para Rastrear

1. **Taxa de sucesso de busca CEP**
   - Meta: > 95%
   - Se < 90%: Investigar problemas com APIs

2. **Tempo médio de resposta**
   - Meta: < 500ms (com cache) / < 2s (sem cache)
   - Se > 3s: Verificar latência de rede

3. **Taxa de cache hit**
   - Meta: > 80% após primeiras semanas
   - Se < 70%: Aumentar TTL ou tamanho do cache

4. **Fallback para BrasilAPI**
   - Meta: < 5% (ViaCEP deve ser primário)
   - Se > 20%: ViaCEP pode estar com problemas

5. **Taxa de preenchimento manual**
   - Meta: < 5%
   - Se > 10%: Muitos CEPs inválidos ou novos

### Logs Recomendados

```typescript
// Sucessos
logger.log(`CEP ${cep} found via ${provider} (cache: ${fromCache})`);

// Erros
logger.error(`CEP ${cep} not found in any provider`);
logger.error(`ViaCEP timeout for CEP ${cep}, fallback to BrasilAPI`);

// Métricas
logger.log(`Cache hit rate: ${hitRate}%`);
logger.log(`Average response time: ${avgTime}ms`);
```

---

## 🐛 Troubleshooting

### Problema: "CEP não encontrado" para CEP válido

**Causas possíveis**:
1. CEP muito novo (ainda não nos sistemas)
2. API temporariamente sem dados daquele CEP
3. Erro de digitação (usuário digitou errado)

**Solução**:
- Habilitar input manual
- Validar formato antes de buscar (8 dígitos)
- Logar CEPs não encontrados para análise

### Problema: Timeout nas APIs

**Sintomas**: Demora > 5s ou erro de timeout

**Soluções**:
1. ✅ Aumentar timeout (5s → 10s)
2. ✅ Implementar retry logic (máximo 1 retry)
3. ✅ Usar BrasilAPI (tem CDN, mais rápido)
4. ✅ Logar latências para monitoramento

### Problema: Rate limit excedido

**Sintomas**: 429 Too Many Requests

**Soluções**:
1. ✅ Implementar throttling no backend (20 req/min)
2. ✅ Aumentar cache TTL (menos chamadas)
3. ✅ Implementar cooldown por IP (1 req/5s)
4. ✅ Considerar cache frontend (sessionStorage)

### Problema: Cache não está funcionando

**Checklist**:
1. ✅ Redis está rodando? (`redis-cli ping`)
2. ✅ Configuração de CacheModule está correta?
3. ✅ TTL não está muito curto?
4. ✅ Chaves de cache estão corretas? (`cep:{cleanCep}`)

### Problema: Campos não estão sendo preenchidos

**Checklist**:
1. ✅ `shippingForm.patchValue()` está sendo chamado?
2. ✅ Campos não estão como `readonly` (usar `disabled`)
3. ✅ `debounceTime(500)` não está muito longo?
4. ✅ CEP tem 8 dígitos antes de chamar API?

---

## 📚 Recursos Adicionais

### Documentação das APIs

- [ViaCEP - Documentação](https://viacep.com.br/)
- [ViaCEP - Postman Collection](https://documenter.getpostman.com/view/8961871/SVn3svAh)
- [BrasilAPI - Documentação](https://brasilapi.com.br/docs)
- [BrasilAPI - GitHub](https://github.com/BrasilAPI/BrasilAPI)
- [Correios API - Manual Oficial](https://www.correios.com.br/atendimento/developers/arquivos/manual-para-integracao-correios-api)

### Ferramentas Úteis

- [Redis Commander](https://github.com/joeferner/redis-commander) - GUI para visualizar cache
- [Postman](https://www.postman.com/) - Testar APIs manualmente
- [ngrok](https://ngrok.com/) - Expor localhost para testes

---

## 🎯 Próximos Passos

Após implementação de CEP lookup:

1. **Analytics**: Rastrear quantos usuários usam auto-fill vs manual
2. **Cálculo de Frete**: Integrar com Correios API ou Melhor Envio
3. **Validação de Endereço**: Cross-reference com Google Maps API
4. **Sugestões**: Sugerir correções para endereços inválidos
5. **Geolocalização**: Usar coordenadas GPS do BrasilAPI V2 para mapas

---

**Última atualização**: 2025-11-23
**Compatibilidade**: NestJS 10+, Angular 20+, ViaCEP API, BrasilAPI V2

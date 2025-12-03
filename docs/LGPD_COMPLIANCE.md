# LGPD Compliance - Guia de Conformidade

## 📋 Visão Geral

Este documento detalha os requisitos de conformidade com a **Lei Geral de Proteção de Dados (LGPD)** - Lei nº 13.709/2018, equivalente brasileiro da GDPR europeia.

### O que é a LGPD?

A LGPD regula o tratamento de dados pessoais de indivíduos por organizações públicas e privadas no Brasil, garantindo privacidade e controle sobre suas informações pessoais.

### Por que é importante?

- ⚠️ **Multas pesadas**: Até 2% do faturamento (máximo R$ 50 milhões por infração)
- ⚠️ **Danos reputacionais**: Perda de confiança dos clientes
- ⚠️ **Responsabilidade legal**: Processos judiciais por violação de privacidade
- ✅ **Vantagem competitiva**: Clientes preferem empresas que respeitam privacidade

---

## 🔍 Conceitos Fundamentais

### Tipos de Dados Pessoais

**Dados Pessoais**: Informação relacionada a pessoa natural identificada ou identificável

**Exemplos no E-commerce**:
- ✅ Nome completo
- ✅ Email
- ✅ CPF
- ✅ Telefone
- ✅ Endereço físico
- ✅ IP address
- ✅ Histórico de compras
- ✅ Cookies/trackers

**Dados Sensíveis** (requerem cuidado extra):
- Origem racial/étnica
- Convicções religiosas
- Opiniões políticas
- Filiação sindical
- Dados genéticos/biométricos
- **Saúde** (ex: produtos médicos)
- Vida sexual/orientação sexual

### Princípios da LGPD

1. **Finalidade**: Dados coletados para propósitos legítimos e específicos
2. **Adequação**: Tratamento compatível com finalidades informadas
3. **Necessidade**: Limitação ao mínimo necessário
4. **Transparência**: Informar claramente o titular
5. **Segurança**: Medidas técnicas e administrativas
6. **Prevenção**: Evitar danos ao titular
7. **Não discriminação**: Tratamento não pode ser discriminatório
8. **Responsabilização**: Demonstrar conformidade

### Bases Legais para Tratamento

Você **DEVE** ter ao menos uma base legal para coletar/processar dados:

| Base Legal | Descrição | Exemplo E-commerce |
|------------|-----------|-------------------|
| **Consentimento** | Autorização explícita do titular | Marketing emails, cookies analytics |
| **Execução de contrato** | Necessário para cumprir contrato | Dados de entrega, pagamento |
| **Obrigação legal** | Exigido por lei | CPF para nota fiscal, retenção fiscal (5 anos) |
| **Proteção da vida** | Situação emergencial | N/A para e-commerce |
| **Tutela da saúde** | Procedimentos médicos | E-commerce de medicamentos |
| **Interesse legítimo** | Interesse legítimo do controlador | Prevenção de fraude, segurança |
| **Proteção do crédito** | Avaliação de crédito | Parcelamento, análise de risco |

**No e-commerce**: Maioria dos dados usa **execução de contrato** (entrega) ou **consentimento** (marketing).

---

## ✅ Checklist de Conformidade

### 1. Política de Privacidade

- [ ] **Página dedicada** (`/privacy-policy`)
- [ ] **Linguagem clara** (português simples, sem juridiquês excessivo)
- [ ] **Informações obrigatórias**:
  - [ ] Quais dados são coletados
  - [ ] Finalidade de cada coleta
  - [ ] Base legal para tratamento
  - [ ] Com quem os dados são compartilhados (vendors)
  - [ ] Prazo de retenção
  - [ ] Direitos do titular
  - [ ] Como exercer direitos (email de contato)
  - [ ] Medidas de segurança aplicadas
  - [ ] Uso de cookies/trackers
  - [ ] Transferências internacionais (se aplicável)
  - [ ] Dados de contato do DPO (Data Protection Officer)
  - [ ] Data da última atualização

**Exemplo de seção**:
```markdown
## Quais Dados Coletamos?

### Dados de Cadastro
- Nome completo, email, telefone
- **Finalidade**: Identificação do usuário, comunicação sobre pedidos
- **Base Legal**: Execução de contrato
- **Retenção**: Enquanto conta ativa + 5 anos após inatividade (obrigação fiscal)

### Dados de Entrega
- Endereço completo (rua, número, bairro, cidade, CEP)
- **Finalidade**: Entrega de produtos comprados
- **Base Legal**: Execução de contrato
- **Retenção**: 90 dias após entrega (reclamações) + 5 anos arquivado (obrigação fiscal)

### CPF (Opcional)
- Cadastro de Pessoa Física
- **Finalidade**: Emissão de nota fiscal eletrônica
- **Base Legal**: Consentimento + obrigação legal (Receita Federal)
- **Retenção**: 5 anos (prazo legal fiscal)
```

### 2. Termos de Serviço

- [ ] **Página dedicada** (`/terms`)
- [ ] **Conteúdo obrigatório**:
  - [ ] Condições de uso da plataforma
  - [ ] Direitos e responsabilidades
  - [ ] Política de devolução/reembolso
  - [ ] Garantias de produtos
  - [ ] Limitações de responsabilidade
  - [ ] Lei aplicável e foro (jurisdição)
  - [ ] Modificações dos termos

### 3. Sistema de Consentimento

**Onde obter consentimento**:

- [ ] **Registro de conta**:
  - [ ] Checkbox: "Li e aceito a Política de Privacidade e os Termos de Serviço" (obrigatório)
  - [ ] Checkbox: "Aceito receber emails marketing com ofertas" (opcional)
  - [ ] Links clicáveis para políticas

- [ ] **Checkout (guest)**:
  - [ ] Checkbox: "Li e aceito os Termos de Serviço" (obrigatório)
  - [ ] Checkbox: "Aceito receber emails sobre meu pedido" (pré-marcado, pode desmarcar)

- [ ] **CPF (se usar)**:
  - [ ] Checkbox: "Autorizo o armazenamento do meu CPF para emissão de nota fiscal" (opcional)
  - [ ] Texto explicativo: "Seu CPF será usado apenas para nota fiscal e retido por 5 anos (lei fiscal)"

- [ ] **Cookies**:
  - [ ] Banner de cookies na primeira visita
  - [ ] Opções: "Aceitar Todos" / "Apenas Essenciais" / "Personalizar"
  - [ ] Link para Política de Cookies

**Características do consentimento válido (LGPD)**:
- ✅ **Livre**: Não coagido (não pode bloquear serviço essencial)
- ✅ **Informado**: Titular sabe o que está autorizando
- ✅ **Inequívoco**: Ação afirmativa clara (checkbox, não pré-marcado)
- ✅ **Específico**: Por finalidade (não "aceito tudo")

**Registro de consentimentos**:
```typescript
@Entity('user_consents')
export class UserConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  consentType: string; // 'privacy_policy', 'marketing_emails', 'cpf_storage'

  @Column()
  granted: boolean;

  @Column()
  ipAddress: string; // Prova de onde foi dado o consentimento

  @Column()
  userAgent: string; // Browser/dispositivo

  @CreateDateColumn()
  grantedAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;
}
```

### 4. Direitos dos Titulares

A LGPD garante 9 direitos aos titulares. Você **DEVE** implementar mecanismos para exercê-los:

#### 4.1 Direito de Acesso

**Requisito**: Usuário pode ver quais dados você tem sobre ele

**Implementação**:
- [ ] Endpoint: `GET /users/me/data`
- [ ] Response: JSON completo com todos os dados
- [ ] Incluir: Dados cadastrais, histórico de pedidos, consentimentos, logs de acesso

**Exemplo de resposta**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "cpf": "***. 456.789-**" (parcialmente mascarado se solicitado),
    "phone": "(11) 98765-4321",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "addresses": [...],
  "orders": [...],
  "consents": [...],
  "loginHistory": [...]
}
```

#### 4.2 Direito de Correção

**Requisito**: Usuário pode atualizar dados incorretos

**Implementação**:
- [ ] Página de perfil (`/profile`) com formulário editável
- [ ] Endpoint: `PATCH /users/me`
- [ ] Validações de formato (email, telefone, CEP)

#### 4.3 Direito de Portabilidade

**Requisito**: Usuário pode exportar dados em formato machine-readable

**Implementação**:
- [ ] Botão "Baixar Meus Dados" no perfil
- [ ] Endpoint: `GET /users/me/export`
- [ ] Formato: JSON ou CSV
- [ ] Incluir TODOS os dados (mesmo histórico de pedidos)

**Backend**:
```typescript
async exportUserData(userId: string): Promise<any> {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['addresses', 'orders', 'orders.items', 'payments', 'consents']
  });

  return {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      phone: user.phone,
      createdAt: user.createdAt
    },
    addresses: user.addresses,
    orders: user.orders,
    payments: user.payments,
    consents: user.consents.map(c => ({
      type: c.consentType,
      granted: c.granted,
      date: c.grantedAt
    }))
  };
}
```

#### 4.4 Direito de Eliminação (Esquecimento)

**Requisito**: Usuário pode deletar sua conta e dados

**Implementação**:
- [ ] Botão "Excluir Minha Conta" no perfil (seção segurança)
- [ ] ConfirmDialog com aviso: "Esta ação é irreversível"
- [ ] Endpoint: `DELETE /users/me`
- [ ] **IMPORTANTE**: Não deletar dados fiscais obrigatórios (5 anos de retenção)

**Estratégias de deleção**:

**Opção 1: Soft Delete (Recomendado)**
```typescript
@Column({ default: false })
isDeleted: boolean;

@Column({ nullable: true })
deletedAt: Date;

// Anonimizar dados pessoais
async anonymizeUser(userId: string) {
  await this.userRepository.update(userId, {
    email: `deleted_${userId}@anonymized.local`,
    name: 'Usuário Excluído',
    cpf: null,
    phone: null,
    isDeleted: true,
    deletedAt: new Date()
  });

  // Manter pedidos para histórico fiscal, mas anonimizar
  await this.orderRepository.update(
    { userId },
    {
      customerName: 'Cliente Excluído',
      customerEmail: `deleted_${userId}@anonymized.local`
    }
  );
}
```

**Opção 2: Hard Delete com Retenção Fiscal**
- Deletar dados pessoais (nome, email, telefone, CPF)
- Manter pedidos/pagamentos arquivados por 5 anos (obrigação fiscal)
- Converter orders para "órfãs" (sem vínculo com user)

#### 4.5 Direito de Oposição

**Requisito**: Usuário pode se opor a certos tratamentos (ex: marketing)

**Implementação**:
- [ ] Checkbox "Desejo receber emails marketing" no perfil (pode desmarcar)
- [ ] Link "Descadastrar" em todos os emails marketing
- [ ] Endpoint: `POST /users/me/unsubscribe`

#### 4.6 Direito de Revogação do Consentimento

**Requisito**: Usuário pode revogar consentimentos dados anteriormente

**Implementação**:
- [ ] Seção "Consentimentos" no perfil
- [ ] Lista todos os consentimentos ativos
- [ ] Toggle para revogar cada um
- [ ] Endpoint: `POST /users/me/consents/:id/revoke`

**Frontend (ProfileComponent)**:
```html
<h3>Gerenciar Consentimentos</h3>
<ul>
  <li>
    <p-checkbox [(ngModel)]="marketingEmails" (onChange)="updateConsent('marketing_emails', $event)" />
    <label>Receber emails com ofertas e novidades</label>
  </li>
  <li>
    <p-checkbox [(ngModel)]="cpfStorage" (onChange)="updateConsent('cpf_storage', $event)" />
    <label>Armazenar meu CPF para nota fiscal</label>
  </li>
</ul>
```

### 5. Segurança dos Dados

#### 5.1 Criptografia

- [ ] **Em trânsito**: HTTPS em todas as páginas (SSL/TLS)
- [ ] **Em repouso**: Dados sensíveis criptografados no banco
  - [ ] Senhas: bcrypt ou argon2 (hashing, não criptografia)
  - [ ] CPF: AES-256 (se armazenado)
  - [ ] Cartões: **NUNCA** armazenar (usar tokenização do gateway)

**Exemplo (CPF encryption)**:
```typescript
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LENGTH = 16;

export function encryptCpf(cpf: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(cpf, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptCpf(encrypted: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

#### 5.2 Controle de Acesso

- [ ] **Autenticação forte**: JWT + refresh tokens (httpOnly cookies)
- [ ] **Autorização por roles**: Admin vs User
- [ ] **Logs de acesso**: Quem acessou quais dados e quando
- [ ] **Princípio do menor privilégio**: Usuário só vê seus próprios dados

**Audit Logs**:
```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Quem fez a ação

  @Column()
  action: string; // 'user.view', 'order.update', 'data.export'

  @Column()
  resourceType: string; // 'user', 'order', 'payment'

  @Column()
  resourceId: string; // ID do recurso acessado

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;
}
```

#### 5.3 Proteção Contra Vulnerabilidades

- [ ] **SQL Injection**: Usar ORM (TypeORM, Prisma) com queries parametrizadas
- [ ] **XSS**: Sanitizar inputs, usar Angular's DomSanitizer
- [ ] **CSRF**: Tokens CSRF em formulários sensíveis
- [ ] **Brute Force**: Rate limiting em endpoints de login (5 tentativas/min)
- [ ] **Exposição de dados**: Não retornar senhas/tokens em responses

### 6. Vendor Management (DPAs)

**Data Processing Agreements**: Contratos com terceiros que processam dados

**Vendors do seu e-commerce**:

| Vendor | Dados Compartilhados | Finalidade | DPA Necessário? |
|--------|---------------------|------------|----------------|
| **Mercado Pago** | Nome, email, valor da compra | Processamento de pagamento | ✅ Sim |
| **Cloudinary** | Imagens de avatar | Hospedagem de mídia | ✅ Sim |
| **Hosting (AWS/Vercel)** | Todos os dados do BD | Infraestrutura | ✅ Sim |
| **Email Service (SendGrid)** | Email, nome | Emails transacionais | ✅ Sim |
| **Google Analytics** | IP (anonimizado), behavior | Analytics | ✅ Sim |
| **Correios/Melhor Envio** | Endereço de entrega | Cálculo de frete | ✅ Sim |

**O que incluir em DPAs**:
- Tipo de dados processados
- Finalidade do processamento
- Prazo de retenção
- Medidas de segurança do vendor
- Compromisso de conformidade LGPD
- Procedimento de notificação de incidentes

**Como obter DPAs**:
1. Verificar se vendor oferece DPA padrão (maioria tem em site)
2. Se não, solicitar via suporte/contato comercial
3. Arquivar cópias assinadas (digitalmente ok)

### 7. Data Protection Officer (DPO)

**Quando é obrigatório ter DPO**:
- Órgãos públicos
- Atividades principais envolvem **monitoramento regular e sistemático** de titulares
- Atividades principais envolvem **tratamento de dados sensíveis** em larga escala

**Para e-commerce médio/pequeno**: Não obrigatório, mas recomendado

**Alternativas**:
- **Encarregado interno**: Funcionário treinado em LGPD
- **DPO terceirizado**: Contratar consultoria
- **Email de contato**: `dpo@suaempresa.com.br` ou `privacidade@suaempresa.com.br`

**Responsabilidades do DPO**:
- Informar e aconselhar sobre obrigações LGPD
- Monitorar conformidade
- Ser ponto de contato com a ANPD (Autoridade Nacional)
- Responder solicitações de titulares (exportação, deleção, etc.)

### 8. Treinamento de Equipe

- [ ] **Onboarding**: Treinamento LGPD para todos os funcionários
- [ ] **Desenvolvedores**: Práticas de segurança (não logar dados sensíveis, criptografia)
- [ ] **Atendimento**: Como responder solicitações de titulares
- [ ] **Marketing**: Consentimento em campanhas, opt-out
- [ ] **Periodicidade**: Revisão anual do treinamento

### 9. Plano de Resposta a Incidentes

**Incidente de Segurança**: Violação de dados (data breach)

**Exemplos**:
- Banco de dados vazado (hacker)
- Funcionário acessou dados sem autorização
- Dados enviados para destinatário errado

**Procedimento obrigatório**:
1. **Detectar**: Sistema de monitoramento alerta anomalias
2. **Conter**: Isolar sistemas afetados imediatamente
3. **Avaliar**: Gravidade (quantos afetados, tipo de dados)
4. **Notificar ANPD**: **Prazo razoável** (interpretação: 72h como GDPR)
5. **Notificar Titulares**: Se risco relevante a direitos/liberdades
6. **Documentar**: Relatório completo do incidente
7. **Mitigar**: Corrigir vulnerabilidade, reforçar segurança

**O que notificar à ANPD**:
- Natureza dos dados afetados
- Titulares envolvidos (quantidade)
- Medidas técnicas de segurança existentes
- Riscos relacionados ao incidente
- Motivos da demora (se aplicável)
- Medidas adotadas para reverter/mitigar

**Template de email para titulares**:
```
Assunto: Importante: Notificação de Incidente de Segurança

Prezado [Nome],

Estamos escrevendo para informá-lo sobre um incidente de segurança que pode ter afetado seus dados pessoais.

O QUE ACONTECEU:
Em [data], identificamos [descrição breve do incidente].

DADOS AFETADOS:
Os seguintes dados podem ter sido expostos: [listar: email, nome, endereço, etc.]
Dados NÃO afetados: Senhas (criptografadas), dados de pagamento (não armazenados).

O QUE ESTAMOS FAZENDO:
- [Medida 1: Ex: Corrigimos a vulnerabilidade]
- [Medida 2: Ex: Reforçamos monitoramento]
- [Medida 3: Ex: Notificamos autoridades competentes]

O QUE VOCÊ DEVE FAZER:
- Alterar sua senha [link]
- Ficar atento a emails suspeitos (phishing)
- Monitorar suas contas bancárias

MAIS INFORMAÇÕES:
Entre em contato conosco pelo email dpo@suaempresa.com.br

Pedimos desculpas pelo ocorrido e reforçamos nosso compromisso com a privacidade.

Atenciosamente,
[Sua Empresa]
```

### 10. Política de Retenção de Dados

**Por quanto tempo manter dados?**

| Tipo de Dado | Prazo de Retenção | Base Legal |
|-------------|-------------------|-----------|
| **Dados cadastrais** | Enquanto conta ativa + 5 anos | Execução de contrato + obrigação fiscal |
| **Histórico de pedidos** | 5 anos após entrega | Obrigação fiscal (Receita Federal) |
| **Dados de pagamento** | 5 anos | Obrigação fiscal |
| **CPF (nota fiscal)** | 5 anos | Obrigação fiscal |
| **Logs de acesso** | 6 meses a 1 ano | Segurança da informação |
| **Emails marketing** | Até revogação do consentimento | Consentimento |
| **Cookies analytics** | 12-24 meses | Consentimento |

**Auto-delete policies**:
```typescript
// Cron job diário para deletar dados expirados
@Cron('0 2 * * *') // 2AM todos os dias
async cleanupExpiredData() {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  // Deletar contas inativas há mais de 5 anos
  await this.userRepository.softDelete({
    lastLoginAt: LessThan(fiveYearsAgo)
  });

  // Deletar logs de acesso antigos (1 ano)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  await this.auditLogRepository.delete({
    timestamp: LessThan(oneYearAgo)
  });

  this.logger.log('Expired data cleanup completed');
}
```

---

## 🚨 Penalidades por Não Conformidade

### Sanções da ANPD

1. **Advertência** (com prazo para correção)
2. **Multa simples**: Até 2% do faturamento (máximo R$ 50 milhões por infração)
3. **Multa diária**: Até limite máximo
4. **Publicização da infração**: Nome da empresa divulgado publicamente
5. **Bloqueio dos dados pessoais**: Até regularização
6. **Eliminação dos dados**: Destruição obrigatória

### Fatores Agravantes

- Reincidência
- Dolo (má-fé)
- Gravidade/natureza das infrações
- Prejuízos causados
- Cooperação do infrator (atenuante se colaborar)

### Processos Judiciais

- Titulares podem processar por **danos morais** (violação de privacidade)
- Empresas podem ser responsabilizadas civilmente

---

## 📊 Estatísticas LGPD (2025)

- **80% das empresas brasileiras** ainda não estão totalmente em conformidade
- **ANPD recebeu +15.000 reclamações** desde 2021
- **Setor de e-commerce/retail** é um dos mais fiscalizados
- **Multas aplicadas**: Ainda poucas (ANPD focou em educação nos primeiros anos)
- **Tendência**: Fiscalização mais rigorosa a partir de 2025

---

## 🎯 Roadmap de Implementação

### Fase 1: Documentação Legal (1 semana)
- [ ] Criar Privacy Policy (com advogado ou template adaptado)
- [ ] Criar Terms of Service
- [ ] Criar Cookie Policy
- [ ] Revisar com advogado especializado LGPD

### Fase 2: Sistema de Consentimentos (1 semana)
- [ ] Checkboxes de consentimento em registro
- [ ] Cookie banner
- [ ] Tabela `user_consents` no banco
- [ ] Endpoints para gerenciar consentimentos

### Fase 3: Direitos dos Titulares (2 semanas)
- [ ] Endpoint de exportação de dados (`GET /users/me/export`)
- [ ] Endpoint de deleção de conta (`DELETE /users/me`)
- [ ] Página de perfil com gerenciamento de dados
- [ ] Testes end-to-end

### Fase 4: Segurança (ongoing)
- [ ] Criptografia de dados sensíveis (CPF)
- [ ] Audit logs implementados
- [ ] Rate limiting em APIs críticas
- [ ] Penetration testing (contratar especialista)

### Fase 5: Vendor Management (1 semana)
- [ ] Mapear todos os vendors
- [ ] Solicitar/assinar DPAs
- [ ] Atualizar Privacy Policy com lista de vendors

### Fase 6: Processos Internos (1 semana)
- [ ] Nomear DPO ou encarregado
- [ ] Criar plano de resposta a incidentes
- [ ] Treinamento da equipe
- [ ] Política de retenção documentada

### Fase 7: Auditoria e Certificação (1 mês)
- [ ] Audit interno de conformidade
- [ ] Contratar consultoria externa (recomendado)
- [ ] Corrigir gaps identificados
- [ ] Obter certificação LGPD (opcional mas diferencial)

---

## 📚 Recursos Adicionais

### Legislação e Autoridades

- [Lei nº 13.709/2018 (LGPD) - Texto Completo](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd/pt-br)
- [Guia Prático da ANPD](https://www.gov.br/anpd/pt-br/assuntos/noticias)

### Templates e Ferramentas

- [Privacy Policy Generator](https://privacypolicies.com/) (adaptável para Brasil)
- [Termos de Uso Generator](https://www.termsofservicegenerator.net/)
- [LGPD Checklist (Serpro)](https://www.serpro.gov.br/lgpd)

### Consultorias e Certificações

- **Consultoria jurídica**: Buscar advogados especializados em LGPD
- **Certificação LGPD**: EXIN Privacy & Data Protection Foundation
- **Treinamento**: Cursos de LGPD para equipes (Senai, Sebrae)

---

## ⚠️ Dicas Práticas

### Do's ✅

- ✅ **Menos é mais**: Colete apenas dados essenciais
- ✅ **Transparência**: Seja claro sobre o que faz com dados
- ✅ **Opt-in, não opt-out**: Checkboxes não pré-marcados
- ✅ **Facilite exercício de direitos**: Botões claros no perfil
- ✅ **Documente tudo**: Mantenha registros de decisões e consentimentos
- ✅ **Criptografia**: Dados sensíveis sempre protegidos
- ✅ **Teste regularmente**: Simule solicitação de dados, deleção de conta

### Don'ts ❌

- ❌ **Nunca venda dados**: Sem consentimento explícito
- ❌ **Não force consentimento**: "Aceitar para continuar" em serviços não-essenciais
- ❌ **Não misture finalidades**: Dados de entrega ≠ marketing
- ❌ **Não ignore solicitações**: Titular pede dados → responda em até 15 dias (prazo razoável)
- ❌ **Não armazene desnecessariamente**: Se não precisa, não colete
- ❌ **Nunca guarde senhas em texto plano**: Sempre hash (bcrypt/argon2)
- ❌ **Não ignore incidentes**: Breach → notificar ANPD e titulares

---

## 📞 Contato e Suporte

**Email do DPO**: dpo@suaempresa.com.br
**Email Alternativo**: privacidade@suaempresa.com.br
**Telefone**: (11) 1234-5678
**Endereço**: [Seu endereço comercial]

**Prazo de resposta**: Até 15 dias úteis para solicitações de titulares

---

**Última atualização**: 2025-11-23
**Versão da LGPD**: Lei nº 13.709/2018 (com alterações pela Lei nº 13.853/2019)
**Disclaimer**: Este documento é informativo. Consulte advogado especializado para orientação legal específica.

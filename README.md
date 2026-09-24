# PRAKABÁ — Sistema de Gestão

🍪 Prakabá de tão bom!

Sistema web de gestão operacional para a confeitaria PRAKABÁ: vendas presenciais, reservas/encomendas, produtos, estoque, produção, clientes, financeiro básico e dashboard.

## Stack

- Next.js (App Router) + TypeScript (strict) + React
- Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Zod + React Hook Form
- Vitest (unit) + Playwright (E2E)

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Supabase local

Requer [Docker](https://www.docker.com/) e a [Supabase CLI](https://supabase.com/docs/guides/cli) (já incluída como dependência via `npx supabase`).

```bash
npx supabase start
```

Isso aplica automaticamente as migrations em `supabase/migrations/` e imprime a `URL` e a `anon key` locais.

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores impressos por `supabase start`:

```bash
cp .env.example .env.local
```

### 4. Rodar a aplicação

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O sistema redireciona para `/login`; use `/signup` para criar a primeira confeitaria (organização) e o usuário OWNER.

## Testes

```bash
npm test          # testes unitários (Vitest)
npm run test:e2e  # testes end-to-end (Playwright, requer app + Supabase rodando)
```

## Estrutura do projeto

```
src/
  app/
    (auth)/         # login, signup
    (app)/          # área autenticada: dashboard, pdv, estoque, etc.
    onboarding/      # criação da organização no primeiro acesso
  components/
    ui/              # primitivos de UI (estilo shadcn/ui)
    brand/           # identidade visual PRAKABÁ
    layout/          # sidebar, header, navegação
  lib/
    supabase/        # clients browser/server + tipos do banco
    auth/            # helpers de sessão/perfil autenticado
    validations/     # schemas Zod
  domain/            # regras de negócio (a crescer nas próximas fases)
supabase/
  migrations/        # schema SQL versionado
tests/
  unit/              # Vitest
  e2e/               # Playwright
```

## Roadmap

Todas as fases da V1 estão concluídas:

1. **Fundação** — autenticação, organizações, roles, RLS, layout, design system, convite de usuários
2. **Produtos + Estoque** — categorias, ingredientes/insumos, fornecedores, movimentações, fichas técnicas com custo
3. **Clientes + Reservas** — cadastro de clientes, reservas com itens dinâmicos, status e pagamento parcial
4. **PDV (venda presencial)** — abertura/fechamento de caixa, venda rápida, diferença de caixa
5. **Produção** — ordens de produção, sugestão por demanda, consumo automático de ingredientes via ficha técnica
6. **Financeiro** — contas a pagar e a receber, categorias, reservas com saldo pendente
7. **Dashboard + Relatórios** — indicadores por período, gráficos (faturamento, canal, pagamento, produtos), exportação CSV

Próximos passos possíveis (fora do escopo da V1): integração real de WhatsApp para notificações, emissão fiscal, app mobile nativo.

## Segurança

- Todas as tabelas de domínio possuem `organization_id` e Row Level Security habilitada — o isolamento entre organizações é garantido no banco, não apenas no frontend.
- Nenhuma service role key é usada no cliente; toda validação de negócio crítica roda no servidor.

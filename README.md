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

O desenvolvimento segue fases incrementais:

1. **Fundação** (concluída) — autenticação, organizações, roles, RLS, layout, design system
2. Produtos + Estoque
3. Clientes + Reservas
4. PDV (venda presencial)
5. Produção
6. Financeiro
7. Dashboard + Relatórios

## Segurança

- Todas as tabelas de domínio possuem `organization_id` e Row Level Security habilitada — o isolamento entre organizações é garantido no banco, não apenas no frontend.
- Nenhuma service role key é usada no cliente; toda validação de negócio crítica roda no servidor.

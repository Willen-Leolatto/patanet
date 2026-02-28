# Patch CSAE / Child Safety — PataNet (24/02/2026)

## O que foi implementado

### 1) Páginas **in-app** (experiência dentro do app)
Rotas públicas (não exigem login):
- **/seguranca-infantil** — Padrões de Segurança Infantil (CSAE)
- **/privacidade** — Política de Privacidade (resumo)
- **/denuncia** — Canal de Denúncia (botões via e-mail)

> Essas rotas ficam acessíveis mesmo sem sessão, para cumprir o requisito do Google Play de “in-app experience”.

### 2) Botões de denúncia (sem backend)
Conforme solicitado, as denúncias abrem o cliente de e-mail via `mailto:` apontando para:
- **dev.patanet@gmail.com**

Implementado:
- Feed (card do post): botões **Denunciar** e **CSAE** + item no menu
- Perfil (card do usuário): botões **Denunciar** e **CSAE**

### 3) HTMLs estáticos (para hospedagem externa)
Arquivos em `public/` (e também copiados para `dist/` após build):
- `seguranca-infantil.html`
- `privacidade.html`
- `denuncia.html`

## Arquivos principais alterados
- `src/routes.jsx` (incluiu rotas públicas)
- `src/layouts/AppShell.jsx` (permitiu essas rotas sem login)
- `src/components/nav/SideBar.jsx` (links internos no menu)
- `src/features/feed/pages/Feed.jsx` (denúncia de post via mailto)
- `src/features/users/pages/UserProfile.jsx` (denúncia de usuário via mailto)
- `src/features/policy/pages/ChildSafety.jsx` (novo)
- `src/features/policy/pages/Privacy.jsx` (novo)
- `src/features/policy/pages/ReportChannel.jsx` (novo)

## Como testar local
```bash
cd patanet
npm install
npm run dev
```
Acesse:
- http://localhost:5173/seguranca-infantil
- http://localhost:5173/privacidade
- http://localhost:5173/denuncia

## Como gerar build
```bash
cd patanet
npm install
npm run build
npm run preview
```
Após `build`, os HTMLs ficam em `patanet/dist/`:
- `dist/seguranca-infantil.html`
- `dist/privacidade.html`
- `dist/denuncia.html`

## O que preencher no Google Play Console
Na seção relacionada a **Child Safety Standards / CSAE**, use as URLs públicas do seu domínio (exemplos):
- https://patanet.app.br/seguranca-infantil
- https://patanet.app.br/privacidade
- https://patanet.app.br/denuncia

E mantenha também os equivalentes HTML (se preferir anexar/usar como referência):
- https://patanet.app.br/seguranca-infantil.html
- https://patanet.app.br/privacidade.html
- https://patanet.app.br/denuncia.html

## Observações
- Não foi criado backend de denúncias (conforme combinado). O fluxo é via e-mail.
- Se você usa um domínio diferente, ajuste apenas as URLs no Console; no app as rotas são relativas.

# Guia Operacional: Autenticação GitHub, Sincronização Local e Deploy na VPS Hostinger

Este documento consolida os comandos exatos para configurar a autenticação do GitHub em qualquer máquina de desenvolvimento (Windows, Linux ou macOS), realizar o push das alterações do monorepo **Patanet** e orquestrar a sincronização contínua com a **VPS Hostinger**.

---

## 1. Configuração de Autenticação GitHub (Em Nova Máquina ou Ambiente)

Ao clonar ou dar push a partir de um novo ambiente de desenvolvimento, utilize uma das opções abaixo para autenticar sua conta (`Willen-Leolatto`).

### Opção A: Login Direto via GitHub CLI (Recomendado — 30 segundos)

1. No terminal do seu ambiente, execute:
   ```bash
   gh auth login -h github.com -w
   ```
2. Selecione o protocolo **HTTPS** e confirme para autenticar o Git com suas credenciais.
3. O terminal exibirá um código de uso único (ex: `1234-ABCD`) e abrirá o navegador em:
   ```
   https://github.com/login/device
   ```
4. Digite ou cole o código e clique em **Authorize github**.
5. Teste o status da autenticação:
   ```bash
   gh auth status
   ```

---

### Opção B: Configuração via Chave SSH (Ambientes Headless / Sem Navegador)

1. Gere um novo par de chaves SSH (ed25519):
   ```bash
   ssh-keygen -t ed25519 -C "willen.leolatto@gmail.com" -f ~/.ssh/id_ed25519_patanet -N ""
   ```
   *(No Windows PowerShell, use `$env:USERPROFILE\.ssh\id_ed25519_patanet`)*.

2. Visualize a chave pública gerada:
   ```bash
   cat ~/.ssh/id_ed25519_patanet.pub
   ```

3. Cadastre a chave pública na sua conta do GitHub:
   - Acesse: **https://github.com/settings/keys**
   - Clique em **New SSH key**, insira um título (ex: `PC-Trabalho-Patanet`) e cole o conteúdo da chave pública.

4. Configure o arquivo `~/.ssh/config` para usar a chave automaticamente:
   ```ini
   Host github.com
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519_patanet
       IdentitiesOnly yes
   ```

5. Aponte o repositório local para a URL SSH:
   ```bash
   git remote set-url origin git@github.com:Willen-Leolatto/patanet.git
   ```

---

## 2. Comandos de Push e Sincronização Local

Com a autenticação liberada, envie as branches e tags atualizadas do monorepo:

```bash
# Enviar a branch de desenvolvimento (dev)
git push origin dev

# Enviar a branch de producao (main) com as tags historicas
git push origin main --tags
```

### Consulta ao Histórico Legado (Submódulos Anteriores)
Caso precise auditar o estado antigo baseado em submódulos separados:
```bash
# Alternar para a branch de legado
git checkout legacy/submodules-v1

# Ou alternar para a tag historica imutavel
git checkout v1.0.0-legacy-submodules

# Restaurar repositorios individuais a partir dos backups autônomos (.bundle)
git clone backups/git-legacy/api-legacy.bundle api-restaurada
git clone backups/git-legacy/app-legacy.bundle app-restaurado
git clone backups/git-legacy/vision-legacy.bundle vision-restaurado
```

---

## 3. Comandos de Sincronização e Deploy na VPS Hostinger (`72.60.245.7`)

A VPS Hostinger executa o backend da API sob o processo PM2 (`nestjs-app`) e proxy reverso Nginx em `api.patanet.app.br`.

### Conectar na VPS via SSH
A partir de uma máquina autorizada:
```bash
ssh -i ~/.ssh/vps-claude root@72.60.245.7
```

### Executar a Sincronização e Deploy Automático
O script `/root/sync-patanet.sh` já está provisionado e configurado na VPS. Para atualizar a aplicação:

```bash
# Para atualizar com a branch dev:
/root/sync-patanet.sh dev

# Para atualizar o ambiente de producao com a branch main:
/root/sync-patanet.sh main
```

#### O que o script de deploy executa internamente:
1. Puxa as alterações do repositório unificado `https://github.com/Willen-Leolatto/patanet.git` em `/root/patanet`.
2. Preserva e sincroniza o `.env` com as credenciais de produção.
3. Instala dependências com `pnpm install`.
4. Compila a API NestJS (`pnpm build`).
5. Recarrega o PM2 (`pm2 reload nestjs-app`) sem downtime.

### Verificação de Saúde na VPS
```bash
# Ver status dos processos PM2
pm2 status

# Acompanhar logs em tempo real
pm2 logs nestjs-app --lines 50

# Testar se a API responde localmente na porta interna
curl -I http://localhost:3000/api/docs
```

---

## 4. Deploy Key da VPS (Para Repositório Privado)

Caso o repositório `patanet` venha a ser privado no futuro, cadastre a Deploy Key da VPS no GitHub:
- Acesse: **https://github.com/Willen-Leolatto/patanet/settings/keys**
- Clique em **Add deploy key**
- Nome: `Hostinger-VPS-Deploy`
- Chave:
  ```text
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHOnBE0vBDpPRXiZeLGR+GavNbpP3wNgeYlbxjjb7ev+ github-actions-deploy
  ```

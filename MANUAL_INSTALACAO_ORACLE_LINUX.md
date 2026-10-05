# 📘 Manual de Implantação e Administração no Oracle Linux
### Sistema de Gestão e Controle de Rádios Motorola DP450 (Locação Mendonça)

Este manual fornece o guia definitivo, profissional e homologado para instalar do zero, colocar em produção contínua 24/7 (com inicialização automática no boot via Systemd), configurar backups automáticos e gerenciar alterações de IP e porta no **Oracle Linux 8 e 9** (e derivados RHEL / Rocky / AlmaLinux).

---

## 📑 Sumário Executivo
1. [Requisitos do Sistema e Dependências](#1-requisitos-do-sistema-e-dependências)
2. [Passo a Passo Completo de Instalação no Terminal](#2-passo-a-passo-completo-de-instalação-no-terminal)
3. [Colocar no Ar e Inicialização Automática no Boot (Systemd + PM2)](#3-colocar-no-ar-e-inicialização-automática-no-boot-systemd--pm2)
4. [Onde e Como Alterar a PORTA da Aplicação](#4-onde-e-como-alterar-a-porta-da-aplicação)
5. [Onde e Como Alterar o Endereço IP do Servidor](#5-onde-e-como-alterar-o-endereço-ip-do-servidor)
6. [Persistência de Dados e Rotina de Backup Automático](#6-persistência-de-dados-e-rotina-de-backup-automático)
7. [Credenciais Padrão de Acesso](#7-credenciais-padrão-de-acesso)
8. [Tabela de Comandos Úteis do Administrador](#8-tabela-de-comandos-úteis-do-administrador)

---

## 1. Requisitos do Sistema e Dependências

| Componente | Especificação Homologada | Função Técnica |
| :--- | :--- | :--- |
| **Sistema Operacional** | **Oracle Linux 8 / 9** | Plataforma Enterprise com kernel UEK / RHCK |
| **Diretório da Aplicação**| `/opt/controle-radio` | Pasta oficial de instalação |
| **Node.js (Runtime)** | **v20.x LTS** | Motor de execução JavaScript do backend Express |
| **NPM (Gerenciador)** | **v10.x** | Gerenciador de módulos e dependências |
| **Compiladores C++** | `gcc-c++`, `make` | Compilação nativa de módulos C++ (`bcryptjs`, `sqlite`) |
| **Utilitários Base** | `git`, `curl`, `tar`, `unzip` | Download, descompactação e repositório |
| **Gerenciador 24/7** | **PM2** | Manter o processo ativo e religar com o Systemd no boot |
| **Firewall** | `firewalld` | Abertura persistente da porta TCP 3050 |
| **Persistência** | SQLite 3 (sql.js / fs) | Armazenamento local em `/opt/controle-radio/data/` |
| **Hardware Mínimo** | 1 vCPU, 1 GB RAM, 2 GB Disco | Consumo médio: ~70 MB de RAM |

---

## 2. Passo a Passo Completo de Instalação no Terminal

Execute todos os comandos como `root` ou com prefixo `sudo`:

### 2.1. Atualizar o Sistema e Instalar Compiladores
```bash
sudo dnf update -y
sudo dnf install -y git curl gcc-c++ make tar unzip
```

### 2.2. Instalar o Node.js 20 LTS e o PM2 Global
```bash
# 1. Adicionar o repositório oficial NodeSource para Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# 2. Instalar Node.js e NPM
sudo dnf install -y nodejs

# 3. Instalar o gerenciador PM2 globalmente
sudo npm install -g pm2

# 4. Validar as versões instaladas
node -v   # Deve exibir v20.x.x
npm -v    # Deve exibir v10.x.x
pm2 -v    # Deve exibir a versão do PM2
```

### 2.3. Criar a Pasta Oficial e Extrair os Arquivos
```bash
# 1. Criar o diretório oficial
sudo mkdir -p /opt/controle-radio
sudo chown -R $USER:$USER /opt/controle-radio
cd /opt/controle-radio

# 2. Extrair o arquivo do projeto (.zip):
unzip controle-radio.zip -d /opt/controle-radio
# (ou se estiver clonando do repositório Git: git clone <url> .)
```

### 2.4. Instalar Dependências e Configurar o `.env`
```bash
# 1. Instalar todas as dependências do projeto
npm install

# 2. Criar o arquivo .env definindo a porta padrão 3050:
cat << 'EOF' > /opt/controle-radio/.env
PORT=3050
EOF
```

### 2.5. Compilar o Pacote de Produção
```bash
npm run build
```
*Este comando gera o pacote compilado e otimizado em `dist/` (incluindo o servidor `dist/server.cjs` e a documentação PDF oficial em `public/`).*

---

## 3. Colocar no Ar e Inicialização Automática no Boot (Systemd + PM2)

Para que a aplicação **inicie automaticamente sempre que o servidor for reiniciado, desligado ou sofrer queda de energia**, siga o procedimento homologado:

### 3.1. Criar o Arquivo de Configuração do PM2 (`ecosystem.config.cjs`)
Certifique-se de que o arquivo `/opt/controle-radio/ecosystem.config.cjs` existe com o seguinte conteúdo:

```javascript
module.exports = {
  apps: [
    {
      name: 'radios-mendonca',
      script: './dist/server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3050
      }
    }
  ]
};
```

### 3.2. Iniciar a Aplicação com o Ecossistema
```bash
cd /opt/controle-radio

# Iniciar o processo no PM2
pm2 start ecosystem.config.cjs
```

### 3.3. Salvar a Lista de Processos Ativos
```bash
pm2 save
```
*Isto grava a lista em `/root/.pm2/dump.pm2` para restauração automática.*

### 3.4. Ativar o Serviço no Systemd (Inicialização Automática no Boot)
Execute:
```bash
pm2 startup systemd
```
O comando exibirá uma linha no terminal parecida com esta:
```bash
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2-root startup systemd -u root --hp /root
```
**Copie e execute a linha inteira gerada pelo PM2 no seu terminal.**

Em seguida, garanta que o serviço do Systemd está habilitado:
```bash
sudo systemctl enable pm2-root
```

### 3.5. Liberar a Porta no Firewall do Oracle Linux
```bash
sudo firewall-cmd --permanent --add-port=3050/tcp
sudo firewall-cmd --reload

# Verificar se a porta 3050/tcp está listada:
sudo firewall-cmd --list-ports
```

### 3.6. Testar o Reinício Automático
Para ter 100% de certeza de que o servidor religa sozinho:
```bash
sudo reboot
```
Após o servidor ligar novamente, reconecte via SSH e digite:
```bash
pm2 status
```
O processo `radios-mendonca` estará com status **`online`** e o sistema já estará respondendo!

---

## 4. Onde e Como Alterar a PORTA da Aplicação

Caso necessite alterar a porta do sistema (por exemplo, mudar de **3050** para **4000** ou **8080**):

### Arquivo 1: `/opt/controle-radio/.env`
Abra o arquivo:
```bash
nano /opt/controle-radio/.env
```
Altere a linha:
```env
PORT=4000
```

### Arquivo 2: `/opt/controle-radio/ecosystem.config.cjs`
Abra o arquivo:
```bash
nano /opt/controle-radio/ecosystem.config.cjs
```
Localize o bloco `env:` e altere a propriedade `PORT`:
```javascript
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
```

### Passo Obrigatório: Liberar a Nova Porta no Firewall
```bash
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --reload
```

### Passo Obrigatório: Reiniciar o PM2 aplicando a nova porta
```bash
pm2 restart ecosystem.config.cjs --update-env
pm2 save
```

*(Se você utiliza Nginx como proxy reverso, lembre-se de alterar também a linha `proxy_pass http://127.0.0.1:4000;` dentro de `/etc/nginx/conf.d/radios.conf` e rodar `sudo systemctl reload nginx`).*

---

## 5. Onde e Como Alterar o Endereço IP do Servidor

### O Servidor Node.js Vincula em `0.0.0.0`
O código do backend foi desenvolvido para escutar em `0.0.0.0`. **Isto significa que VOCÊ NÃO PRECISA MODIFICAR NENHUM ARQUIVO DE CÓDIGO DA APLICAÇÃO para trocar de IP.**
O sistema aceita conexões automaticamente em qualquer endereço IP que a interface de rede do Oracle Linux tiver configurada.

### Como Alterar o IP no Oracle Linux
Quando a equipe de infraestrutura for alterar o IP do servidor (ex: de `10.10.5.130` para outro IP fixo):

#### Método 1 (Interface Semiformatada no Terminal - Recomendado):
```bash
sudo nmtui
```
1. Selecione **"Edit a connection"** (Editar uma conexão).
2. Escolha a sua interface de rede (ex: `ens1` ou `eth0`).
3. No campo **IPv4 CONFIGURATION**, altere o endereço IP e gateway.
4. Selecione **<OK>** e depois **<Back>**.
5. Reinicie a conexão: selecione **"Activate a connection"**, desative e reative a conexão.

#### Método 2 (Linha de Comando via `nmcli`):
```bash
# Modificar o IP:
nmcli connection modify ens1 ipv4.addresses 10.10.5.200/24 ipv4.gateway 10.10.5.1 ipv4.method manual

# Aplicar a alteração:
nmcli connection up ens1
```

#### Onde o IP fica gravado fisicamente no Oracle Linux:
No arquivo permanente do NetworkManager:
- `/etc/NetworkManager/system-connections/<nome_conexao>.nmconnection`

Assim que o novo IP estiver ativo na placa de rede, **o sistema já estará disponível imediatamente no novo IP**:
```text
http://<NOVO_IP>:3050
```

---

## 6. Persistência de Dados e Rotina de Backup Automático

Toda a persistência da aplicação é centralizada no diretório local:
- **Banco de Dados SQLite**: `/opt/controle-radio/data/radios.sqlite`
- **PDFs dos Termos Assinados**: `/opt/controle-radio/data/termos/`

### Configurar Backup Diário Automático via Crontab
Execute no terminal:
```bash
crontab -e
```
Adicione a linha abaixo para realizar um backup compactado todos os dias às **23:00**:
```cron
0 23 * * * mkdir -p /backup && tar -czf /backup/radios_$(date +\%Y\%m\%d).tar.gz /opt/controle-radio/data
```

### Procedimento de Restauração em Caso de Desastre
Para restaurar todos os dados em um servidor novo:
```bash
cd /opt/controle-radio
tar -xzf /backup/radios_AAAAMMDD.tar.gz -C /
pm2 restart radios-mendonca
```

---

## 7. Credenciais Padrão de Acesso

| Nível de Acesso | Usuário (Login) | Senha Padrão | Privilégios |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@usr` | `admin123` | Acesso irrestrito a todos os módulos, cadastros, exclusões e relatórios |
| **Operador** | `operador@usr` | `user123` | Registro de envios, retornos de manutenção e consultas |

*(Novos usuários e alteração de senhas podem ser feitos diretamente na aba **Usuários** da aplicação pelo Administrador).*

---

## 8. Tabela de Comandos Úteis do Administrador

| Ação Desejada | Comando no Oracle Linux | Finalidade |
| :--- | :--- | :--- |
| **Ver status do sistema** | `pm2 status` | Confere se o processo está online e o consumo de memória |
| **Visualizar logs em tempo real** | `pm2 logs radios-mendonca --lines 30` | Diagnóstico de requisições, erros e inicialização |
| **Reiniciar a aplicação** | `pm2 restart radios-mendonca` | Recarrega o servidor sem perda de dados |
| **Parar a aplicação** | `pm2 stop radios-mendonca` | Interrompe o processo |
| **Verificar portas abertas** | `ss -tulpn \| grep node` | Mostra a porta exata onde o Node.js está escutando |
| **Conferir firewall** | `sudo firewall-cmd --list-ports` | Confirma se a porta (ex: 3050/tcp) está liberada |
| **Testar resposta HTTP local** | `curl -I http://127.0.0.1:3050/api/health` | Deve retornar `HTTP/1.1 200 OK` |
| **Baixar Manual em PDF** | `curl -O http://127.0.0.1:3050/manual-instalacao-oracle-linux.pdf` | Baixa o PDF oficial diretamente no terminal |

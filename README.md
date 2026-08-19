# Projeto 1 - Task Manager em 3 VMs

Projeto da disciplina de Computacao em Nuvem com uma aplicacao simples de gerenciamento de tarefas distribuida em tres maquinas virtuais.

## Arquitetura

Fluxo principal:

```text
Browser -> VM proxy (NGINX) -> VM app (Node.js/Express) -> VM db (MySQL)
```

## VMs e redes

| VM | Rede | IP | Papel |
| --- | --- | --- | --- |
| VM proxy | Externa | 192.168.56.10 | Entrada HTTP pelo NGINX |
| VM proxy | Interna | 192.168.57.10 | Comunicacao com a VM app |
| VM app | Interna | 192.168.57.11 | Aplicacao Node.js/Express |
| VM db | Interna | 192.168.57.12 | Banco MySQL |

## Estrutura do repositorio

```text
app/                 Aplicacao Node.js/Express e front-end simples
infra/nginx/         Configuracao do proxy reverso
infra/mysql/         Script SQL inicial do banco
docs/                Anotacoes, evidencias de testes e apoio da apresentacao
```

## Tecnologias

- NGINX
- Node.js
- Express
- HTML, CSS e JavaScript
- MySQL

## Execucao local da aplicacao

Entre na pasta da aplicacao:

```bash
cd app
npm install
cp .env.example .env
npm start
```

A aplicacao escuta na porta `3000`.


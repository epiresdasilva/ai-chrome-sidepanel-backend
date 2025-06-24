# AI Chrome Sidepanel Backend

API REST para integração com AWS Bedrock, implementada com Node.js e Express.js, para ser implantada via Serverless Framework v3 usando AWS ECS Fargate e exposta por um Application Load Balancer.

## Estrutura do Projeto

```
.
├── Dockerfile              # Configuração para contêiner Docker
├── index.js               # Ponto de entrada da aplicação
├── package.json           # Dependências e scripts
├── routes/                # Rotas da API
│   ├── index.js           # Agregador de rotas
│   └── ask.js             # Rota para o endpoint /ask
├── services/              # Serviços da aplicação
│   └── bedrock.js         # Serviço para integração com AWS Bedrock
├── types/                 # Definições de tipos (JSDoc)
│   └── index.js           # Tipos para a aplicação
├── utils/                 # Utilitários
│   └── tokenizer.js       # Estimador de tokens
└── serverless.yml         # Configuração do Serverless Framework
```

## Funcionalidades

- Endpoint POST `/ask` que aceita um JSON com um prompt de linguagem natural
- Streaming da resposta para o cliente via Server-Sent Events (SSE)
- Integração com a AWS Bedrock usando o modelo Amazon Nova (via AWS SDK v3)
- Estimativa e limitação do número de tokens do prompt

## Requisitos

- Node.js 20.x
- AWS CLI configurado com permissões para Bedrock, ECS, ECR, etc.
- Docker instalado (para build e teste local)
- Serverless Framework v3

## Instalação

```bash
npm install
```

## Execução Local

```bash
npm run dev
```

## Deploy

### 1. Criar repositório ECR

```bash
aws ecr create-repository --repository-name ai-chrome-sidepanel-backend
```

### 2. Build e push da imagem Docker

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build --platform linux/amd64 -t ai-chrome-sidepanel-backend .
docker tag ai-chrome-sidepanel-backend:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest
```

**Nota:** O parâmetro `--platform linux/amd64` é importante para garantir compatibilidade com o ECS Fargate, especialmente ao fazer build em máquinas com chip Apple Silicon (M1/M2/M3).

### 3. Deploy com Serverless Framework

```bash
# Deploy com valores padrão
serverless deploy

# OU deploy com parâmetros personalizados
serverless deploy --param="BEDROCK_REGION=us-east-1" --param="MODEL_ID=amazon.nova-lite-v1:0" --param="ECR_REPOSITORY_URI=<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend"
```

O serverless.yml está configurado com valores padrão, mas você pode sobrescrevê-los usando os parâmetros na linha de comando conforme mostrado acima.

### 4. Atualização de Código (sem mudanças na infraestrutura)

Para atualizações que envolvem apenas mudanças no código da aplicação:

```bash
# 1. Build e push da nova imagem Docker (passos 2 acima)
docker build --platform linux/amd64 -t ai-chrome-sidepanel-backend .
docker tag ai-chrome-sidepanel-backend:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest

# 2. Forçar novo deployment no ECS (sem recriar infraestrutura)
aws ecs update-service --cluster ai-chrome-sidepanel-backend-dev --service ai-chrome-sidepanel-backend-service --region us-east-1
```

**Nota:** O comando `update-service` força o ECS a fazer pull da nova imagem e reiniciar os containers sem precisar executar `serverless deploy` novamente.

## Uso da API

### Endpoint: POST /ask

**Parâmetros obrigatórios:**
- `action`: Ação a ser executada (`resumir`, `simplificar`, `extrair_dados`, `reescrever`, `pergunta`)
- `language`: Idioma da resposta (`pt-BR`, `pt-PT`, `en`, `es`)
- `content`: Conteúdo a ser processado
- `userInput`: Pergunta do usuário (obrigatório apenas para action `pergunta`)

**Exemplo de Request - Resumir texto:**

```bash
curl -X POST https://<load-balancer-url>/ask \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resumir",
    "language": "pt-BR",
    "content": "Este é um texto longo que precisa ser resumido. Contém várias informações importantes sobre o projeto e suas funcionalidades."
  }'
```

**Exemplo de Request - Fazer pergunta:**

```bash
curl -X POST https://<load-balancer-url>/ask \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pergunta",
    "language": "pt-BR",
    "content": "A inteligência artificial é uma área da ciência da computação que se concentra na criação de sistemas capazes de realizar tarefas que normalmente requerem inteligência humana.",
    "userInput": "O que é inteligência artificial?"
  }'
```

**Response:**

O servidor responde com um stream de eventos no formato SSE (Server-Sent Events):

```
data: {"text":"Resumo do texto: Este projeto implementa funcionalidades de IA..."}

event: complete
data: {}
```

**Exemplo de teste com curl (streaming):**

```bash
curl -X POST https://<load-balancer-url>/ask \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -N \
  -d '{
    "action": "resumir",
    "language": "pt-BR",
    "content": "Texto para ser resumido aqui..."
  }'
```

Este backend foi desenvolvido para a extensão do Chrome que pode ser obtida aqui: https://github.com/epiresdasilva/ai-chrome-sidepanel-frontend
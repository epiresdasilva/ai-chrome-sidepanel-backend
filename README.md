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

## Variáveis de Ambiente para Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
BEDROCK_REGION=us-east-1
MODEL_ID=amazon.nova-lite-v1:0
PORT=3000
```

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
docker build -t ai-chrome-sidepanel-backend .
docker tag ai-chrome-sidepanel-backend:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend:latest
```

### 3. Deploy com Serverless Framework

```bash
# Deploy com valores padrão
serverless deploy

# OU deploy com parâmetros personalizados
serverless deploy --param="BEDROCK_REGION=us-east-1" --param="MODEL_ID=amazon.nova-lite-v1:0" --param="ECR_REPOSITORY_URI=<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend"
```

O serverless.yml está configurado com valores padrão, mas você pode sobrescrevê-los usando os parâmetros na linha de comando conforme mostrado acima.

## Uso da API

### Endpoint: POST /ask

**Request:**

```json
{
  "prompt": "Qual é a capital do Brasil?"
}
```

**Response:**

O servidor responde com um stream de eventos no formato SSE (Server-Sent Events):

```
data: {"text":"A capital do Brasil é Brasília"}

event: complete
data: {}
```

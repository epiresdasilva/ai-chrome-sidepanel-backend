#!/bin/bash

# Carrega variáveis do arquivo .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | sed 's/\r$//' | xargs)
fi

# Verifica se as variáveis necessárias estão definidas
if [ -z "$BEDROCK_REGION" ]; then
  echo "Erro: BEDROCK_REGION não está definido"
  exit 1
fi

if [ -z "$MODEL_ID" ]; then
  echo "Erro: MODEL_ID não está definido"
  exit 1
fi

if [ -z "$ECR_REPOSITORY_URI" ]; then
  echo "Erro: ECR_REPOSITORY_URI não está definido. Por favor, defina no arquivo .env ou como variável de ambiente."
  echo "Exemplo: ECR_REPOSITORY_URI=123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-chrome-sidepanel-backend"
  exit 1
fi

echo "Iniciando deploy com as seguintes configurações:"
echo "BEDROCK_REGION: $BEDROCK_REGION"
echo "MODEL_ID: $MODEL_ID"
echo "ECR_REPOSITORY_URI: $ECR_REPOSITORY_URI"

# Executa o deploy com o Serverless Framework
serverless deploy

echo "Deploy concluído!"

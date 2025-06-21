# Integração com Amazon Q

Este projeto pode ser integrado com o Amazon Q para fornecer respostas inteligentes através da API.

## Configuração

Para usar o Amazon Q em vez do Claude, altere o parâmetro MODEL_ID durante o deploy:

```bash
serverless deploy --param="MODEL_ID=amazon.titan-text-express-v1"
```

Ou para desenvolvimento local, altere no arquivo `.env`:

```
MODEL_ID=amazon.titan-text-express-v1
```

## Adaptação do Serviço

O serviço de Bedrock precisará ser adaptado para trabalhar com o formato específico do Amazon Q:

```javascript
// Exemplo de adaptação para Amazon Q
const request = {
  inputText: prompt,
  textGenerationConfig: {
    maxTokenCount: 1024,
    temperature: 0.7,
    topP: 0.9
  }
};
```

## Processamento de Resposta

O processamento da resposta do Amazon Q também será diferente do Claude:

```javascript
// Exemplo de processamento para Amazon Q
if (chunk.chunk && chunk.chunk.bytes) {
  const parsedChunk = JSON.parse(Buffer.from(chunk.chunk.bytes).toString());
  
  if (parsedChunk.outputText) {
    res.write(`data: ${JSON.stringify({ text: parsedChunk.outputText })}\n\n`);
  }
}
```

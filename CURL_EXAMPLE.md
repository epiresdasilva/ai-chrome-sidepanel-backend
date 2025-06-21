# Exemplos de Uso com cURL

## Chamada Local

Para testar a API localmente, você pode usar o seguinte comando curl:

```bash
curl -N -X POST \
  http://localhost:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Qual é a capital do Brasil?"
  }'
```

A opção `-N` (ou `--no-buffer`) permite ver as respostas em tempo real, já que a API responde com Server-Sent Events (SSE).

## Resposta Esperada

A resposta virá em formato de eventos SSE, algo como:

```
data: {"text":"A capital do Brasil é "}
data: {"text":"Brasília."}
event: complete
data: {}
```

## Testando com jq

Se você quiser extrair apenas o texto da resposta, pode usar o `jq`:

```bash
curl -N -X POST \
  http://localhost:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Qual é a capital do Brasil?"
  }' | grep "^data: " | sed 's/^data: //g' | jq -r '.text' | tr -d '\n'
```

Este comando irá mostrar apenas o texto da resposta, sem as marcações de evento SSE.

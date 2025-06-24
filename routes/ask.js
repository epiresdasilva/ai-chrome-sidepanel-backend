const express = require('express');
const router = express.Router();
const bedrockService = require('../services/bedrock');
const { estimateTokens } = require('../utils/tokenizer');

/**
 * Builds a prompt based on the action, language, content, and optional userInput
 * @param {Object} params - The parameters for building the prompt
 * @param {string} params.action - The action to perform (resumir, simplificar, extrair_dados, reescrever, pergunta)
 * @param {string} params.language - The language to use (pt-BR, pt-PT, en, es)
 * @param {string} params.content - The content to process
 * @param {string} [params.userInput] - The user's question (only for "pergunta" action)
 * @returns {string} The constructed prompt
 */
function buildPrompt({ action, language, content, userInput }) {
  // Language mapping for instructions
  const languageMap = {
    'pt-BR': {
      resumir: 'Resuma o seguinte texto em português brasileiro:',
      simplificar: 'Simplifique o seguinte texto para torná-lo mais fácil de entender em português brasileiro:',
      extrair_dados: 'Extraia os dados principais do seguinte texto em português brasileiro:',
      reescrever: 'Reescreva o seguinte texto em português brasileiro:',
      pergunta: 'Com base no texto a seguir, responda à pergunta em português brasileiro:'
    },
    'pt-PT': {
      resumir: 'Resuma o seguinte texto em português de Portugal:',
      simplificar: 'Simplifique o seguinte texto para torná-lo mais fácil de entender em português de Portugal:',
      extrair_dados: 'Extraia os dados principais do seguinte texto em português de Portugal:',
      reescrever: 'Reescreva o seguinte texto em português de Portugal:',
      pergunta: 'Com base no texto a seguir, responda à pergunta em português de Portugal:'
    },
    'en': {
      resumir: 'Summarize the following text in English:',
      simplificar: 'Simplify the following text to make it easier to understand in English:',
      extrair_dados: 'Extract the main data from the following text in English:',
      reescrever: 'Rewrite the following text in English:',
      pergunta: 'Based on the following text, answer the question in English:'
    },
    'es': {
      resumir: 'Resume el siguiente texto en español:',
      simplificar: 'Simplifica el siguiente texto para hacerlo más fácil de entender en español:',
      extrair_dados: 'Extrae los datos principales del siguiente texto en español:',
      reescrever: 'Reescribe el siguiente texto en español:',
      pergunta: 'Basado en el siguiente texto, responde a la pregunta en español:'
    }
  };

  // Get the instruction based on action and language
  const instruction = languageMap[language]?.[action] || languageMap['en'][action];
  
  // Build the prompt
  let prompt = `${instruction}\n\n${content}`;
  
  // Add user question if action is "pergunta"
  if (action === 'pergunta' && userInput) {
    prompt += `\n\nPergunta: ${userInput}`;
  }
  
  return prompt;
}

router.post('/', async (req, res) => {
  try {
    const { action, language, content, userInput } = req.body;
    
    // Validate required fields
    if (!action || !language || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['action', 'language', 'content'] 
      });
    }
    
    // Validate action
    const validActions = ['resumir', 'simplificar', 'extrair_dados', 'reescrever', 'pergunta'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action', 
        validActions 
      });
    }
    
    // Validate language
    const validLanguages = ['pt-BR', 'pt-PT', 'en', 'es'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ 
        error: 'Invalid language', 
        validLanguages 
      });
    }
    
    // Validate userInput for "pergunta" action
    if (action === 'pergunta' && !userInput) {
      return res.status(400).json({ 
        error: 'userInput is required for "pergunta" action' 
      });
    }

    // Estimate tokens and check if within limits
    const estimatedTokens = estimateTokens(userInput);
    const MAX_TOKENS = 4000; // Example limit
    
    if (estimatedTokens > MAX_TOKENS) {
      return res.status(400).json({ 
        error: 'Content too long', 
        estimatedTokens,
        maxTokens: MAX_TOKENS 
      });
    }

    // Build the prompt
    const prompt = buildPrompt({ action, language, content, userInput });
        
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream response
    await bedrockService.streamResponse(prompt, res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error('Error processing request:', error);
    
    // If headers haven't been sent yet, send error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // If headers have been sent (streaming started), send error as SSE
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Error during streaming' })}\n\n`);
    res.end();
  }
});

module.exports = router;

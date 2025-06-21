const { 
  BedrockRuntimeClient, 
  ConversationRole,
  ConverseStreamCommand 
} = require('@aws-sdk/client-bedrock-runtime');

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION
    });
    this.modelId = process.env.MODEL_ID;
  }

  async streamResponse(prompt, res) {
    try {
      // Create the message for Nova model
      const message = {
        content: [{ text: prompt }],
        role: ConversationRole.USER,
      };

      // Configure the streaming request
      const request = {
        modelId: this.modelId,
        messages: [message],
        inferenceConfig: {
          maxTokens: 1024,
          temperature: 0.7,
          // topP: 0.9, // Alternative: use topP instead of temperature
        },
      };

      // Send the request to the model
      const response = await this.client.send(new ConverseStreamCommand(request));

      // Process the streaming response
      for await (const chunk of response.stream) {
        if (chunk.contentBlockDelta && chunk.contentBlockDelta.delta?.text) {
          // Send the text chunk as an SSE event
          res.write(`data: ${JSON.stringify({ text: chunk.contentBlockDelta.delta.text })}\n\n`);
        }
      }
      
      // Send a completion event
      res.write(`event: complete\ndata: {}\n\n`);
    } catch (error) {
      console.error('Error streaming from Bedrock:', error);
      throw error;
    }
  }
}

module.exports = new BedrockService();

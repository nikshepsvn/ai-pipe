'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { PipelineNode } from './types';
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function executePipeline(nodes: PipelineNode[], input: string) {
  let currentInput = input;
  
  // Process each node in sequence
  for (const node of nodes) {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: node.prompt || 'You are a helpful assistant.',
      prompt: currentInput
    });
    
    currentInput = text;
  }

  return currentInput;
}
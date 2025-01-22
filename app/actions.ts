'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { PipelineNode, ProcessNode, BranchNode, LoopNode } from './types';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function evaluateCondition(prompt: string, input: string): Promise<boolean> {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are a condition evaluator. Respond with ONLY "true" or "false".',
    prompt: `${prompt}\nEvaluate this input and respond with ONLY "true" or "false":\n${input}`
  });
  
  return text.toLowerCase().trim() === 'true';
}

async function processNode(node: PipelineNode, input: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are a helpful AI assistant.',
    prompt: node.prompt.replace('{input}', input)
  });
  return text;
}

export async function executePipeline(nodes: PipelineNode[], input: string, visitedNodes = new Set<string>()) {
  let currentInput = input;
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    // Prevent infinite loops
    if (visitedNodes.has(node.id)) {
      if (visitedNodes.size > 50) { // Safety limit
        throw new Error('Pipeline execution exceeded maximum iterations');
      }
    }
    visitedNodes.add(node.id);

    try {
      switch (node.type) {
        case 'process': {
          currentInput = await processNode(node, currentInput);
          break;
        }

        case 'branch': {
          const branchNode = node as BranchNode;
          const condition = branchNode.config.condition;
          const isTrue = await evaluateCondition(condition.prompt, currentInput);
          
          // Find the next node based on condition
          const nextNodeId = isTrue ? branchNode.config.routes.true : branchNode.config.routes.false;
          const nextNode = nodes.find(n => n.id === nextNodeId);
          
          if (!nextNode) {
            throw new Error(`Branch destination node ${nextNodeId} not found`);
          }
          
          // Process the branch path recursively
          const branchResult = await executePipeline([nextNode], currentInput, visitedNodes);
          currentInput = branchResult;
          break;
        }

        case 'loop': {
          const loopNode = node as LoopNode;
          let iterationCount = 0;
          const MAX_ITERATIONS = 10; // Safety limit
          
          while (true) {
            if (iterationCount++ >= MAX_ITERATIONS) {
              throw new Error('Loop exceeded maximum iterations');
            }

            // Process the node
            currentInput = await processNode(node, currentInput);
            
            // Check if we should continue looping
            const shouldContinue = await evaluateCondition(
              loopNode.config.condition.prompt,
              currentInput
            );
            
            if (!shouldContinue) break;
          }
          break;
        }

        case 'input':
        case 'output':
          // These nodes don't modify the input
          break;
      }
    } catch (error) {
      throw new Error(`Error in ${node.type} node: ${(error as Error).message}`);
    }
  }

  return currentInput;
}

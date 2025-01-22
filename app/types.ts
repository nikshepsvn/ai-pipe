export interface PipelineNode {
    id: string;
    type: 'input' | 'process' | 'output';
    prompt: string;
    position: { x: number; y: number };
  }
// Node types
export type NodeType = 'input' | 'process' | 'output' | 'branch' | 'loop';

// Process modes and subtypes
export type ProcessMode = 'default' | 'analyze' | 'transform' | 'filter' | 'custom';
export type AnalysisType = 'sentiment' | 'quality' | 'complexity' | 'custom';
export type TransformType = 'style' | 'tone' | 'format' | 'custom';
export type FilterType = 'moderation' | 'quality' | 'length' | 'custom';

// Process configuration
export interface ProcessConfig {
  condition?: {
    type: 'branch' | 'loop';
    prompt: string;  // Prompt to evaluate condition
    // For branch: evaluate output and route accordingly
    // For loop: continue until condition is met
  };
  routes?: {
    true: string;   // Node ID to route to if condition is true
    false: string;  // Node ID to route to if condition is false
  };
}

// Base node interface
interface BaseNode {
  id: string;
  type: NodeType;
  prompt: string;
  position: { x: number; y: number };
}

// Specific node types
export interface InputNode extends BaseNode {
  type: 'input';
}

export interface ProcessNode extends BaseNode {
  type: 'process';
  config?: ProcessConfig;
}

export interface BranchNode extends BaseNode {
  type: 'branch';
  config: Required<Pick<ProcessConfig, 'condition' | 'routes'>>;
}

export interface LoopNode extends BaseNode {
  type: 'loop';
  config: Required<Pick<ProcessConfig, 'condition'>>;
}

export interface OutputNode extends BaseNode {
  type: 'output';
}

// Combined node type
export type PipelineNode = 
  | InputNode 
  | ProcessNode 
  | BranchNode 
  | LoopNode 
  | OutputNode;

// Node data for React components
export interface NodeData {
  prompt: string;
  onChange: (value: string, field?: string) => void;
  config?: ProcessConfig;
  result?: string;
  lastOutput?: string;
  iterationHistory?: Array<{
    output: string;
    continueLoop: boolean;
  }>;
}
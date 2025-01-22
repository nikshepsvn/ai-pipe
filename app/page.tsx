'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { executePipeline } from './actions';
import { PipelineNode } from './types';

// Add these styles
const flowStyles = {
  background: 'rgb(3, 7, 18)',
};

// Custom Node Components
const InputNode = ({ data }: NodeProps) => (
  <div className="relative">
    <div 
      className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]"
    >
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="font-medium mb-3 text-blue-400">Input Node</div>
      <textarea
        placeholder="Enter your input text here..."
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                   transition-colors min-h-[120px] resize-none"
        value={data.prompt}
        onChange={(e) => data.onChange(e.target.value)}
      />
      {data.lastOutput && (
        <div className="mt-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 text-sm">
          Output: {data.lastOutput}
        </div>
      )}
    </div>
  </div>
);

const ProcessNode = ({ data }: NodeProps) => (
  <div className="relative">
    <div 
      className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]"
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-green-500 !w-3 !h-3"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-green-500 !w-3 !h-3"
      />
      <div className="font-medium mb-3 text-green-400">Process Node</div>
      <textarea
        placeholder="Enter your system prompt here..."
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                   transition-colors min-h-[120px] resize-none"
        value={data.prompt}
        onChange={(e) => data.onChange(e.target.value)}
      />
      {data.lastOutput && (
        <div className="mt-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 text-sm">
          Output: {data.lastOutput}
        </div>
      )}
    </div>
  </div>
);

const OutputNode = ({ data }: NodeProps) => (
  <div className="relative">
    <div 
      className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]"
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-purple-500 !w-3 !h-3"
      />
      <div className="font-medium mb-3 text-purple-400">Output Node</div>
      <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                      min-h-[120px] whitespace-pre-wrap">
        {data.result || 'Output will appear here...'}
      </div>
    </div>
  </div>
);

const nodeTypes = {
  input: InputNode,
  process: ProcessNode,
  output: OutputNode,
};

// Add this to override ReactFlow's default node styles
const nodeDefaults = {
  style: {
    background: 'transparent',
    backgroundColor: 'transparent',
    border: 'none',
    width: 'auto',
    // Remove any padding/margin that might show the white background
    padding: 0,
    margin: 0,
  },
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [result, setResult] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: 'input' | 'process' | 'output') => {
    if ((type === 'input' || type === 'output') && 
        nodes.some(node => node.type === type)) {
      alert(`Only one ${type} node is allowed`);
      return;
    }

    const position = {
      input: { x: 250, y: 50 },
      process: { x: 250, y: 200 + (nodes.filter(n => n.type === 'process').length * 200) },
      output: { x: 250, y: 350 + (nodes.filter(n => n.type === 'process').length * 200) },
    };

    const nodeId = `${type}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type,
      position: position[type],
      data: {
        prompt: '',
        onChange: (value: string) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, prompt: value } }
                : node
            )
          );
        },
        result,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const executePipelineFlow = async () => {
    // Validate required nodes
    const inputNode = nodes.find((node) => node.type === 'input');
    const outputNode = nodes.find((node) => node.type === 'output');
    
    if (!inputNode || !outputNode) {
      alert('Pipeline requires both input and output nodes');
      return;
    }
    
    if (!inputNode.data.prompt) {
      alert('Please enter input text');
      return;
    }

    // Get connected nodes in order using edges
    const connectedNodes: Node[] = [];
    let currentNode = inputNode;
    
    while (currentNode) {
      connectedNodes.push(currentNode);
      const nextEdge = edges.find(edge => edge.source === currentNode.id);
      if (!nextEdge) break;
      currentNode = nodes.find(node => node.id === nextEdge.target) as Node;
      if (!currentNode) break;
    }

    // Validate pipeline connectivity
    if (!connectedNodes.includes(outputNode)) {
      alert('Pipeline is not fully connected');
      return;
    }

    // Get process nodes in order
    const processNodes = connectedNodes
      .filter((node) => node.type === 'process')
      .map((node) => ({
        id: node.id,
        type: 'process',
        prompt: node.data.prompt,
        position: node.position,
      }));
    try {
      let currentInput = inputNode.data.prompt;
      
      // Update input node with its output
      setNodes((nds) =>
        nds.map((node) =>
          node.id === inputNode.id
            ? { ...node, data: { ...node.data, lastOutput: currentInput } }
            : node
        )
      );

      // Process each node and update their outputs
      for (const node of connectedNodes) {
        if (node.type === 'process') {
          const response = await executePipeline(
            [{ id: node.id, type: 'process', prompt: node.data.prompt, position: node.position }] as PipelineNode[],
            currentInput
          );
          currentInput = response;

          // Update the node with its output
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, lastOutput: response } }
                : n
            )
          );
        }
      }

      // Update output node with final result
      setNodes((nds) =>
        nds.map((node) =>
          node.type === 'output'
            ? { ...node, data: { ...node.data, result: currentInput } }
            : node
        )
      );
    } catch (error) {
      alert('Error executing pipeline: ' + (error as Error).message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <div className="border-b border-gray-800 p-6 flex justify-between items-center bg-gray-900">
        <div className="flex gap-4">
          <button
            onClick={() => addNode('input')}
            disabled={nodes.some(node => node.type === 'input')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     shadow-lg hover:shadow-blue-500/20"
          >
            Add Input
          </button>
          <button
            onClick={() => addNode('process')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     transition-colors shadow-lg hover:shadow-green-500/20"
          >
            Add Process
          </button>
          <button
            onClick={() => addNode('output')}
            disabled={nodes.some(node => node.type === 'output')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     shadow-lg hover:shadow-purple-500/20"
          >
            Add Output
          </button>
        </div>
        <button
          onClick={executePipelineFlow}
          className="px-8 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-white 
                   transition-colors shadow-lg font-medium"
        >
          Execute Pipeline
        </button>
      </div>
      <div className="flex-1">
        <div 
          className="h-full w-full [&_.react-flow__node]:!bg-transparent [&_.react-flow__node]:!border-none 
                       [&_.react-flow__node]:!shadow-none [&_.react-flow__node-input]:!bg-transparent 
                       [&_.react-flow__node-default]:!bg-transparent [&_.react-flow__node-output]:!bg-transparent
                       [&_.react-flow__handle]:!border-none [&_.react-flow__pane]:!bg-gray-950"
        >
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              style: nodeDefaults.style,
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={(edgesToDelete) => setEdges(edges => edges.filter(e => 
              !edgesToDelete.find(del => del.id === e.id)
            ))}
            nodeTypes={nodeTypes}
            fitView
            style={flowStyles}
            className="!bg-gray-950"
            minZoom={0.2}
            maxZoom={1.5}
            defaultEdgeOptions={{
              style: { stroke: '#4B5563' },
              type: 'smoothstep',
            }}
            proOptions={{ hideAttribution: true }}
            nodesFocusable={false}
            nodesDraggable={true}
            edgesFocusable={true}
            edgesUpdatable={true}
          >
            <Background 
              color="#374151" 
              gap={16} 
              size={1}
              className="!bg-gray-950"
            />
            <Controls className="!bg-gray-800 !border-gray-700 !rounded-xl !overflow-hidden" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

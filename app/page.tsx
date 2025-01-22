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
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { executePipeline } from './actions';
import { NodeType, PipelineNode } from './types';

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
    <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]">
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
        placeholder="Enter your prompt... Use {input} to reference the input text"
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                   transition-colors min-h-[120px] resize-none"
        value={data.prompt}
        onChange={(e) => data.onChange(e.target.value, 'prompt')}
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

const BranchNode = ({ data }: NodeProps) => (
  <div className="relative">
    <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-yellow-500 !w-3 !h-3"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-yellow-500 !w-3 !h-3"
        id="true"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-yellow-500 !w-3 !h-3"
        id="false"
      />
      <div className="font-medium mb-3 text-yellow-400">Branch Node</div>
      <textarea
        placeholder="Enter condition prompt... Should evaluate to true/false"
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 
                   transition-colors min-h-[120px] resize-none"
        value={data.config?.condition?.prompt || ''}
        onChange={(e) => data.onChange(e.target.value, 'condition')}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="text-sm text-gray-400">True Route ID:</div>
        <input
          className="p-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
          value={data.config?.routes?.true || ''}
          onChange={(e) => data.onChange(e.target.value, 'routeTrue')}
          placeholder="Node ID for true path"
        />
        <div className="text-sm text-gray-400">False Route ID:</div>
        <input
          className="p-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
          value={data.config?.routes?.false || ''}
          onChange={(e) => data.onChange(e.target.value, 'routeFalse')}
          placeholder="Node ID for false path"
        />
      </div>
      {data.lastOutput && (
        <div className="mt-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 text-sm">
          Condition Result: {data.lastOutput}
        </div>
      )}
    </div>
  </div>
);

const LoopNode = ({ data }: NodeProps) => (
  <div className="relative">
    <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 min-w-[300px]">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-orange-500 !w-3 !h-3"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-orange-500 !w-3 !h-3"
      />
      <div className="font-medium mb-3 text-orange-400">Loop Node</div>
      <textarea
        placeholder="Enter process prompt... Use {input} to reference the input text"
        className="w-full p-3 mb-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 
                   transition-colors min-h-[80px] resize-none"
        value={data.prompt}
        onChange={(e) => data.onChange(e.target.value)}
      />
      <textarea
        placeholder="Enter condition prompt... Should evaluate to true to continue loop"
        className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 
                   placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 
                   transition-colors min-h-[80px] resize-none"
        value={data.config?.condition?.prompt || ''}
        onChange={(e) => data.onChange(e.target.value, 'condition')}
      />
      {data.iterationHistory && data.iterationHistory.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="font-medium text-sm text-orange-400">Iteration History:</div>
          {data.iterationHistory.map((iteration: { output: string; continueLoop: boolean }, index: number) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-gray-900/50 border border-gray-700"
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-orange-400">
                  Iteration {index + 1}
                </div>
                <div className="text-xs text-gray-500">
                  {iteration.continueLoop ? 'Continued' : 'Stopped'} ↓
                </div>
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {iteration.output}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.lastOutput && !data.iterationHistory && (
        <div className="mt-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 text-sm">
          Latest Output: {data.lastOutput}
        </div>
      )}
    </div>
  </div>
);

const nodeTypes = {
  input: InputNode,
  process: ProcessNode,
  branch: BranchNode,
  loop: LoopNode,
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

  const addNode = (type: NodeType) => {
    if ((type === 'input' || type === 'output') && 
        nodes.some(node => node.type === type)) {
      alert(`Only one ${type} node is allowed`);
      return;
    }

    const position = {
      input: { x: 250, y: 50 },
      process: { x: 250, y: 200 + (nodes.filter(n => n.type === 'process').length * 200) },
      branch: { x: 250, y: 200 + (nodes.filter(n => n.type === 'branch').length * 200) },
      loop: { x: 250, y: 200 + (nodes.filter(n => n.type === 'loop').length * 200) },
      output: { x: 250, y: 350 + (nodes.filter(n => n.type === 'process').length * 200) },
    };

    const nodeId = `${type}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type,
      position: position[type],
      style: nodeDefaults.style,
      data: {
        prompt: '',
        config: type === 'branch' ? {
          condition: { type: 'branch', prompt: '' },
          routes: { true: '', false: '' }
        } : type === 'loop' ? {
          condition: { type: 'loop', prompt: '' }
        } : type === 'process' ? { 
          mode: 'default' 
        } : undefined,
        onChange: (value: string, field?: string) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      ...(field === 'mode' || field === 'subtype'
                        ? {
                            config: {
                              ...node.data.config,
                              [field]: value,
                            },
                          }
                        : field === 'condition'
                        ? {
                            config: {
                              ...node.data.config,
                              condition: {
                                ...node.data.config?.condition,
                                prompt: value,
                              },
                            },
                          }
                        : field === 'routeTrue'
                        ? {
                            config: {
                              ...node.data.config,
                              routes: {
                                ...node.data.config?.routes,
                                true: value,
                              },
                            },
                          }
                        : field === 'routeFalse'
                        ? {
                            config: {
                              ...node.data.config,
                              routes: {
                                ...node.data.config?.routes,
                                false: value,
                              },
                            },
                          }
                        : { prompt: value }),
                    },
                  }
                : node
            )
          );
        },
        result: '',
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

    // Clear previous iteration history from loop nodes
    setNodes((nds) =>
      nds.map((node) =>
        node.type === 'loop'
          ? { ...node, data: { ...node.data, iterationHistory: [] } }
          : node
      )
    );

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
        } else if (node.type === 'loop') {
          let iterationCount = 0;
          const MAX_ITERATIONS = 10;
          const history: Array<{ output: string; continueLoop: boolean }> = [];

          while (iterationCount < MAX_ITERATIONS) {
            // Process the node
            const response = await executePipeline(
              [{
                id: node.id,
                type: node.type,
                prompt: node.data.prompt,
                position: node.position,
                config: {
                  condition: {
                    type: 'loop',
                    prompt: node.data.config?.condition?.prompt || ''
                  }
                }
              }] as PipelineNode[],
              currentInput
            );
            currentInput = response;

            // Check if we should continue looping
            const shouldContinue = await executePipeline(
              [{
                id: `${node.id}-condition`,
                type: 'process',
                prompt: node.data.config?.condition?.prompt || '',
                position: node.position
              }] as PipelineNode[],
              currentInput
            );

            // Add to history
            history.push({
              output: response,
              continueLoop: shouldContinue.toLowerCase().trim() === 'true'
            });

            // Update the node with latest history
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, iterationHistory: [...history] } }
                  : n
              )
            );

            if (shouldContinue.toLowerCase().trim() !== 'true') break;
            iterationCount++;
          }
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
            onClick={() => addNode('branch')}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 
                     transition-colors shadow-lg hover:shadow-yellow-500/20"
          >
            Add Branch
          </button>
          <button
            onClick={() => addNode('loop')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                     transition-colors shadow-lg hover:shadow-orange-500/20"
          >
            Add Loop
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#4B5563',
              },
            }}
            connectOnClick={false}
            onConnectStart={(_, params) => {
              const sourceNode = nodes.find(n => n.id === params.nodeId);
              if (sourceNode?.type === 'branch') {
                // Set edge style based on the handle ID (true/false)
                const color = params.handleId === 'true' ? '#22C55E' : '#EF4444';
                setEdges(eds => eds.map(e => ({
                  ...e,
                  style: { 
                    ...e.style, 
                    stroke: e.source === params.nodeId ? color : '#4B5563'
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: e.source === params.nodeId ? color : '#4B5563'
                  }
                })));
              }
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

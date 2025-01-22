# AI Pipeline Flow Builder

A Next.js application for building and executing AI pipelines using a visual flow interface.

## Overview

This application allows users to create AI processing pipelines by connecting different types of nodes:

- **Input Node**: Accepts initial text input
- **Process Node**: Applies AI transformations using GPT-4o
- **Output Node**: Displays final results

The pipeline is built using React Flow for the visual interface and OpenAI's GPT-4o for text processing.

## Core Files

### `app/types.ts`

Defines the core `PipelineNode` interface:

  ```typescript
  interface PipelineNode {
    id: string;
    type: 'input' | 'process' | 'output';
    prompt: string; 
    position: { x: number; y: number };
  }
  ```

### `app/actions.ts`

Handles server-side pipeline execution:

  ```typescript
  async function executePipeline(nodes: PipelineNode[], input: string) {
    // Processes input through each node using GPT-4o
    // Returns transformed text output
  }
  ```

### `app/page.tsx`

Main UI component featuring:

- Visual node editor with React Flow
- Custom node components (Input, Process, Output)
- Pipeline execution logic
- Real-time node updates and connections

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Set up environment variables:
   ```
   OPENAI_API_KEY=your_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start building pipelines.

## Usage

1. Add nodes using the top toolbar buttons
2. Connect nodes by dragging between handles
3. Enter prompts in Input and Process nodes
4. Click "Execute Pipeline" to run the flow
5. View results in the Output node

## Technologies

- Next.js 13+ (App Router)
- React Flow
- OpenAI GPT-4o
- TypeScript
- Tailwind CSS

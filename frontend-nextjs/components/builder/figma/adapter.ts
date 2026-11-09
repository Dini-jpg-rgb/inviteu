import type { BuilderDocument, BuilderNode } from "../model";

export interface FigmaDocumentReference {
  fileKey: string;
  nodeIds?: string[];
}

export interface FigmaDocumentAdapter {
  getNodes(reference: FigmaDocumentReference): Promise<unknown[]>;
}

export interface FigmaNodeConversion {
  nodes: BuilderNode[];
  unsupported: Array<{ nodeId: string; nodeName: string; reason: string }>;
}

export interface FigmaNodeMapper {
  map(nodes: unknown[]): FigmaNodeConversion;
}

export interface FigmaImportAdapter {
  fetch(reference: FigmaDocumentReference): Promise<unknown[]>;
  convert(nodes: unknown[]): FigmaNodeConversion;
  toBuilderDocument(result: FigmaNodeConversion): BuilderDocument;
}

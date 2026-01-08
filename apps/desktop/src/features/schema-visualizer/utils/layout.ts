/**
 * Layout Algorithms for Schema Visualization
 * Provides different layout strategies for positioning table nodes
 */

import type { Node, Edge } from "@xyflow/react";
import type {
  SchemaTable,
  SchemaRelationship,
  LayoutAlgorithm,
  ParsedSchema,
} from "@convex-panel/shared";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 200; // Base height, actual varies by field count
const NODE_PADDING = 80;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Calculate node height based on fields and expanded state
 */
export function getNodeHeight(table: SchemaTable, isExpanded: boolean): number {
  if (!isExpanded) return 60;
  const fieldCount = Math.min(table.fields.length, 8);
  const indexCount = Math.min(table.indexes.length, 3);
  return 60 + fieldCount * 24 + (indexCount > 0 ? 40 + indexCount * 20 : 0);
}

/**
 * Force-directed layout using a simple simulation
 * Improved with velocity limiting and position bounds for stability
 */
function forceDirectedLayout(
  tables: SchemaTable[],
  relationships: SchemaRelationship[],
  _expandedTables: Set<string>,
): LayoutResult {
  const nodes: Node[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  const velocities = new Map<string, { vx: number; vy: number }>();

  // Calculate layout dimensions based on table count
  const tableCount = tables.length;
  const radius = Math.max(400, Math.sqrt(tableCount) * 150);
  const centerX = radius + 100;
  const centerY = radius + 100;

  // Initialize positions in a circle with some randomness
  tables.forEach((table, i) => {
    const angle = (2 * Math.PI * i) / tableCount;
    const jitter = (Math.random() - 0.5) * 50; // Add randomness to break symmetry
    positions.set(table.name, {
      x: centerX + radius * 0.8 * Math.cos(angle) + jitter,
      y: centerY + radius * 0.8 * Math.sin(angle) + jitter,
    });
    velocities.set(table.name, { vx: 0, vy: 0 });
  });

  // Build adjacency map for force calculation
  const adjacency = new Map<string, Set<string>>();
  tables.forEach((t) => adjacency.set(t.name, new Set()));
  relationships.forEach((rel) => {
    adjacency.get(rel.from)?.add(rel.to);
    adjacency.get(rel.to)?.add(rel.from);
  });

  // Simulation parameters - tuned for stability with many relationships
  const iterations = 100;
  const initialTemperature = radius * 0.1;
  const minDistance = 100; // Minimum distance between nodes
  const idealEdgeLength = 200; // Ideal distance for connected nodes

  // Scale forces based on graph density
  const density =
    relationships.length / Math.max(1, (tableCount * (tableCount - 1)) / 2);
  const repulsionStrength = 2000 * (1 + density);
  const attractionStrength =
    0.05 / Math.max(1, Math.sqrt(relationships.length / tableCount));
  const centerGravity = 0.02;
  const maxVelocity = 50; // Maximum velocity per iteration
  const friction = 0.85; // Velocity damping

  for (let iter = 0; iter < iterations; iter++) {
    // Temperature decreases over time (simulated annealing)
    const temperature = initialTemperature * (1 - iter / iterations);

    // Reset forces
    const forces = new Map<string, { fx: number; fy: number }>();
    tables.forEach((t) => forces.set(t.name, { fx: 0, fy: 0 }));

    // Repulsion between all nodes (Coulomb's law)
    for (let i = 0; i < tableCount; i++) {
      for (let j = i + 1; j < tableCount; j++) {
        const p1 = positions.get(tables[i].name)!;
        const p2 = positions.get(tables[j].name)!;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;

        // Limit minimum distance to prevent explosion
        const effectiveDist = Math.max(dist, minDistance);
        const force = repulsionStrength / (effectiveDist * effectiveDist);

        // Normalize and apply force
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const f1 = forces.get(tables[i].name)!;
        const f2 = forces.get(tables[j].name)!;
        f1.fx -= fx;
        f1.fy -= fy;
        f2.fx += fx;
        f2.fy += fy;
      }
    }

    // Attraction for connected nodes (Hooke's law)
    relationships.forEach((rel) => {
      const p1 = positions.get(rel.from);
      const p2 = positions.get(rel.to);
      if (!p1 || !p2) return;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Spring force: pulls toward ideal edge length
      const displacement = dist - idealEdgeLength;
      const force = displacement * attractionStrength;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      const f1 = forces.get(rel.from);
      const f2 = forces.get(rel.to);
      if (f1 && f2) {
        f1.fx += fx;
        f1.fy += fy;
        f2.fx -= fx;
        f2.fy -= fy;
      }
    });

    // Center gravity to keep graph centered
    tables.forEach((table) => {
      const pos = positions.get(table.name)!;
      const force = forces.get(table.name)!;
      force.fx += (centerX - pos.x) * centerGravity;
      force.fy += (centerY - pos.y) * centerGravity;
    });

    // Apply forces with velocity and position limiting
    tables.forEach((table) => {
      const pos = positions.get(table.name)!;
      const vel = velocities.get(table.name)!;
      const force = forces.get(table.name)!;

      // Update velocity with force and friction
      vel.vx = (vel.vx + force.fx) * friction;
      vel.vy = (vel.vy + force.fy) * friction;

      // Limit velocity magnitude
      const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
      const maxSpeed = maxVelocity * (temperature / initialTemperature + 0.1);
      if (speed > maxSpeed) {
        vel.vx = (vel.vx / speed) * maxSpeed;
        vel.vy = (vel.vy / speed) * maxSpeed;
      }

      // Update position
      pos.x += vel.vx;
      pos.y += vel.vy;

      // Keep nodes within reasonable bounds
      const margin = 50;
      const maxX = centerX * 2 + radius;
      const maxY = centerY * 2 + radius;
      pos.x = Math.max(margin, Math.min(maxX, pos.x));
      pos.y = Math.max(margin, Math.min(maxY, pos.y));
    });
  }

  // Create nodes with final positions
  tables.forEach((table) => {
    const pos = positions.get(table.name)!;
    nodes.push({
      id: table.name,
      type: "tableNode",
      position: { x: Math.round(pos.x), y: Math.round(pos.y) },
      data: { table },
    });
  });

  // Create edges with handle IDs
  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.from,
    target: rel.to,
    sourceHandle: "source",
    targetHandle: "target",
    type: "relationshipEdge",
    data: { relationship: rel },
  }));

  return { nodes, edges };
}

/**
 * Hierarchical layout (top to bottom)
 */
function hierarchicalLayout(
  tables: SchemaTable[],
  relationships: SchemaRelationship[],
  _expandedTables: Set<string>,
): LayoutResult {
  // Build dependency graph
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  tables.forEach((t) => {
    inDegree.set(t.name, 0);
    outgoing.set(t.name, []);
  });

  relationships.forEach((rel) => {
    inDegree.set(rel.to, (inDegree.get(rel.to) || 0) + 1);
    outgoing.get(rel.from)?.push(rel.to);
  });

  // Topological sort to determine levels
  const levels = new Map<string, number>();
  const queue: string[] = [];

  // Start with nodes that have no incoming edges
  inDegree.forEach((degree, name) => {
    if (degree === 0) {
      queue.push(name);
      levels.set(name, 0);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;

    outgoing.get(current)?.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);

      const existingLevel = levels.get(neighbor);
      const newLevel = currentLevel + 1;
      if (existingLevel === undefined || newLevel > existingLevel) {
        levels.set(neighbor, newLevel);
      }

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Handle any remaining nodes (cycles)
  tables.forEach((t) => {
    if (!levels.has(t.name)) {
      levels.set(t.name, 0);
    }
  });

  // Group by level
  const levelGroups = new Map<number, SchemaTable[]>();
  tables.forEach((t) => {
    const level = levels.get(t.name) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(t);
  });

  // Position nodes
  const nodes: Node[] = [];
  const levelY = NODE_HEIGHT + NODE_PADDING;

  levelGroups.forEach((tablesInLevel, level) => {
    const totalWidth = tablesInLevel.length * (NODE_WIDTH + NODE_PADDING);
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;

    tablesInLevel.forEach((table, i) => {
      nodes.push({
        id: table.name,
        type: "tableNode",
        position: {
          x: startX + i * (NODE_WIDTH + NODE_PADDING) + 500,
          y: level * levelY + 100,
        },
        data: { table },
      });
    });
  });

  // Create edges with handle IDs
  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.from,
    target: rel.to,
    sourceHandle: "source",
    targetHandle: "target",
    type: "relationshipEdge",
    data: { relationship: rel },
  }));

  return { nodes, edges };
}

/**
 * Circular layout
 */
function circularLayout(
  tables: SchemaTable[],
  relationships: SchemaRelationship[],
  _expandedTables: Set<string>,
): LayoutResult {
  const nodes: Node[] = [];
  const radius = Math.max(400, tables.length * 50);
  const centerX = radius + 100;
  const centerY = radius + 100;

  tables.forEach((table, i) => {
    const angle = (2 * Math.PI * i) / tables.length - Math.PI / 2;
    nodes.push({
      id: table.name,
      type: "tableNode",
      position: {
        x: centerX + radius * Math.cos(angle) - NODE_WIDTH / 2,
        y: centerY + radius * Math.sin(angle),
      },
      data: { table },
    });
  });

  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.from,
    target: rel.to,
    type: "relationshipEdge",
    data: { relationship: rel },
  }));

  return { nodes, edges };
}

/**
 * Grid layout
 */
function gridLayout(
  tables: SchemaTable[],
  relationships: SchemaRelationship[],
  _expandedTables: Set<string>,
): LayoutResult {
  const nodes: Node[] = [];
  const cols = Math.ceil(Math.sqrt(tables.length));

  tables.forEach((table, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    nodes.push({
      id: table.name,
      type: "tableNode",
      position: {
        x: col * (NODE_WIDTH + NODE_PADDING) + 100,
        y: row * (NODE_HEIGHT + NODE_PADDING) + 100,
      },
      data: { table },
    });
  });

  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.from,
    target: rel.to,
    type: "relationshipEdge",
    data: { relationship: rel },
  }));

  return { nodes, edges };
}

/**
 * Main layout function
 */
export function calculateLayout(
  schema: ParsedSchema,
  algorithm: LayoutAlgorithm,
  expandedTables: Set<string> = new Set(),
): LayoutResult {
  const tables = Array.from(schema.tables.values());
  const relationships = schema.relationships;

  console.debug(
    `[Layout] Calculating ${algorithm} layout for ${tables.length} tables and ${relationships.length} relationships`,
  );

  let result: LayoutResult;
  switch (algorithm) {
    case "force-directed":
      result = forceDirectedLayout(tables, relationships, expandedTables);
      break;
    case "hierarchical":
      result = hierarchicalLayout(tables, relationships, expandedTables);
      break;
    case "circular":
      result = circularLayout(tables, relationships, expandedTables);
      break;
    case "grid":
      result = gridLayout(tables, relationships, expandedTables);
      break;
    default:
      result = forceDirectedLayout(tables, relationships, expandedTables);
  }

  console.debug(
    `[Layout] Result: ${result.nodes.length} nodes, ${result.edges.length} edges`,
  );
  if (result.nodes.length > 0) {
    const firstNode = result.nodes[0];
    console.debug(
      `[Layout] First node position: (${firstNode.position.x.toFixed(0)}, ${firstNode.position.y.toFixed(0)})`,
    );
  }

  return result;
}

/**
 * Filter nodes and edges based on search query
 */
export function filterBySearch(
  nodes: Node[],
  edges: Edge[],
  searchQuery: string,
): { nodes: Node[]; edges: Edge[] } {
  if (!searchQuery.trim()) {
    return { nodes, edges };
  }

  const query = searchQuery.toLowerCase();
  const matchingNodeIds = new Set<string>();

  // Find matching nodes
  nodes.forEach((node) => {
    const table = node.data?.table as SchemaTable | undefined;
    if (!table) return;

    // Match table name
    if (table.name.toLowerCase().includes(query)) {
      matchingNodeIds.add(node.id);
      return;
    }

    // Match field names
    if (table.fields.some((f) => f.name.toLowerCase().includes(query))) {
      matchingNodeIds.add(node.id);
      return;
    }

    // Match index names
    if (table.indexes.some((i) => i.name.toLowerCase().includes(query))) {
      matchingNodeIds.add(node.id);
    }
  });

  // Include connected nodes
  edges.forEach((edge) => {
    if (matchingNodeIds.has(edge.source)) {
      matchingNodeIds.add(edge.target);
    }
    if (matchingNodeIds.has(edge.target)) {
      matchingNodeIds.add(edge.source);
    }
  });

  // Filter
  const filteredNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: matchingNodeIds.has(node.id) ? 1 : 0.2,
    },
  }));

  const filteredEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity:
        matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target)
          ? 1
          : 0.1,
    },
  }));

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Highlight path between two tables
 */
export function highlightPath(
  nodes: Node[],
  edges: Edge[],
  from: string,
  to: string,
): { nodes: Node[]; edges: Edge[]; path: string[] } {
  // BFS to find shortest path
  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push(edge.target);
    adjacency.get(edge.target)!.push(edge.source);
  });

  let path: string[] = [];

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const current = currentPath[currentPath.length - 1];

    if (current === to) {
      path = currentPath;
      break;
    }

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...currentPath, neighbor]);
      }
    }
  }

  if (path.length === 0) {
    return { nodes, edges, path: [] };
  }

  const pathSet = new Set(path);
  const pathEdges = new Set<string>();

  for (let i = 0; i < path.length - 1; i++) {
    const edgeId = edges.find(
      (e) =>
        (e.source === path[i] && e.target === path[i + 1]) ||
        (e.source === path[i + 1] && e.target === path[i]),
    )?.id;
    if (edgeId) pathEdges.add(edgeId);
  }

  const highlightedNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: pathSet.has(node.id) ? 1 : 0.2,
    },
  }));

  const highlightedEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: pathEdges.has(edge.id) ? 1 : 0.1,
      strokeWidth: pathEdges.has(edge.id) ? 3 : 1,
    },
  }));

  return { nodes: highlightedNodes, edges: highlightedEdges, path };
}

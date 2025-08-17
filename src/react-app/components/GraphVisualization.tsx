import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphQLNode } from '@/shared/types';
import { graphQLNodeToQuery } from '@/react-app/utils/graphql-parser';

interface GraphVisualizationProps {
  rootNode: GraphQLNode | null;
  onNodeUpdate: (updatedNode: GraphQLNode) => void;
  onQueryChange: (query: string) => void;
}

export default function GraphVisualization({ rootNode, onNodeUpdate, onQueryChange }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (!rootNode || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Container for the graph
    const container = svg.append('g');

    // Create hierarchy
    const hierarchy = d3.hierarchy(rootNode);
    const treeLayout = d3.tree<GraphQLNode>().size([height - 100, width - 300]);
    const treeData = treeLayout(hierarchy);

    // Apply additional spacing between levels
    const levelSpacing = 180; // Increased spacing between levels
    treeData.descendants().forEach(d => {
      d.y = d.depth * levelSpacing;
    });

    // Position variables nodes independently (floating near operation node)
    const variablesNodes = treeData.descendants().filter((d: any) => d.data.type === 'variables');
    variablesNodes.forEach((d: any, index: number) => {
      d.y = 20; // Position close to the operation node
      d.x = d.x - 80 - (index * 60); // Offset above the operation node, with spacing for multiple variables nodes
    });

    // Filter out links that involve variables nodes
    const filteredLinks = treeData.links().filter((link: any) => 
      link.source.data.type !== 'variables' && link.target.data.type !== 'variables'
    );

    // Draw links
    const linkGenerator = d3.linkHorizontal<any, any>()
      .x((d: any) => d.y + 120)
      .y((d: any) => d.x + 50);

    container.selectAll('.link')
      .data(filteredLinks)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroup = container.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y + 120},${d.x + 50})`);

    // Node shapes - larger to contain text, adjust for variables
    nodeGroup.append('rect')
      .attr('width', (d: any) => {
        if (d.data.type === 'variables' && d.data.variables) {
          // Calculate width based on longest line
          const lines = [d.data.name, ...Object.entries(d.data.variables).map(([key, value]) => `${key}: ${value}`)];
          const maxLength = Math.max(...lines.map(line => line.length));
          return Math.max(120, maxLength * 6 + 20);
        }
        return Math.max(80, d.data.name.length * 8 + 20);
      })
      .attr('height', (d: any) => {
        if (d.data.type === 'variables' && d.data.variables) {
          const lineCount = 1 + Object.keys(d.data.variables).length;
          return Math.max(40, lineCount * 16 + 10);
        }
        return 40;
      })
      .attr('x', (d: any) => {
        if (d.data.type === 'variables' && d.data.variables) {
          const lines = [d.data.name, ...Object.entries(d.data.variables).map(([key, value]) => `${key}: ${value}`)];
          const maxLength = Math.max(...lines.map(line => line.length));
          return -Math.max(60, maxLength * 3 + 10);
        }
        return -Math.max(40, d.data.name.length * 4 + 10);
      })
      .attr('y', (d: any) => {
        if (d.data.type === 'variables' && d.data.variables) {
          const lineCount = 1 + Object.keys(d.data.variables).length;
          return -Math.max(20, (lineCount * 16 + 10) / 2);
        }
        return -20;
      })
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d: any) => {
        switch (d.data.type) {
          case 'operation': return '#3b82f6';
          case 'field': return '#10b981';
          case 'fragment': return '#f59e0b';
          case 'variables': return '#8b5cf6';
          default: return '#6b7280';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node name labels - handle multi-line text for variables
    nodeGroup.each(function(d: any) {
      const group = d3.select(this);
      
      if (d.data.type === 'variables' && d.data.variables) {
        // Multi-line text for variables
        const lines = [d.data.name];
        Object.entries(d.data.variables).forEach(([key, value]) => {
          lines.push(`${key}: ${value}`);
        });
        
        // Adjust node height for multiple lines
        group.select('rect')
          .attr('height', Math.max(40, lines.length * 16 + 10));
        
        lines.forEach((line, index) => {
          group.append('text')
            .attr('x', 0)
            .attr('y', -8 + (index * 14))
            .attr('text-anchor', 'middle')
            .attr('font-size', index === 0 ? '12px' : '10px')
            .attr('font-weight', index === 0 ? '600' : '400')
            .attr('font-family', 'Inter, sans-serif')
            .attr('fill', '#fff')
            .text(line);
        });
      } else {
        // Single line text for other nodes
        group.append('text')
          .attr('x', 0)
          .attr('y', -4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('font-family', 'Inter, sans-serif')
          .attr('fill', '#fff')
          .text(d.data.name);
      }
    });

    // Node type labels
    nodeGroup.append('text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', '#ffffff')
      .attr('opacity', 0.8)
      .text((d: any) => d.data.type);

    // Arguments indicator
    nodeGroup
      .filter((d: any) => d.data.arguments && Object.keys(d.data.arguments).length > 0)
      .append('circle')
      .attr('r', 4)
      .attr('cx', (d: any) => Math.max(40, d.data.name.length * 4 + 10) - 8)
      .attr('cy', -12)
      .attr('fill', '#8b5cf6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .append('title')
      .text((d: any) => {
        const args = d.data.arguments;
        return Object.entries(args).map(([key, value]) => `${key}: ${value}`).join('\n');
      });

    // Delete button
    const deleteButton = nodeGroup
      .filter((d: any) => d.data.type !== 'operation')
      .append('g')
      .attr('class', 'delete-button')
      .style('opacity', 0)
      .style('cursor', 'pointer');

    deleteButton.append('circle')
      .attr('r', 8)
      .attr('cx', (d: any) => Math.max(40, d.data.name.length * 4 + 10) - 8)
      .attr('cy', 12)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    deleteButton.append('text')
      .attr('x', (d: any) => Math.max(40, d.data.name.length * 4 + 10) - 8)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .text('×');

    // Hover effects
    nodeGroup
      .on('mouseenter', function() {
        d3.select(this).select('.delete-button').style('opacity', 1);
      })
      .on('mouseleave', function() {
        d3.select(this).select('.delete-button').style('opacity', 0);
      });

    // Double-click to edit
    nodeGroup
      .style('cursor', 'pointer')
      .on('dblclick', (_, d: any) => {
        setEditingNodeId(d.data.id);
        setEditingValue(d.data.name);
      });

    // Delete functionality
    deleteButton.on('click', (_, d: any) => {
      const updatedNode = deleteNodeById(rootNode, d.data.id);
      if (updatedNode) {
        onNodeUpdate(updatedNode);
        onQueryChange(graphQLNodeToQuery(updatedNode));
      }
    });

    // Center the graph
    const bbox = container.node()?.getBBox();
    if (bbox) {
      const scale = Math.min(width / (bbox.width + 100), height / (bbox.height + 100), 1);
      const centerX = width / 2 - (bbox.x + bbox.width / 2) * scale;
      const centerY = height / 2 - (bbox.y + bbox.height / 2) * scale;
      
      svg.call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY).scale(scale));
    }

  }, [rootNode, onNodeUpdate, onQueryChange]);

  const deleteNodeById = (node: GraphQLNode, nodeId: string): GraphQLNode | null => {
    if (node.id === nodeId) {
      return null; // This node should be deleted
    }

    const updatedChildren = node.children
      .map(child => deleteNodeById(child, nodeId))
      .filter((child): child is GraphQLNode => child !== null);

    return {
      ...node,
      children: updatedChildren
    };
  };

  const updateNodeName = (node: GraphQLNode, nodeId: string, newName: string): GraphQLNode => {
    if (node.id === nodeId) {
      return { ...node, name: newName };
    }

    return {
      ...node,
      children: node.children.map(child => updateNodeName(child, nodeId, newName))
    };
  };

  const handleEditSubmit = () => {
    if (editingNodeId && rootNode) {
      const updatedNode = updateNodeName(rootNode, editingNodeId, editingValue);
      onNodeUpdate(updatedNode);
      onQueryChange(graphQLNodeToQuery(updatedNode));
    }
    setEditingNodeId(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingNodeId(null);
    setEditingValue('');
  };

  return (
    <div className="relative h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Query Structure</h2>
        {rootNode && (
          <p className="text-sm text-gray-600 mt-1">
            Double-click nodes to edit • Hover for delete option
          </p>
        )}
      </div>
      
      <div className="relative h-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        />
        
        {!rootNode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">Waiting for a valid query...</p>
              <p className="text-sm">Enter a GraphQL query in the left panel to see its structure</p>
            </div>
          </div>
        )}
      </div>

      {editingNodeId && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Field Name</h3>
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') handleEditCancel();
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

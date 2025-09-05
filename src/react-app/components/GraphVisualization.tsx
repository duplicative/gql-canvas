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

    // Create hierarchy and extract nodes and links
    const hierarchy = d3.hierarchy(rootNode);
    const nodes = hierarchy.descendants() as d3.HierarchyPointNode<GraphQLNode>[];
    const links = hierarchy.links().filter((link: any) =>
      link.source.data.type !== 'variables' && link.target.data.type !== 'variables'
    );

    // Node dimensions needed for collision detection and layout
    const getNodeDimensions = (d: any) => {
      if (d.data.type === 'variables' && d.data.variables) {
        const lines = [d.data.name, ...Object.entries(d.data.variables).map(([key, value]) => `${key}: ${value}`)];
        const maxLength = Math.max(...lines.map(line => line.length));
        const width = Math.max(120, maxLength * 6 + 20);
        const height = Math.max(40, lines.length * 16 + 10);
        return { width, height };
      }
      const width = Math.max(80, d.data.name.length * 8 + 20);
      const height = 40;
      return { width, height };
    };

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => {
        const { width, height } = getNodeDimensions(d);
        return Math.max(width, height) / 2 + 10; // Add padding
      }).strength(0.9));

    // Draw links
    const link = container.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroup = container.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node');

    // Drag functionality
    const drag = (simulation: d3.Simulation<any, any>) => {
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
    }

    nodeGroup.call(drag(simulation as any) as any);

    // Node shapes
    nodeGroup.append('rect')
      .attr('width', d => getNodeDimensions(d).width)
      .attr('height', d => getNodeDimensions(d).height)
      .attr('x', d => -getNodeDimensions(d).width / 2)
      .attr('y', d => -getNodeDimensions(d).height / 2)
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

    // Node labels
    nodeGroup.each(function(d: any) {
      const group = d3.select(this);
      const { height } = getNodeDimensions(d);
      
      if (d.data.type === 'variables' && d.data.variables) {
        const lines = [d.data.name, ...Object.entries(d.data.variables).map(([key, value]) => `${key}: ${value}`)];
        const lineHeight = 14;
        const totalTextHeight = lines.length * lineHeight;
        const startY = -totalTextHeight / 2 + lineHeight / 2;

        lines.forEach((line, index) => {
          group.append('text')
            .attr('x', 0)
            .attr('y', startY + index * lineHeight)
            .attr('text-anchor', 'middle')
            .attr('font-size', index === 0 ? '12px' : '10px')
            .attr('font-weight', index === 0 ? '600' : '400')
            .attr('font-family', 'Inter, sans-serif')
            .attr('fill', '#fff')
            .text(line);
        });
      } else {
        group.append('text')
          .attr('x', 0)
          .attr('y', -4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('font-family', 'Inter, sans-serif')
          .attr('fill', '#fff')
          .text(d.data.name);

        group.append('text')
          .attr('x', 0)
          .attr('y', 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'Inter, sans-serif')
          .attr('fill', '#ffffff')
          .attr('opacity', 0.8)
          .text(d.data.type);
      }
    });

    // UI elements like buttons, indicators
    nodeGroup.each(function(d: any) {
      const group = d3.select(this);
      const { width, height } = getNodeDimensions(d);

      // Arguments indicator
      if (d.data.arguments && Object.keys(d.data.arguments).length > 0) {
        group.append('circle')
          .attr('r', 4)
          .attr('cx', width / 2 - 8)
          .attr('cy', -height / 2 + 8)
          .attr('fill', '#8b5cf6')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .append('title')
          .text(() => Object.entries(d.data.arguments).map(([key, value]) => `${key}: ${value}`).join('\n'));
      }

      // Delete button
      if (d.data.type !== 'operation') {
        const deleteButton = group.append('g')
          .attr('class', 'delete-button')
          .style('opacity', 0)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation();
            const updatedNode = deleteNodeById(rootNode, d.data.id);
            if (updatedNode) {
              onNodeUpdate(updatedNode);
              onQueryChange(graphQLNodeToQuery(updatedNode));
            }
          });

        deleteButton.append('circle')
          .attr('r', 8)
          .attr('cx', width / 2 - 8)
          .attr('cy', height / 2 - 8)
          .attr('fill', '#ef4444');

        deleteButton.append('text')
          .attr('x', width / 2 - 8)
          .attr('y', height / 2 - 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', 'white')
          .text('×');
      }
    });

    // Hover and click effects
    nodeGroup
      .on('mouseenter', function() {
        d3.select(this).select('.delete-button').style('opacity', 1);
      })
      .on('mouseleave', function() {
        d3.select(this).select('.delete-button').style('opacity', 0);
      })
      .on('dblclick', (event, d: any) => {
        event.stopPropagation();
        setEditingNodeId(d.data.id);
        setEditingValue(d.data.name);
      });

    // Simulation tick function
    simulation.on('tick', () => {
      link
        .attr('d', d3.linkHorizontal()
          .x((d: any) => d.x)
          .y((d: any) => d.y) as any);

      nodeGroup
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom and center
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
    svg.call(zoom.transform, initialTransform);

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

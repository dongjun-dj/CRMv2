import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Customer, Department } from '../types';

interface OrgChartProps {
  companyName: string;
  customers: Customer[];
  departments: Department[];
  onSelectCustomer: (id: string) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({ companyName, customers, departments, onSelectCustomer }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filter customers by department if selected
  const filteredCustomers = selectedDept === 'all' 
    ? customers 
    : customers.filter(c => c.departmentId === selectedDept);

  // Generate hierarchy data
  const generateTreeData = () => {
    // 1. Identify roots (no manager or manager not in list)
    // 2. Build map of id -> children
    const customerMap = new Map<string, Customer>();
    filteredCustomers.forEach(c => customerMap.set(c.id, c));

    const childrenMap = new Map<string, Customer[]>();
    const roots: Customer[] = [];

    filteredCustomers.forEach(c => {
      if (c.managerId && customerMap.has(c.managerId)) {
        const siblings = childrenMap.get(c.managerId) || [];
        siblings.push(c);
        childrenMap.set(c.managerId, siblings);
      } else {
        roots.push(c);
      }
    });

    // Create a virtual root to hold everyone (The Company)
    const rootNode = {
      id: 'root-company',
      name: companyName, // Use company name here
      isVirtual: true,
      children: roots.map(root => buildNode(root, childrenMap))
    };

    return rootNode;
  };

  const buildNode = (person: Customer, childrenMap: Map<string, Customer[]>): any => {
    const children = childrenMap.get(person.id);
    return {
      ...person,
      children: children ? children.map(c => buildNode(c, childrenMap)) : undefined
    };
  };

  useEffect(() => {
    if (!containerRef.current || filteredCustomers.length === 0) return;

    const data = generateTreeData();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    // Clear previous
    d3.select(containerRef.current).selectAll("*").remove();

    const root = d3.hierarchy(data);
    
    // Set tree layout settings
    // Node size: width, height space between nodes
    const nodeWidth = 140;
    const nodeHeight = 80;
    const treeLayout = d3.tree().nodeSize([nodeWidth + 20, nodeHeight + 40]);
    
    treeLayout(root);

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('cursor', 'grab');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Initial transform to center top root
    const initialY = 50;
    const initialX = width / 2;
    // Apply initial zoom
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(initialX, initialY).scale(0.8));

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#C6C6C8')
      .attr('stroke-width', 2)
      .attr('d', d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y) as any
      );

    // Nodes Group
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .style('cursor', (d: any) => d.data.isVirtual ? 'default' : 'pointer')
      .on('click', (event, d: any) => {
        if (!d.data.isVirtual) {
          onSelectCustomer(d.data.id);
        }
      });

    // --- Node Rendering ---

    // 1. Box
    nodes.append('rect')
      .attr('x', -nodeWidth / 2)
      .attr('y', 0)
      .attr('width', nodeWidth)
      .attr('height', (d: any) => d.data.isVirtual ? 40 : nodeHeight) // Shorter box for Company Root
      .attr('rx', (d: any) => d.data.isVirtual ? 20 : 12)
      .attr('fill', (d: any) => d.data.isVirtual ? '#000000' : '#FFFFFF') // Black for Company, White for users
      .attr('stroke', (d: any) => {
        if (d.data.isVirtual) return 'none';
        return d.data.departmentId === selectedDept ? '#007AFF' : '#E5E5EA';
      })
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))');

    // 2. Avatar Circle (Only for real people)
    const peopleNodes = nodes.filter((d: any) => !d.data.isVirtual);
    
    peopleNodes.append('clipPath')
      .attr('id', (d:any) => `clip-${d.data.id}`)
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 20);

    // 3. Name
    // Company Name (Centered vertically in shorter box)
    nodes.filter((d: any) => d.data.isVirtual)
      .append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.data.name)
      .attr('font-weight', 'bold')
      .attr('fill', '#FFFFFF') // White text for company
      .attr('font-size', '16px');

    // Person Name
    peopleNodes.append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.data.name)
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .attr('font-size', '14px');

    // 4. Job Title (People only)
    peopleNodes.append('text')
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.data.jobTitle || '员工')
      .attr('fill', '#8E8E93')
      .attr('font-size', '12px');
      
    // 5. Dept Name (People only)
    peopleNodes.append('text')
      .attr('dy', 66)
      .attr('text-anchor', 'middle')
      .text((d: any) => {
        const dept = departments.find(dep => dep.id === d.data.departmentId);
        return dept ? dept.name : '';
      })
      .attr('fill', '#007AFF')
      .attr('font-size', '10px');

  }, [customers, selectedDept, departments, onSelectCustomer, companyName]);

  return (
    <div className="flex flex-col h-full bg-ios-bg">
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedDept('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedDept === 'all' ? 'bg-ios-blue text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          全部
        </button>
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDept === dept.id ? 'bg-ios-blue text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>
        {filteredCustomers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};
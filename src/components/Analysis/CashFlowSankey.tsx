import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import {
  sankey,
  sankeyLinkHorizontal,
  SankeyGraph,
  SankeyNode as D3SankeyNode,
  SankeyLink as D3SankeyLink,
} from 'd3-sankey';

interface SankeyNode {
  name: string;
  color: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export function CashFlowSankey() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  const sankeyData = useMemo(() => {
    const now = new Date();
    // Strictly last month only
    const lastMonth = subMonths(now, 1);
    const start = startOfMonth(lastMonth);
    const end = endOfMonth(lastMonth);

    // Filter last month's transactions
    const monthTransactions = transactions.filter((txn) => {
      const date = new Date(txn.date);
      return date >= start && date <= end;
    });

    // Separate income and expenses (exclude transfers)
    const incomeTransactions = monthTransactions.filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'income';
    });
    const expenseTransactions = monthTransactions.filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'expense';
    });

    // Calculate totals by category
    const incomeByCategory = incomeTransactions.reduce((acc, txn) => {
      const categoryId = txn.categoryId || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + txn.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseByCategory = expenseTransactions.reduce((acc, txn) => {
      const categoryId = txn.categoryId || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalIncome = Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenseByCategory).reduce((sum, val) => sum + val, 0);

    if (totalIncome === 0 && totalExpenses === 0) {
      return null;
    }

    // Build nodes
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Income categories (sources)
    const incomeNodeIndices: Record<string, number> = {};
    Object.entries(incomeByCategory).forEach(([categoryId]) => {
      const category = categories.find((c) => c.id === categoryId);
      incomeNodeIndices[categoryId] = nodes.length;
      nodes.push({
        name: category?.name || 'Uncategorized Income',
        color: category?.color || '#10b981',
      });
    });

    // Total income node (middle)
    const totalIncomeNodeIndex = nodes.length;
    nodes.push({
      name: 'Total Income',
      color: '#059669',
    });

    // If expenses exceed income, add a deficit source node
    const deficit = totalExpenses - totalIncome;
    let deficitNodeIndex = -1;
    if (deficit > 0) {
      deficitNodeIndex = nodes.length;
      nodes.push({
        name: 'Deficit (Credit/Savings)',
        color: '#f97316',
      });
    }

    // Expense categories (targets)
    const expenseNodeIndices: Record<string, number> = {};
    Object.entries(expenseByCategory).forEach(([categoryId]) => {
      const category = categories.find((c) => c.id === categoryId);
      expenseNodeIndices[categoryId] = nodes.length;
      nodes.push({
        name: category?.name || 'Uncategorized Expense',
        color: category?.color || '#ef4444',
      });
    });

    // Savings/surplus node
    const savings = totalIncome - totalExpenses;
    const savingsNodeIndex = nodes.length;
    if (savings > 0) {
      nodes.push({
        name: 'Savings',
        color: '#8b5cf6',
      });
    }

    // Links from income categories to total income
    Object.entries(incomeByCategory).forEach(([categoryId, amount]) => {
      links.push({
        source: incomeNodeIndices[categoryId],
        target: totalIncomeNodeIndex,
        value: amount,
      });
    });

    // Links from total income to expense categories
    Object.entries(expenseByCategory).forEach(([categoryId, amount]) => {
      if (deficit > 0) {
        // Split expense proportionally between income and deficit
        const fromIncome = amount * (totalIncome / totalExpenses);
        const fromDeficit = amount * (deficit / totalExpenses);
        links.push({
          source: totalIncomeNodeIndex,
          target: expenseNodeIndices[categoryId],
          value: fromIncome,
        });
        links.push({
          source: deficitNodeIndex,
          target: expenseNodeIndices[categoryId],
          value: fromDeficit,
        });
      } else {
        links.push({
          source: totalIncomeNodeIndex,
          target: expenseNodeIndices[categoryId],
          value: amount,
        });
      }
    });

    // Link from total income to savings
    if (savings > 0) {
      links.push({
        source: totalIncomeNodeIndex,
        target: savingsNodeIndex,
        value: savings,
      });
    }

    return { nodes, links };
  }, [transactions, categories]);

  const drawSankey = useCallback(() => {
    if (!sankeyData || !svgRef.current) return;

    const svg = svgRef.current;
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const width = svgWidth;
    const height = 500;
    const margin = { top: 20, right: 200, bottom: 20, left: 200 };

    // Create sankey generator
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(20)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    // Generate sankey layout
    const graph = sankeyGenerator({
      nodes: sankeyData.nodes.map((d) => ({ ...d })),
      links: sankeyData.links.map((d) => ({ ...d })),
    });

    // Create SVG group for links
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(linksGroup);

    // Draw links
    graph.links.forEach((link) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = sankeyLinkHorizontal()(link as any);
      if (d) {
        path.setAttribute('d', d);
        const sourceNode = link.source as any;
        path.setAttribute('stroke', sourceNode.color || '#cbd5e1');
        path.setAttribute('stroke-width', String(Math.max(1, link.width || 0)));
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.4');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        const sourceName = (link.source as any).name;
        const targetName = (link.target as any).name;
        title.textContent = `${sourceName} \u2192 ${targetName}\n${formatCurrency(link.value)}`;
        path.appendChild(title);

        linksGroup.appendChild(path);
      }
    });

    // Create SVG group for nodes
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(nodesGroup);

    // Draw nodes
    graph.nodes.forEach((node: any) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(node.x0));
      rect.setAttribute('y', String(node.y0));
      rect.setAttribute('height', String(node.y1 - node.y0));
      rect.setAttribute('width', String(node.x1 - node.x0));
      rect.setAttribute('fill', node.color);
      rect.setAttribute('opacity', '0.8');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${node.name}\n${formatCurrency(node.value)}`;
      rect.appendChild(title);

      nodesGroup.appendChild(rect);
    });

    // Create SVG group for labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(labelsGroup);

    // Draw labels
    graph.nodes.forEach((node: any) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(node.x0 < width / 2 ? node.x0 - 6 : node.x1 + 6));
      text.setAttribute('y', String((node.y1 + node.y0) / 2));
      text.setAttribute('dy', '0.35em');
      text.setAttribute('text-anchor', node.x0 < width / 2 ? 'end' : 'start');
      text.setAttribute('font-size', '12px');
      text.setAttribute('fill', 'currentColor');
      text.textContent = `${node.name} (${formatCurrency(node.value)})`;

      labelsGroup.appendChild(text);
    });
  }, [sankeyData, svgWidth]);

  // Observe container resize to keep diagram responsive
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setSvgWidth(width);
        }
      }
    });

    observer.observe(container);
    // Set initial width
    if (container.clientWidth > 0) {
      setSvgWidth(container.clientWidth);
    }

    return () => observer.disconnect();
  }, []);

  // Redraw when data or width changes
  useEffect(() => {
    drawSankey();
  }, [drawSankey]);

  if (!sankeyData) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No transaction data available for cash flow visualization
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Cash Flow Diagram
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Visualize how money flows from income sources through expenses to savings.
          Based on last month's transactions.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Money Flow (Last Month)
        </h3>

        <div ref={containerRef} className="overflow-x-auto">
          <svg
            ref={svgRef}
            width="100%"
            height="500"
            className="text-gray-900 dark:text-white"
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Savings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Deficit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

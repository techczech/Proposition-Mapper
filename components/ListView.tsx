
import React, { useState, useMemo, useEffect } from 'react';
import type { GraphData } from '../types';

interface ListViewProps {
  graphData: GraphData;
  isStudyMode: boolean;
  studyTarget: 'subject' | 'predicate' | 'object';
}

type SortKey = 'subject' | 'predicate' | 'object';
type SortDirection = 'asc' | 'desc';

const ListView: React.FC<ListViewProps> = ({ graphData, isStudyMode, studyTarget }) => {
  const [sortKey, setSortKey] = useState<SortKey>('subject');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Reset revealed items when data or study mode settings change
    setRevealed(new Set());
  }, [graphData, isStudyMode, studyTarget]);

  const handleToggleReveal = (index: number) => {
    setRevealed(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        return newSet;
    });
  };

  const termMap = useMemo(() => new Map(graphData.terms.map(t => [t.id, t.label])), [graphData.terms]);

  const propositions = useMemo(() => {
    return graphData.relationships.map(rel => ({
      subject: termMap.get(rel.source) || rel.source,
      predicate: rel.label,
      object: termMap.get(rel.target) || rel.target
    }));
  }, [graphData.relationships, termMap]);

  const sortedPropositions = useMemo(() => {
    return [...propositions].sort((a, b) => {
      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [propositions, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortArrow = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };
  
  const renderCell = (content: string, columnKey: SortKey, index: number) => {
    const isHiddenCell = isStudyMode && columnKey === studyTarget;
    if (!isHiddenCell) {
        return content;
    }
    
    const isRevealed = revealed.has(index);

    return (
        <button 
            onClick={() => handleToggleReveal(index)} 
            className="w-full h-full text-left p-0 bg-transparent border-none cursor-pointer text-inherit font-inherit"
            aria-label={isRevealed ? `Hide ${columnKey}` : `Reveal ${columnKey}`}
        >
            {isRevealed ? (
                <span>{content}</span>
            ) : (
                <span className="text-slate-400 dark:text-slate-500 font-mono select-none rounded bg-slate-200 dark:bg-slate-700 px-2 py-1">???</span>
            )}
        </button>
    );
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700 sticky top-0">
          <tr>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('subject')}>
              Subject <SortArrow columnKey="subject" />
            </th>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('predicate')}>
              Predicate <SortArrow columnKey="predicate" />
            </th>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('object')}>
              Object <SortArrow columnKey="object" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPropositions.map((p, index) => (
            <tr key={index} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                {renderCell(p.subject, 'subject', index)}
              </td>
              <td className="px-6 py-4">
                {renderCell(p.predicate, 'predicate', index)}
              </td>
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                {renderCell(p.object, 'object', index)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListView;

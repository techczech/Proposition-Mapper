
import React, { useMemo } from 'react';

interface KwicViewProps {
  text: string;
  query: string;
  matchType: 'part' | 'full';
}

interface KwicResult {
  prefix: string;
  match: string;
  suffix: string;
}

const CONTEXT_SIZE = 40; // Number of characters before and after the match

const KwicView: React.FC<KwicViewProps> = ({ text, query, matchType }) => {
  const results = useMemo((): KwicResult[] => {
    if (!query.trim()) {
      return [];
    }
    const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = matchType === 'full'
      ? new RegExp(`\\b${sanitizedQuery}\\b`, 'gi')
      : new RegExp(sanitizedQuery, 'gi');
      
    const matches = [...text.matchAll(regex)];

    return matches.map(match => {
      const startIndex = Math.max(0, match.index! - CONTEXT_SIZE);
      const endIndex = Math.min(text.length, match.index! + match[0].length + CONTEXT_SIZE);
      
      const prefix = text.substring(startIndex, match.index!);
      const suffix = text.substring(match.index! + match[0].length, endIndex);

      return {
        prefix: startIndex > 0 ? `...${prefix}` : prefix,
        match: match[0],
        suffix: endIndex < text.length ? `${suffix}...` : suffix,
      };
    });
  }, [text, query, matchType]);

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
        <h3 className="text-lg font-semibold">Search in Context</h3>
        <p className="text-sm">Type in the filter bar above to see where keywords appear in the text.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
        <h3 className="text-lg font-semibold">No Matches Found</h3>
        <p className="text-sm">Could not find "{query}" in the text.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <ul className="space-y-3">
        {results.map((result, index) => (
          <li 
            key={index}
            className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
          >
            <span className="text-slate-500 dark:text-slate-400">{result.prefix}</span>
            <strong className="bg-purple-200 dark:bg-purple-800/70 text-purple-800 dark:text-purple-200 font-bold px-1 py-0.5 rounded-md mx-1">
              {result.match}
            </strong>
            <span className="text-slate-500 dark:text-slate-400">{result.suffix}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KwicView;

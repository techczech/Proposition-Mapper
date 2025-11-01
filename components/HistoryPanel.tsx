
import React, { useState, useRef, useEffect } from 'react';
import type { HistoryItem } from '../types';
import { TrashIcon, HistoryIcon, EditIcon, ImportIcon, ExportIcon } from './Icons';

interface HistoryPanelProps {
  history: HistoryItem[];
  activeHistoryId: string | null;
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onImportHistory: () => void;
  onExportHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, activeHistoryId, onLoad, onDelete, onUpdateName, onImportHistory, onExportHistory }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleStartEditing = (item: HistoryItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveName = () => {
    if (editingId && editingName.trim()) {
      onUpdateName(editingId, editingName.trim());
    }
    handleCancelEditing();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg flex flex-col h-[260px]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
          <HistoryIcon />
          History
        </h2>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
           <button onClick={onImportHistory} title="Import history" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ImportIcon className="w-5 h-5" />
           </button>
            <button onClick={onExportHistory} title="Export history" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ExportIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-slate-500 dark:text-slate-400">No history yet.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Your generated maps will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map(item => (
              <li 
                key={item.id} 
                className={`group flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer
                  ${activeHistoryId === item.id 
                    ? 'bg-purple-100 dark:bg-purple-900/50' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`
                }
                onClick={() => onLoad(item)}
              >
                <div className="flex-grow text-left overflow-hidden">
                  {editingId === item.id ? (
                     <input
                      ref={inputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEditing();
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-purple-500 rounded-md p-1 text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate" title={item.name}>{item.name}</p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-2">
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditing(item);
                    }}
                    aria-label={`Edit name for ${item.name}`}
                    className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    aria-label={`Delete map titled ${item.name}`}
                    className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;

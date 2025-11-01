import React, { useState } from 'react';
import type { Term } from '../types';
import { CloseIcon, SparklesIcon } from './Icons';

interface AddPropositionModalProps {
  terms: Term[];
  onAdd: (subject: string, predicate: string, object: string) => void;
  onClose: () => void;
}

const AddPropositionModal: React.FC<AddPropositionModalProps> = ({ terms, onAdd, onClose }) => {
  const [subject, setSubject] = useState('');
  const [predicate, setPredicate] = useState('');
  const [object, setObject] = useState('');

  const termLabels = terms.map(t => t.label);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim() && predicate.trim() && object.trim()) {
      onAdd(subject.trim(), predicate.trim(), object.trim());
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add Proposition</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              list="term-list"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label htmlFor="predicate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Predicate</label>
            <input
              id="predicate"
              type="text"
              value={predicate}
              onChange={e => setPredicate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label htmlFor="object" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Object</label>
            <input
              id="object"
              type="text"
              value={object}
              onChange={e => setObject(e.target.value)}
              list="term-list"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <datalist id="term-list">
            {termLabels.map(label => <option key={label} value={label} />)}
          </datalist>

          <div className="flex justify-end pt-2">
             <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors mr-2"
              >
                Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropositionModal;
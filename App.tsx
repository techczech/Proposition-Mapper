
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SAMPLE_TEXT } from './constants';
import type { GraphData, Theme, HistoryItem, Relationship } from './types';
import { ViewType } from './types';
import { extractConceptsAndRelationships, extractMoreRelationships, generateId } from './services/geminiService';
import ConceptMap from './components/ConceptMap';
import ListView from './components/ListView';
import KwicView from './components/KwicView';
import HistoryPanel from './components/HistoryPanel';
import AddPropositionModal from './components/AddPropositionModal';
import { MapIcon, ListIcon, LoadingIcon, SparklesIcon, SunIcon, MoonIcon, ImportIcon, ExportIcon, FilterIcon, CloseIcon, WandIcon, PlusIcon, KwicIcon, ExpandIcon, StudyIcon } from './components/Icons';

const App: React.FC = () => {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>(ViewType.MAP);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  
  const importMapInputRef = useRef<HTMLInputElement>(null);
  const importHistoryInputRef = useRef<HTMLInputElement>(null);

  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'term' | 'subject' | 'object' | 'predicate'>('all');
  const [propositionCount, setPropositionCount] = useState<number>(10);
  const [mapSpread, setMapSpread] = useState<number>(150);
  const [kwicMatchType, setKwicMatchType] = useState<'part' | 'full'>('part');
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [studyTarget, setStudyTarget] = useState<'subject' | 'predicate' | 'object'>('predicate');
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('propositionMapperHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('propositionMapperHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
   useEffect(() => {
    // Disable study mode if view changes from LIST
    if (view !== ViewType.LIST && isStudyMode) {
      setIsStudyMode(false);
    }
  }, [view, isStudyMode]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleMapText = async () => {
    if (!text.trim()) {
      setError('Please enter some text to map.');
      return;
    }
    setLoading(true);
    setError(null);
    setGraphData(null);
    setActiveHistoryId(null);
    setFilterQuery('');

    try {
      const data = await extractConceptsAndRelationships(text, propositionCount);
      if (data.terms.length === 0 || data.relationships.length === 0) {
        setError("Could not extract any meaningful propositions. Try a different text.");
        setGraphData(null);
      } else {
        const newHistoryItem: HistoryItem = {
          id: `map-${Date.now()}`,
          name: `Map of "${text.trim().split(' ').slice(0, 5).join(' ')}..."`,
          createdAt: new Date().toISOString(),
          graphData: data,
        };
        setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
        setGraphData(data);
        setActiveHistoryId(newHistoryItem.id);
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while processing the text. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!graphData || !text) return;
    setIsGeneratingMore(true);
    setError(null);
    try {
        const newRelationships = await extractMoreRelationships(text, graphData.terms, graphData.relationships);
        if (newRelationships.length > 0) {
            const existingRelStrings = new Set(graphData.relationships.map(r => `${r.source}-${r.label}-${r.target}`));
            const uniqueNewRels = newRelationships.filter(r => !existingRelStrings.has(`${r.source}-${r.label}-${r.target}`));
            
            if (uniqueNewRels.length > 0) {
              const updatedGraphData = {
                  ...graphData,
                  relationships: [...graphData.relationships, ...uniqueNewRels]
              };

              setGraphData(updatedGraphData);
              if (activeHistoryId) {
                setHistory(prev => prev.map(h => h.id === activeHistoryId ? {...h, graphData: updatedGraphData} : h));
              }
            }
        }
    } catch(e) {
        console.error(e);
        setError("Could not generate more propositions. Please try again.");
    } finally {
        setIsGeneratingMore(false);
    }
  };
  
  const handleAddProposition = (subjectLabel: string, predicateLabel: string, objectLabel: string) => {
    if (!graphData) return;

    const allTerms = [...graphData.terms];

    const findOrCreateTerm = (label: string) => {
      let term = allTerms.find(t => t.label.toLowerCase() === label.trim().toLowerCase());
      if (!term) {
        term = { id: generateId(label.trim()), label: label.trim(), definition: 'Manually added term.' };
        allTerms.push(term);
      }
      return term;
    };

    const subjectTerm = findOrCreateTerm(subjectLabel);
    const objectTerm = findOrCreateTerm(objectLabel);

    const newRelationship: Relationship = {
      source: subjectTerm.id,
      target: objectTerm.id,
      label: predicateLabel.trim(),
    };

    const updatedGraphData = {
      terms: allTerms,
      relationships: [...graphData.relationships, newRelationship],
    };

    setGraphData(updatedGraphData);
    if (activeHistoryId) {
      setHistory(prev =>
        prev.map(h => (h.id === activeHistoryId ? { ...h, graphData: updatedGraphData } : h))
      );
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setError(null);
    setFilterQuery('');
    setGraphData(item.graphData);
    setActiveHistoryId(item.id);
  }

  const handleDeleteHistory = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setGraphData(null);
    }
  }

  const handleUpdateHistoryItemName = (id: string, name: string) => {
    setHistory(prev => prev.map(h => h.id === id ? {...h, name} : h));
  };
  
  const handleExportCurrentMap = () => {
    if (!graphData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(graphData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const activeItemName = history.find(h => h.id === activeHistoryId)?.name || 'concept-map';
    const filename = activeItemName.toLowerCase().replace(/\W/g, '-').replace('...', '');
    link.download = `${filename}.json`;
    link.click();
  };
  
  const handleImportMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const data = JSON.parse(fileContent) as GraphData;
        
        if (data && Array.isArray(data.terms) && Array.isArray(data.relationships)) {
          const importedName = file.name.replace(/\.json$/i, '') || `Imported ${new Date().toLocaleDateString()}`;
           const newHistoryItem: HistoryItem = {
            id: `imported-${Date.now()}`,
            name: importedName,
            createdAt: new Date().toISOString(),
            graphData: data,
          };
          setHistory(prev => [newHistoryItem, ...prev]);
          setGraphData(data);
          setActiveHistoryId(newHistoryItem.id);
          setFilterQuery('');
          setError(null);
        } else {
          setError("Invalid JSON format for map file. It must contain 'terms' and 'relationships' arrays.");
        }
      } catch (err) {
        console.error("Failed to parse JSON file", err);
        setError("Failed to read or parse the JSON file. Please ensure it's a valid map file.");
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportHistory = () => {
    if (history.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(history, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `proposition-mapper-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const importedHistory = JSON.parse(fileContent) as HistoryItem[];
        
        // Basic validation
        if (Array.isArray(importedHistory) && (importedHistory.length === 0 || (importedHistory[0].id && importedHistory[0].name && importedHistory[0].graphData))) {
          if (window.confirm("Do you want to merge the imported history with your current history? \n\n'OK' to merge, 'Cancel' to replace.")) {
            // Merge: Add new, non-conflicting items
            const currentIds = new Set(history.map(h => h.id));
            const newItems = importedHistory.filter(h => !currentIds.has(h.id));
            setHistory(prev => [...newItems, ...prev]);
          } else {
            // Replace
            setHistory(importedHistory);
          }
          setError(null);
        } else {
          setError("Invalid JSON format for history file. It must be an array of history items.");
        }
      } catch (err) {
        console.error("Failed to parse history JSON file", err);
        setError("Failed to read or parse the history JSON file.");
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredGraphData = useMemo(() => {
    if (!graphData || !filterQuery.trim()) {
      return graphData;
    }

    const query = filterQuery.toLowerCase().trim();
    const visibleNodeIds = new Set<string>();
    const visibleLinkSet = new Set<Relationship>();

    // Handle predicate-based filtering
    if (filterType === 'all' || filterType === 'predicate') {
      graphData.relationships.forEach(rel => {
        if (rel.label.toLowerCase().includes(query)) {
          visibleLinkSet.add(rel);
          visibleNodeIds.add(rel.source);
          visibleNodeIds.add(rel.target);
        }
      });
    }

    // Handle term-based filtering
    if (filterType !== 'predicate') { // 'all', 'term', 'subject', or 'object'
      const matchingNodeIds = new Set<string>();
      graphData.terms.forEach(term => {
        if (term.label.toLowerCase().includes(query)) {
          matchingNodeIds.add(term.id);
        }
      });

      if (matchingNodeIds.size > 0) {
        graphData.relationships.forEach(rel => {
          const sourceMatches = matchingNodeIds.has(rel.source);
          const targetMatches = matchingNodeIds.has(rel.target);

          if (
            (filterType === 'subject' && sourceMatches) ||
            (filterType === 'object' && targetMatches) ||
            ((filterType === 'all' || filterType === 'term') && (sourceMatches || targetMatches))
          ) {
            visibleLinkSet.add(rel);
            visibleNodeIds.add(rel.source);
            visibleNodeIds.add(rel.target);
          }
        });
        // Also ensure the directly matching nodes are visible, even if they are isolates
        matchingNodeIds.forEach(id => visibleNodeIds.add(id));
      }
    }

    const filteredTerms = graphData.terms.filter(term => visibleNodeIds.has(term.id));
    const filteredRelationships = Array.from(visibleLinkSet);

    return {
      terms: filteredTerms,
      relationships: filteredRelationships,
    };
  }, [graphData, filterQuery, filterType]);


  const MemoizedConceptMap = React.memo(ConceptMap);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-6 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
            Proposition Mapper
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Turn any text into an interactive concept map. Uncover the core ideas and their connections, powered by Gemini.
          </p>
           <button 
            onClick={toggleTheme} 
            aria-label="Toggle theme"
            className="absolute top-0 right-0 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg flex flex-col">
              <label htmlFor="text-input" className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-300">
                Your Text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200 resize-none"
                rows={10}
                placeholder="Paste your text here..."
                disabled={loading}
              />
               <div className="mt-4">
                <label htmlFor="proposition-count" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Number of Propositions (approx.)
                </label>
                <input
                  id="proposition-count"
                  type="number"
                  value={propositionCount}
                  onChange={(e) => setPropositionCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="50"
                  disabled={loading}
                  aria-label="Number of propositions to generate"
                />
              </div>
              <button
                onClick={handleMapText}
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-500 dark:disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                {loading ? <LoadingIcon /> : <SparklesIcon />}
                <span>{loading ? 'Analyzing...' : 'Map Propositions'}</span>
              </button>
            </div>
             <HistoryPanel
                history={history}
                activeHistoryId={activeHistoryId}
                onLoad={handleLoadHistory}
                onDelete={handleDeleteHistory}
                onUpdateName={handleUpdateHistoryItemName}
                onImportHistory={() => importHistoryInputRef.current?.click()}
                onExportHistory={handleExportHistory}
             />
             <input type="file" ref={importHistoryInputRef} onChange={handleImportHistory} accept=".json" className="hidden" />
          </div>

          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-1 sm:p-2 shadow-lg h-[600px] flex flex-col">
              {graphData && (
                 <div className="flex justify-between items-center p-2 flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
                   <div className="flex items-center gap-2">
                     <input type="file" ref={importMapInputRef} onChange={handleImportMap} accept=".json" className="hidden" />
                     <button
                       onClick={() => importMapInputRef.current?.click()}
                       aria-label="Import current map"
                       title="Import current map"
                       className="p-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                     >
                       <ImportIcon />
                     </button>
                     <button
                       onClick={handleExportCurrentMap}
                       disabled={!graphData}
                       aria-label="Export current map"
                       title="Export current map"
                       className="p-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <ExportIcon />
                     </button>
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      <button
                        onClick={handleGenerateMore}
                        disabled={isGeneratingMore || loading || !graphData}
                        aria-label="Generate more propositions"
                        title="Generate more propositions"
                        className="p-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingMore ? <LoadingIcon className="h-5 w-5 text-current" /> : <WandIcon />}
                      </button>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!graphData}
                        aria-label="Add proposition manually"
                        title="Add proposition manually"
                        className="p-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon />
                      </button>
                   </div>
                   
                    <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 sm:justify-center">
                        <div className="relative flex items-center">
                            <FilterIcon className="absolute left-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter or search text..."
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-8 py-1.5 w-full sm:w-48 text-sm focus:ring-2 focus:ring-purple-500 transition"
                            />
                            {filterQuery && (
                                <button onClick={() => setFilterQuery('')} className="absolute right-2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                         {view === ViewType.KWIC ? (
                            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 flex text-sm transition-colors">
                                <button 
                                    onClick={() => setKwicMatchType('part')}
                                    className={`px-2 py-1 rounded-md transition-colors ${kwicMatchType === 'part' ? 'bg-white dark:bg-slate-700 shadow font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                >
                                    Part Word
                                </button>
                                <button 
                                    onClick={() => setKwicMatchType('full')}
                                    className={`px-2 py-1 rounded-md transition-colors ${kwicMatchType === 'full' ? 'bg-white dark:bg-slate-700 shadow font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                >
                                    Full Word
                                </button>
                            </div>
                        ) : (
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 px-2 text-sm focus:ring-2 focus:ring-purple-500 transition"
                            >
                                <option value="all">All</option>
                                <option value="term">Subject/Object</option>
                                <option value="subject">Subject Only</option>
                                <option value="object">Object Only</option>
                                <option value="predicate">Predicate</option>
                            </select>
                        )}
                    </div>

                   <div className="flex items-center gap-x-2">
                     {view === ViewType.MAP && (
                        <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 ml-2 pl-2">
                          <label htmlFor="map-spread" title="Adjust map spread" className="text-slate-500 dark:text-slate-400">
                            <ExpandIcon />
                          </label>
                          <input
                            id="map-spread"
                            type="range"
                            min="50"
                            max="300"
                            step="10"
                            value={mapSpread}
                            onChange={(e) => setMapSpread(Number(e.target.value))}
                            className="w-20"
                            aria-label="Adjust map spread"
                          />
                        </div>
                      )}
                      {view === ViewType.LIST && (
                        <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 ml-2 pl-2">
                            <button
                                onClick={() => setIsStudyMode(!isStudyMode)}
                                title="Toggle Study Mode"
                                className={`p-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                                    isStudyMode 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <StudyIcon className="w-4 h-4" />
                                <span>Study</span>
                            </button>
                            {isStudyMode && (
                                <select
                                    value={studyTarget}
                                    onChange={(e) => setStudyTarget(e.target.value as any)}
                                    className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 px-2 text-sm focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="subject">Hide Subject</option>
                                    <option value="predicate">Hide Predicate</option>
                                    <option value="object">Hide Object</option>
                                </select>
                            )}
                        </div>
                    )}
                     <div className="bg-slate-200 dark:bg-slate-900 p-1 rounded-lg flex gap-1 ml-2">
                       <button
                         onClick={() => setView(ViewType.MAP)}
                         className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                           view === ViewType.MAP ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                         }`}
                       >
                         <MapIcon />
                       </button>
                       <button
                         onClick={() => setView(ViewType.LIST)}
                         className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                           view === ViewType.LIST ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                         }`}
                       >
                         <ListIcon />
                       </button>
                       <button
                         onClick={() => setView(ViewType.KWIC)}
                         className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                           view === ViewType.KWIC ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                         }`}
                       >
                         <KwicIcon />
                       </button>
                     </div>
                   </div>
                 </div>
              )}

              <div className="flex-grow w-full h-full relative">
                {loading && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-slate-800/80 z-10 rounded-b-lg">
                    <LoadingIcon className="h-8 w-8 text-slate-700 dark:text-slate-300" />
                    <p className="text-lg mt-4 text-slate-700 dark:text-slate-300">Processing with Gemini...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-slate-800 z-10 p-4 rounded-b-lg">
                    <p className="text-center text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                {!loading && !error && !graphData && (
                   <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
                     <SparklesIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                     <h3 className="text-xl font-semibold text-slate-500 dark:text-slate-400">Ready to Visualize</h3>
                     <p className="text-slate-400 dark:text-slate-500">Your concept map will appear here once you analyze your text.</p>
                   </div>
                )}
                {view !== ViewType.KWIC && graphData && (!filteredGraphData || filteredGraphData.terms.length === 0) && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
                    <h3 className="text-xl font-semibold text-slate-500 dark:text-slate-400">No Results Found</h3>
                    <p className="text-slate-400 dark:text-slate-500 mt-1">
                      Try adjusting your filter.
                      <button onClick={() => setFilterQuery('')} className="ml-2 text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                        Clear filter
                      </button>
                    </p>
                  </div>
                )}
                {filteredGraphData && filteredGraphData.terms.length > 0 && view === ViewType.MAP && (
                  <MemoizedConceptMap graphData={filteredGraphData} theme={theme} spread={mapSpread} />
                )}
                {filteredGraphData && filteredGraphData.terms.length > 0 && view === ViewType.LIST && (
                  <ListView 
                    graphData={filteredGraphData} 
                    isStudyMode={isStudyMode}
                    studyTarget={studyTarget}
                  />
                )}
                {graphData && view === ViewType.KWIC && (
                  <KwicView text={text} query={filterQuery} matchType={kwicMatchType} />
                )}
              </div>
            </div>
          </div>
        </main>
        {isAddModalOpen && graphData && (
          <AddPropositionModal 
            terms={graphData.terms}
            onAdd={handleAddProposition}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;

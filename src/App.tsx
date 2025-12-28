import { useState, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import ElementList from './components/ElementList';
import ProjectWizard from './components/ProjectWizard';
import MainLayout from './components/MainLayout';
import SettingsView from './components/SettingsView';
import { persistenceManager } from './services/persistence';
import type { FarmElement, Project } from './types';

function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState('farm-designer');
  const [isLoading, setIsLoading] = useState(true);

  // --- Canvas State (Synced with Project) ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // We keep local state for performance, but sync to Project on changes
  // Actually, we can just edit the project.elements directly or sync states.
  // For now to minimize refactor, let's keep 'elements', 'history' as local and sync UP to project.
  const [elements, setElements] = useState<FarmElement[]>([]);
  const [history, setHistory] = useState<FarmElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });


  // 1. Initial Load
  useEffect(() => {
    const load = async () => {
      const savedProject = await persistenceManager.loadProject();
      if (savedProject) {
        setProject(savedProject);
        setElements(savedProject.elements || []);
        setHistory([savedProject.elements || []]);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const arrowMoveDirty = useRef(false);

  // 2. Auto-Save Project when elements change
  useEffect(() => {
    if (project) {
      const updatedProject = { ...project, elements, lastModified: Date.now() };
      // Debounce save slightly or just save (PersistenceManager simulates async)
      persistenceManager.saveProject(updatedProject);
      // We ideally should update 'project' state too, but let's avoid render loops.
      // Actually we need to keep 'project' ref up to date for other tabs.
    }
  }, [elements, project?.id]); // Depend on ID to ensure we have a project loaded


  const handleProjectCreated = (newProject: Project) => {
    setProject(newProject);
    setElements([]); // New project starts empty
    persistenceManager.saveProject(newProject);
  };

  // --- Canvas Handlers (Existing Logic) ---
  const pushToHistory = (newElements: FarmElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      const newElements = history[newIndex];
      setSelectedIds(prev => prev.filter(id => newElements.find(e => e.id === id)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      const newElements = history[newIndex];
      setSelectedIds(prev => prev.filter(id => newElements.find(e => e.id === id)));
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Arrow Movement
      if (selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        arrowMoveDirty.current = true; // Mark as dirty
        const step = e.shiftKey ? 10 : 1; // Faster with Shift

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        setElements(prevElements => {
          const nextElements = prevElements.map(el => {
            if (selectedIds.includes(el.id)) {
              return { ...el, x: el.x + dx, y: el.y + dy };
            }
            return el;
          });
          return nextElements;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (arrowMoveDirty.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        arrowMoveDirty.current = false;
        pushToHistory(elements);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyIndex, history, selectedIds, elements, pushToHistory, undo, redo]); // Re-bind when state changes relevant to Undo/Redo/Selection

  const handleDrop = (item: any, dropX: number, dropY: number) => {
    const x = (dropX - view.x) / view.scale;
    const y = (dropY - view.y) / view.scale;
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;

    // Default size from drag item or fallback
    const width = item.width || 100;
    const height = item.height || 100;

    const newElement: FarmElement = {
      id,
      name: `${item.label} ${elements.filter(e => e.type === item.type).length + 1}`,
      type: item.type,
      width,
      height,
      x,
      y,
      rotation: 0
    };

    const nextElements = [...elements, newElement];
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds([id]);
  };

  const handleMove = (id: string, dx: number, dy: number, isDelta = false) => {
    const nextElements = elements.map(el => {
      if (el.id === id || (selectedIds.includes(el.id) && selectedIds.includes(id))) {
        return {
          ...el,
          x: isDelta ? el.x + dx : dx,
          y: isDelta ? el.y + dy : dy
        };
      }
      return el;
    });
    setElements(nextElements);
  };

  const handleResize = (id: string, width: number, height: number, x?: number, y?: number) => {
    const nextElements = elements.map(el => {
      if (el.id === id) {
        return { ...el, width, height, x: x ?? el.x, y: y ?? el.y };
      }
      return el;
    });
    setElements(nextElements);
  };

  const handleRotate = (id: string) => {
    const nextElements = elements.map(el => {
      if (el.id === id) {
        return { ...el, rotation: (el.rotation || 0) + 45 };
      }
      return el;
    });
    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleInteractionEnd = () => {
    if (elements !== history[historyIndex]) {
      pushToHistory(elements);
    }
  };

  const handleRemove = (ids: string[]) => {
    const nextElements = elements.filter(el => !ids.includes(el.id));
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds([]);
  };

  const handleDuplicate = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20, name: `${el.name} Copy` };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds([newEl.id]);
  };

  const handleDuplicateReturn = (id: string) => { // Ctrl+Drag
    const el = elements.find(e => e.id === id);
    if (!el) return null;
    const newId = crypto.randomUUID();
    const newEl = { ...el, id: newId, name: `${el.name} Copy` }; // Position will be handled by drag
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    // We don't push history yet, wait for drag end
    setSelectedIds([newId]);
    return newId;
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length < 2) return;
    const selectedEls = elements.filter(e => selectedIds.includes(e.id));
    let val = 0;

    if (type === 'left') val = Math.min(...selectedEls.map(e => e.x));
    if (type === 'right') val = Math.max(...selectedEls.map(e => e.x + e.width)); // Align right edges? Or align to rightmost left edge? Standard is align left edges to minX. Let's do Standard alignment.
    // Actually standard 'Align Right' aligns right edges to the rightmost edge.
    if (type === 'right') val = Math.max(...selectedEls.map(e => e.x + e.width));
    if (type === 'center') {
      const minX = Math.min(...selectedEls.map(e => e.x));
      const maxX = Math.max(...selectedEls.map(e => e.x + e.width));
      val = minX + (maxX - minX) / 2;
    }

    if (type === 'top') val = Math.min(...selectedEls.map(e => e.y));
    if (type === 'bottom') val = Math.max(...selectedEls.map(e => e.y + e.height));
    if (type === 'middle') {
      const minY = Math.min(...selectedEls.map(e => e.y));
      const maxY = Math.max(...selectedEls.map(e => e.y + e.height));
      val = minY + (maxY - minY) / 2;
    }

    const nextElements = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      if (type === 'left') return { ...el, x: val };
      if (type === 'right') return { ...el, x: val - el.width };
      if (type === 'center') return { ...el, x: val - el.width / 2 };
      if (type === 'top') return { ...el, y: val };
      if (type === 'bottom') return { ...el, y: val - el.height };
      if (type === 'middle') return { ...el, y: val - el.height / 2 };
      return el;
    });
    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    // Basic implementation
    if (selectedIds.length < 3) return;
    // Sort selection
    const sorted = elements.filter(e => selectedIds.includes(e.id)).sort((a, b) => type === 'horizontal' ? a.x - b.x : a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (type === 'horizontal') {
      // const totalDist = (last.x) - (first.x + first.width); // Distance between First Right and Last Left? No, usually distribute centers or gaps.
      // Let's distribute centers for simplicity or Even Gaps.
      // Distribute Centers:
      const span = (last.x + last.width / 2) - (first.x + first.width / 2);
      const step = span / (sorted.length - 1);
      const nextElements = elements.map(el => {
        const idx = sorted.findIndex(s => s.id === el.id);
        if (idx === -1) return el;
        if (idx === 0 || idx === sorted.length - 1) return el;
        return { ...el, x: (first.x + first.width / 2) + step * idx - el.width / 2 };
      });
      setElements(nextElements);
      pushToHistory(nextElements);
    } else {
      const span = (last.y + last.height / 2) - (first.y + first.height / 2);
      const step = span / (sorted.length - 1);
      const nextElements = elements.map(el => {
        const idx = sorted.findIndex(s => s.id === el.id);
        if (idx === -1) return el;
        if (idx === 0 || idx === sorted.length - 1) return el;
        return { ...el, y: (first.y + first.height / 2) + step * idx - el.height / 2 };
      });
      setElements(nextElements);
      pushToHistory(nextElements);
    }
  };


  if (isLoading) {
    return <div className="w-full h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="w-full h-screen bg-neutral-950 text-white font-sans board-pattern">
        <ProjectWizard onComplete={handleProjectCreated} />
      </div>
    );
  }

  return (
    <MainLayout project={project} currentView={currentView} onViewChange={setCurrentView}>
      {/* Render View Content */}
      {currentView === 'farm-designer' && (
        <div className="flex flex-col h-full w-full">
          <ElementList />
          <div className="flex-1 relative flex flex-col h-full overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="bg-neutral-800 text-white px-3 py-1 rounded shadow-lg text-xs font-mono border border-neutral-700">
                Scale: {(view.scale * 100).toFixed(0)}%
              </div>
              <div className="bg-neutral-800 text-white px-3 py-1 rounded shadow-lg text-xs font-mono border border-neutral-700">
                Items: {elements.length}
              </div>
            </div>

            <Canvas
              elements={elements}
              view={view}
              onViewChange={setView}
              selectedIds={selectedIds}
              onDrop={handleDrop}
              onRemove={handleRemove}
              onMove={handleMove}
              onResize={handleResize}
              onRotate={handleRotate}
              onDuplicate={handleDuplicate}
              onDuplicateReturn={handleDuplicateReturn}
              onColorChange={(id, c) => setElements(elements.map(e => e.id === id ? { ...e, color: c } : e))}
              onRename={(id, n) => setElements(elements.map(e => e.id === id ? { ...e, name: n } : e))}
              onSelect={(id, multi) => {
                if (id === null) setSelectedIds([]);
                else setSelectedIds(multi ? (selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]) : [id]);
              }}
              onAlign={handleAlign}
              onDistribute={handleDistribute}
              onInteractionEnd={handleInteractionEnd}
            />
          </div>
        </div>
      )}

      {currentView === 'settings' && (
        <SettingsView project={project} onUpdateProject={setProject} />
      )}

      {currentView !== 'farm-designer' && currentView !== 'settings' && (
        <div className="flex items-center justify-center h-full text-neutral-500 flex-col gap-4">
          <div className="text-4xl text-neutral-700 animate-pulse font-bold uppercase tracking-widest">
            {currentView.replace('-', ' ')}
          </div>
          <p className="text-sm">Work in progress...</p>
        </div>
      )}
    </MainLayout>
  );
}

export default App;

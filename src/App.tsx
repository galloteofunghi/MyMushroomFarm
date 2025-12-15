import { useState, useEffect } from 'react';
import ElementList from './components/ElementList';
import Canvas from './components/Canvas';
import type { FarmElement } from './types';
import { Layout, Undo2, Redo2 } from 'lucide-react';

function App() {
  // State
  const [elements, setElements] = useState<FarmElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [clipboard, setClipboard] = useState<FarmElement[]>([]);

  // History State
  const [history, setHistory] = useState<FarmElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // History Helper
  const pushToHistory = (newElements: FarmElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && elements.length === 0) {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, []);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setElements(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setElements(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };


  // --- Handlers ---

  const handleDrop = (item: any, dropX: number, dropY: number) => {
    // Correct position based on view transform
    const x = (dropX - view.x) / view.scale;
    const y = (dropY - view.y) / view.scale;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
    const newElement: FarmElement = {
      id,
      name: `${item.label} ${elements.filter(e => e.type === item.type).length + 1}`,
      type: item.type,
      width: item.width,
      height: item.height,
      x,
      y,
    };

    // Explicit update
    const nextElements = [...elements, newElement];
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds([id]);
  };

  const handleSelect = (id: string | null, multi: boolean) => {
    if (id === null) {
      if (!multi) setSelectedIds([]);
      return;
    }

    setSelectedIds(prev => {
      if (multi) {
        return prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id];
      }
      return [id];
    });
  };

  const handleRemove = (ids: string[]) => {
    if (ids.length === 0) return;
    const nextElements = elements.filter(el => !ids.includes(el.id));
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  };


  const handleMoveLive = (id: string, dx: number, dy: number, isDelta: boolean = false) => {
    setElements(prev => {
      const primary = prev.find(el => el.id === id);
      if (!primary) return prev;

      let deltaX = 0;
      let deltaY = 0;

      if (!isDelta) {
        deltaX = dx - primary.x;
        deltaY = dy - primary.y;
      } else {
        deltaX = dx;
        deltaY = dy;
      }

      if (selectedIds.includes(id)) {
        return prev.map(el => {
          if (selectedIds.includes(el.id)) {
            return { ...el, x: el.x + deltaX, y: el.y + deltaY };
          }
          return el;
        });
      } else {
        return prev.map(el => el.id === id ? { ...el, x: el.x + deltaX, y: el.y + deltaY } : el);
      }
    });
  };

  const handleInteractionEnd = () => {
    // Push current state to history
    pushToHistory(elements);
  };

  const handleResize = (id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prev => prev.map(el =>
      el.id === id
        ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) }
        : el
    ));
  };

  const handleRotate = (id: string) => {
    const targets = selectedIds.includes(id) ? selectedIds : [id];
    const nextElements = elements.map(el => targets.includes(el.id) ? { ...el, rotation: (el.rotation || 0) + 90 } : el);
    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleColorChange = (id: string, color: string) => {
    const targets = selectedIds.includes(id) ? selectedIds : [id];
    const nextElements = elements.map(el => targets.includes(el.id) ? { ...el, color } : el);
    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleRename = (id: string, name: string) => {
    const nextElements = elements.map(el => el.id === id ? { ...el, name } : el);
    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleDuplicate = (ids: string[]) => {
    const toDuplicate = elements.filter(el => ids.includes(el.id));
    if (toDuplicate.length === 0) return;

    const newIds: string[] = [];
    const newItems: FarmElement[] = [];

    // Clone current elements first to avoid mutation issues if any (though map is safe)
    const currentElements = [...elements];

    toDuplicate.forEach(el => {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
      newIds.push(newId);
      newItems.push({
        ...el,
        id: newId,
        name: `${el.name} (Copy)`,
        x: el.x + 20,
        y: el.y + 20
      });
    });

    const nextElements = [...currentElements, ...newItems];
    setElements(nextElements);
    pushToHistory(nextElements);
    setSelectedIds(newIds);
  };

  const handleDuplicateReturn = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return null;

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
    const newElement = { ...el, id: newId, name: `${el.name} (Copy)` };

    const nextElements = [...elements, newElement];
    setElements(nextElements);
    // Note: DuplicateReturn is usually starting a drag, so we might wait for interaction end? 
    // But standard duplicate is immediate. Let's push history.
    pushToHistory(nextElements);

    setSelectedIds([newId]);
    return newId;
  };


  // --- Batch Actions ---

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length < 2) return;

    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length === 0) return;

    let targetVal = 0;
    switch (type) {
      case 'left': targetVal = Math.min(...selected.map(e => e.x)); break;
      case 'right': targetVal = Math.max(...selected.map(e => e.x + e.width)); break;
      case 'top': targetVal = Math.min(...selected.map(e => e.y)); break;
      case 'bottom': targetVal = Math.max(...selected.map(e => e.y + e.height)); break;
      case 'center':
        const minX = Math.min(...selected.map(e => e.x));
        const maxX = Math.max(...selected.map(e => e.x + e.width));
        targetVal = minX + (maxX - minX) / 2;
        break;
      case 'middle':
        const minY = Math.min(...selected.map(e => e.y));
        const maxY = Math.max(...selected.map(e => e.y + e.height));
        targetVal = minY + (maxY - minY) / 2;
        break;
    }

    const nextElements = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      switch (type) {
        case 'left': return { ...el, x: targetVal };
        case 'right': return { ...el, x: targetVal - el.width };
        case 'top': return { ...el, y: targetVal };
        case 'bottom': return { ...el, y: targetVal - el.height };
        case 'center': return { ...el, x: targetVal - el.width / 2 };
        case 'middle': return { ...el, y: targetVal - el.height / 2 };
        default: return el;
      }
    });

    setElements(nextElements);
    pushToHistory(nextElements);
  };

  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) return;

    const selected = elements.filter(el => selectedIds.includes(el.id));
    selected.sort((a, b) => type === 'horizontal' ? a.x - b.x : a.y - b.y);

    const first = selected[0];
    const last = selected[selected.length - 1];

    let nextElements = [...elements];

    if (type === 'horizontal') {
      const step = (last.x - first.x) / (selected.length - 1);
      nextElements = elements.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        const index = selected.findIndex(s => s.id === el.id);
        if (index === 0 || index === selected.length - 1) return el;
        return { ...el, x: first.x + step * index };
      });
    } else {
      const step = (last.y - first.y) / (selected.length - 1);
      nextElements = elements.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        const index = selected.findIndex(s => s.id === el.id);
        if (index === 0 || index === selected.length - 1) return el;
        return { ...el, y: first.y + step * index };
      });
    }

    setElements(nextElements);
    pushToHistory(nextElements);
  };

  // --- Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
        e.preventDefault();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          if (window.confirm(`Eliminare ${selectedIds.length} elementi?`)) {
            // Cannot call handleRemove directly because it depends on updated selectedIds/elements in closure? 
            // No, handleRemove uses 'elements' from closure.
            // But we need to pass ids.
            // If we use the function defined in render, it uses current scope.
            // However, inside useEffect, we need to be careful about stale closures.
            // We added [selectedIds, elements...] to dependency array, so handleKeyDown is recreated.
            // So calling handleRemove(selectedIds) is safe.

            // We need to access the function. 
            // Ideally we should extract logic or just invoke it.
            // Since handleRemove is defined in scope, we can call it.
            handleRemove(selectedIds);
          }
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          const selected = elements.filter(el => selectedIds.includes(el.id));
          if (selected.length > 0) {
            setClipboard(selected);
          }
        }
        if (e.key === 'v') {
          if (clipboard.length > 0) {
            const newIds: string[] = [];
            const newItems: FarmElement[] = [];

            clipboard.forEach(el => {
              const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
              newIds.push(newId);
              newItems.push({
                ...el,
                id: newId,
                x: el.x + 20,
                y: el.y + 20,
                name: `${el.name} (Copy)`
              });
            });

            const nextElements = [...elements, ...newItems];
            setElements(nextElements);
            pushToHistory(nextElements);
            setSelectedIds(newIds);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, clipboard, historyIndex, history]);


  return (
    <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
      <div className="flex flex-col flex-1">
        <header className="h-14 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-3 shadow-sm z-10">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Layout size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">MyMushroomFarm <span className="text-neutral-500 font-normal">Designer</span></h1>
          {/* History Controls */}
          <div className="ml-auto flex gap-2">
            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 bg-neutral-700 rounded hover:bg-neutral-600 disabled:opacity-50 text-neutral-300 hover:text-white" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 bg-neutral-700 rounded hover:bg-neutral-600 disabled:opacity-50 text-neutral-300 hover:text-white" title="Redo (Ctrl+Y)">
              <Redo2 size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <ElementList />
          <Canvas
            elements={elements}
            selectedIds={selectedIds}
            view={view}
            onViewChange={setView}
            onDrop={handleDrop}
            onRemove={handleRemove}
            onMove={handleMoveLive}
            onInteractionEnd={handleInteractionEnd}
            onResize={handleResize}
            onRotate={handleRotate}
            onDuplicate={(id) => handleDuplicate([id])}
            onDuplicateReturn={handleDuplicateReturn}
            onColorChange={handleColorChange}
            onRename={handleRename}
            onSelect={handleSelect}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

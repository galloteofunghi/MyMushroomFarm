import { useState, useCallback, useEffect, useRef } from 'react';
import type { FarmElement, Project } from '../types';
import { useCanvasHistory } from './useCanvasHistory';

export const useCanvasState = (initialElements: FarmElement[] = []) => {
    const [elements, setElements] = useState<FarmElement[]>(initialElements);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [isEditing, setIsEditing] = useState(initialElements.length === 0); // Default to editing if empty
    const [clipboard, setClipboard] = useState<FarmElement[]>([]);

    // History Hook
    const {
        undo: historyUndo,
        redo: historyRedo,
        pushToHistory,
        setHistory,
        setHistoryIndex,
        canUndo,
        canRedo
    } = useCanvasHistory(initialElements);

    const arrowMoveDirty = useRef(false);

    // Sync History Navigation to State
    const undo = useCallback(() => {
        const newElements = historyUndo();
        if (newElements) {
            setElements(newElements);
            setSelectedIds(prev => prev.filter(id => newElements.find(e => e.id === id)));
        }
    }, [historyUndo]);

    const redo = useCallback(() => {
        const newElements = historyRedo();
        if (newElements) {
            setElements(newElements);
            setSelectedIds(prev => prev.filter(id => newElements.find(e => e.id === id)));
        }
    }, [historyRedo]);


    // --- Actions ---

    const handleDrop = useCallback((item: any, dropX: number, dropY: number) => {
        const x = (dropX - view.x) / view.scale;
        const y = (dropY - view.y) / view.scale;
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;

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
    }, [elements, view, pushToHistory]);

    const handleMove = useCallback((id: string, dx: number, dy: number, isDelta = false) => {
        setElements(prev => {
            const nextElements = prev.map(el => {
                if (el.id === id || (selectedIds.includes(el.id) && selectedIds.includes(id))) {
                    return {
                        ...el,
                        x: isDelta ? el.x + dx : dx,
                        y: isDelta ? el.y + dy : dy
                    };
                }
                return el;
            });
            return nextElements;
        });
    }, [selectedIds]);

    const handleResize = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                return { ...el, width, height, x: x ?? el.x, y: y ?? el.y };
            }
            return el;
        }));
    }, []);

    const handleRotate = useCallback((id: string) => {
        setElements(prev => {
            const nextElements = prev.map(el => {
                if (el.id === id) {
                    return { ...el, rotation: (el.rotation || 0) + 45 };
                }
                return el;
            });
            pushToHistory(nextElements);
            return nextElements;
        });
    }, [pushToHistory]);

    const handleInteractionEnd = useCallback(() => {
        // We push current state to history. 
        // Note: We might need a check to see if it actually changed, but handled by parent usually.
        // For simplicity, we just push current 'elements'. 
        // Optimization: Pass 'elements' to this function to avoid closure staleness if not in deps?
        // Actually, 'elements' in dependency will refresh this callback.
        pushToHistory(elements);
    }, [elements, pushToHistory]);

    const handleRemove = useCallback((ids: string[]) => {
        const nextElements = elements.filter(el => !ids.includes(el.id));
        setElements(nextElements);
        pushToHistory(nextElements);
        setSelectedIds([]);
    }, [elements, pushToHistory]);

    const handleDuplicate = useCallback((id?: string) => {
        // Feature: Duplicate multiple selected items if applicable
        // If an ID is passed and it's not in selection, duplicate just that one.
        // If ID is in selection or no ID, duplicate ALL selected.

        let idsToDuplicate: string[] = [];
        if (id && !selectedIds.includes(id)) {
            idsToDuplicate = [id];
        } else {
            idsToDuplicate = selectedIds.length > 0 ? selectedIds : (id ? [id] : []);
        }

        if (idsToDuplicate.length === 0) return;

        const newElements: FarmElement[] = [];
        const newSelectedIds: string[] = [];

        idsToDuplicate.forEach(sourceId => {
            const el = elements.find(e => e.id === sourceId);
            if (el) {
                const newId = crypto.randomUUID();
                const newEl = { ...el, id: newId, x: el.x + 20, y: el.y + 20, name: `${el.name} Copy` };
                newElements.push(newEl);
                newSelectedIds.push(newId);
            }
        });

        if (newElements.length === 0) return;

        const nextElements = [...elements, ...newElements];
        setElements(nextElements);
        pushToHistory(nextElements);
        setSelectedIds(newSelectedIds);
    }, [elements, selectedIds, pushToHistory]);

    const handleDuplicateReturn = useCallback((id: string) => {
        const el = elements.find(e => e.id === id);
        if (!el) return null;
        const newId = crypto.randomUUID();
        const newEl = { ...el, id: newId, name: `${el.name} Copy` };
        const nextElements = [...elements, newEl];
        setElements(nextElements);
        // Drag end will push history
        setSelectedIds([newId]);
        return newId;
    }, [elements]);

    const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (selectedIds.length < 2) return;
        const selectedEls = elements.filter(e => selectedIds.includes(e.id));
        let val = 0;

        if (type === 'left') val = Math.min(...selectedEls.map(e => e.x));
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
    }, [elements, selectedIds, pushToHistory]);

    const handleDistribute = useCallback((type: 'horizontal' | 'vertical') => {
        if (selectedIds.length < 3) return;
        const sorted = elements.filter(e => selectedIds.includes(e.id)).sort((a, b) => type === 'horizontal' ? a.x - b.x : a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (type === 'horizontal') {
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
    }, [elements, selectedIds, pushToHistory]);


    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Undo: Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                if (!isEditing) return; // Guard
                e.preventDefault();
                undo();
            }

            // Redo: Ctrl+Y or Ctrl+Shift+Z
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                if (!isEditing) return; // Guard
                e.preventDefault();
                redo();
            }

            // Delete / Backspace
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                if (!isEditing) return; // Guard
                e.preventDefault();
                handleRemove(selectedIds);
            }

            // Copy: Ctrl+C
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (!isEditing) return;
                e.preventDefault();
                const selected = elements.filter(el => selectedIds.includes(el.id));
                if (selected.length > 0) {
                    setClipboard(selected);
                }
            }

            // Paste: Ctrl+V
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (!isEditing) return;
                e.preventDefault();
                if (clipboard.length === 0) return;

                const newElements: FarmElement[] = [];
                const newSelectedIds: string[] = [];

                clipboard.forEach(sourceEl => {
                    const newId = crypto.randomUUID();
                    // Offset slightly to indicate new copies
                    const newEl = { ...sourceEl, id: newId, x: sourceEl.x + 20, y: sourceEl.y + 20, name: `${sourceEl.name} Copy` };
                    newElements.push(newEl);
                    newSelectedIds.push(newId);
                });

                const nextElements = [...elements, ...newElements];
                setElements(nextElements);
                pushToHistory(nextElements);
                setSelectedIds(newSelectedIds);
                // Important: Update clipboard so continuous pastes continue to offset? 
                // No, standard is Pastes are identical to source. 
                // But users expect subsequent pastes to not perfectly overlap the previous paste if they haven't moved it.
                // However, without complex "last paste position" logic, keeping static clipboard is safer.
                // User can drag the new pile.
            }

            // Duplicate: Ctrl+D
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                if (!isEditing) return;
                e.preventDefault();
                handleDuplicate();
            }

            // Arrow Movement
            if (selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (!isEditing) return; // Guard
                e.preventDefault();
                arrowMoveDirty.current = true;
                const step = e.shiftKey ? 10 : 1;

                let dx = 0;
                let dy = 0;
                if (e.key === 'ArrowLeft') dx = -step;
                if (e.key === 'ArrowRight') dx = step;
                if (e.key === 'ArrowUp') dy = -step;
                if (e.key === 'ArrowDown') dy = step;

                // Functional update to avoid dependency on 'elements' in this specific listener part if possible,
                // but we need 'elements' for map.
                setElements(prevElements => {
                    return prevElements.map(el => {
                        if (selectedIds.includes(el.id)) {
                            return { ...el, x: el.x + dx, y: el.y + dy };
                        }
                        return el;
                    });
                });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (arrowMoveDirty.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                arrowMoveDirty.current = false;
                // Here is the tricky part: 'elements' in this closure might be stale if the effect didn't re-run.
                // But we included 'elements' in dependency.
                // Re-running the effect on every 1px move (if arrow keys spam) is expensive but standard for React.
                // To optimize, we'd use a ref for elements, but let's stick to standard flow.
                pushToHistory(elements);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [elements, selectedIds, undo, redo, pushToHistory, clipboard]);


    return {
        elements,
        setElements,
        selectedIds,
        setSelectedIds,
        view,
        setView,
        isEditing,
        setIsEditing,
        undo,
        redo,
        canUndo,
        canRedo,
        handleDrop,
        handleMove,
        handleResize,
        handleRotate,
        handleInteractionEnd,
        handleRemove,
        handleDuplicate,
        handleDuplicateReturn,
        handleAlign,
        handleDistribute,
        setHistory, // For loading
        setHistoryIndex // For loading
    };
};

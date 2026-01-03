import { useState, useCallback } from 'react';
import type { FarmElement } from '../types';

export const useCanvasHistory = (initialElements: FarmElement[] = []) => {
    const [history, setHistory] = useState<FarmElement[][]>([initialElements]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const pushToHistory = useCallback((newElements: FarmElement[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newElements);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback((): FarmElement[] | null => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [historyIndex, history]);

    const redo = useCallback((): FarmElement[] | null => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [historyIndex, history]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return {
        history,
        historyIndex,
        pushToHistory,
        undo,
        redo,
        setHistory, // Exposed for loading projects
        setHistoryIndex,
        canUndo,
        canRedo
    };
};

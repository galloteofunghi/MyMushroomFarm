import { useState, useEffect } from 'react';
import { persistenceManager } from '../services/persistence';
import type { Project, FarmElement } from '../types';

export const useProject = (
    initialElements: FarmElement[],
    setElements: React.Dispatch<React.SetStateAction<FarmElement[]>>,
    setHistory: React.Dispatch<React.SetStateAction<FarmElement[][]>>,
    setHistoryIndex: React.Dispatch<React.SetStateAction<number>>,
    onProjectLoad?: (elements: FarmElement[]) => void
) => {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const savedProject = localStorage.getItem('myMushroomFarm_project');
            if (savedProject) {
                try {
                    const parsed = JSON.parse(savedProject);
                    setProject(parsed);
                    setElements(parsed.elements || []);
                    setHistory([parsed.elements || []]);
                    setHistoryIndex(0);
                    if (onProjectLoad) onProjectLoad(parsed.elements || []);
                } catch (e) {
                    console.error('Failed to load project', e);
                }
            }
            setIsLoading(false);
        };
        load();
    }, []); // Run once

    // Auto-Save
    useEffect(() => {
        if (project) {
            // Note: initialElements here tracks the CURRENT elements from the hook usage
            const updatedProject = { ...project, elements: initialElements, lastModified: Date.now() };
            persistenceManager.saveProject(updatedProject);
        }
    }, [initialElements, project?.id]);

    const handleProjectCreated = (newProject: Project) => {
        setProject(newProject);
        setElements([]);
        setHistory([[]]);
        setHistoryIndex(0);
        persistenceManager.saveProject(newProject);
    };

    return {
        project,
        setProject,
        isLoading,
        handleProjectCreated
    };
};

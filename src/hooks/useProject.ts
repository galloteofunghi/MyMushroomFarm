import { useState, useEffect } from 'react';
import { persistenceManager } from '../services/persistence';
import type { Project, FarmElement } from '../types';

export const useProject = (
    initialElements: FarmElement[],
    setElements: (els: FarmElement[]) => void,
    setHistory: (h: FarmElement[][]) => void,
    setHistoryIndex: (i: number) => void
) => {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const savedProject = await persistenceManager.loadProject();
            if (savedProject) {
                setProject(savedProject);
                setElements(savedProject.elements || []);
                setHistory([savedProject.elements || []]);
                setHistoryIndex(0);
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

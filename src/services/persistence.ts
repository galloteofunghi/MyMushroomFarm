import type { Project } from '../types';

export interface PersistenceStrategy {
    save(project: Project): Promise<void>;
    load(): Promise<Project | null>;
}

export class LocalStorageStrategy implements PersistenceStrategy {
    private readonly STORAGE_KEY = 'my_mushroom_farm_project';

    async save(project: Project): Promise<void> {
        return new Promise((resolve) => {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(project));
                // Simulate async
                setTimeout(resolve, 50);
            } catch (error) {
                console.error('Failed to save to LocalStorage', error);
                resolve();
            }
        });
    }

    async load(): Promise<Project | null> {
        return new Promise((resolve) => {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                if (data) {
                    const project = JSON.parse(data) as Project;
                    resolve(project);
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.error('Failed to load from LocalStorage', error);
                resolve(null);
            }
        });
    }
}

export class PersistenceManager {
    private strategy: PersistenceStrategy;

    constructor(strategy: PersistenceStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: PersistenceStrategy) {
        this.strategy = strategy;
    }

    async saveProject(project: Project): Promise<void> {
        return this.strategy.save(project);
    }

    async loadProject(): Promise<Project | null> {
        return this.strategy.load();
    }
}

export const persistenceManager = new PersistenceManager(new LocalStorageStrategy());

export type ElementType = 'greenhouse' | 'room' | 'fridge' | string;

export interface FarmElement<T = Record<string, any>> {
    id: string;
    name: string;
    type: ElementType;
    width: number;
    height: number;
    x: number;
    y: number;
    rotation?: number;
    color?: string;
    data?: T;
}

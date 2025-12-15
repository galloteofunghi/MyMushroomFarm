export type ElementType = 'greenhouse' | 'room' | 'fridge' | 'incubation_room' | 'road_straight' | 'road_curve' | 'road_intersection' | 'parking' | 'truck_parking' | 'loading_area' | 'office' | string;

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

export type MushroomType =
    | 'Pleurotus'
    | 'Pleurotus Cornucopiae'
    | 'Prataiolo'
    | 'Pioppino'
    | 'Cardoncello'
    | 'Shiitake'
    | 'Lion\'s Mane'
    | 'Reishi'
    | 'Nameko'
    | 'Grifola Frondosa';

export interface MushroomSettings {
    incubationDays: number;
    firstHarvestDays: number;
    secondHarvestDays: number;
    thirdHarvestDays: number;
    firstHarvestYield: number; // percentage
    secondHarvestYield: number; // percentage
    thirdHarvestYield: number; // percentage
}

export interface Project {
    id: string;
    companyName: string;
    logoUrl?: string; // Base64 or URL
    activeMushrooms: MushroomType[];
    mushroomSettings: Record<MushroomType, MushroomSettings>;
    elements: FarmElement[];
    lastModified: number;
}

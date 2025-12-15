import type { MushroomType, MushroomSettings } from '../types';

export const DEFAULT_MUSHROOM_SETTINGS: MushroomSettings = {
    incubationDays: 20,
    firstHarvestDays: 15,
    secondHarvestDays: 18,
    thirdHarvestDays: 20,
    firstHarvestYield: 18,
    secondHarvestYield: 9,
    thirdHarvestYield: 3,
};

export const MUSHROOM_TYPES: { type: MushroomType; label: string; image?: string }[] = [
    { type: 'Pleurotus', label: 'Pleurotus' },
    { type: 'Pleurotus Cornucopiae', label: 'Pleurotus Cornucopiae' },
    { type: 'Prataiolo', label: 'Prataiolo' },
    { type: 'Pioppino', label: 'Pioppino' },
    { type: 'Cardoncello', label: 'Cardoncello' },
    { type: 'Shiitake', label: 'Shiitake' },
    { type: 'Lion\'s Mane', label: 'Lion\'s Mane' },
    { type: 'Reishi', label: 'Reishi' },
    { type: 'Nameko', label: 'Nameko' },
    { type: 'Grifola Frondosa', label: 'Grifola Frondosa' },
];

export const getInitialMushroomSettings = (): Record<MushroomType, MushroomSettings> => {
    const settings: Partial<Record<MushroomType, MushroomSettings>> = {};
    MUSHROOM_TYPES.forEach(m => {
        settings[m.type] = { ...DEFAULT_MUSHROOM_SETTINGS };
    });
    return settings as Record<MushroomType, MushroomSettings>;
};

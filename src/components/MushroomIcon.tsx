import React from 'react';
import iconSheet from '../assets/mushroom_icons.png';

interface MushroomIconProps {
    type: string;
    className?: string;
}

const MUSHROOM_TYPES: string[] = [
    'Pleurotus',
    'Pleurotus Cornucopiae',
    'Champignon Bianco',
    'Champignon Crema',
    'Pioppino',
    'Cardoncello',
    'Shiitake',
    "Lion's Mane",
    'Reishi',
    'Nameko',
    'Grifola Frondosa'
];

// Assuming a 3 column grid based on typical generation.
// 10 items. 
// Row 0: 0, 1, 2
// Row 1: 3, 4, 5
// Row 2: 6, 7, 8
// Row 3: 9
const COLUMNS = 3;
// ICON_SIZE removed as unused
// Actually, better to use percentages if we know the aspect ratio.
// But sprite sheets are tricky without exact coords.
// Let's assume the image is 1024x1024 or similar and try to fit.
// If the image is a grid, we can use background position.
// Let's assume it's a 3x4 grid for 10 items.

const MushroomIcon: React.FC<MushroomIconProps> = ({ type, className = "w-6 h-6" }) => {

    // Safety check
    const index = MUSHROOM_TYPES.indexOf(type);
    if (index === -1) return null;

    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);

    // Percentages for background-position
    // If 3 columns: 0%, 50%, 100% (for center points)? No.
    // CSS Sprites:
    // x pos = (col / (cols - 1)) * 100%
    // y pos = (row / (rows - 1)) * 100%
    // Assuming 3 cols and 4 rows (12 slots, 10 used)
    const ROWS = 4;

    const x = (col / (COLUMNS - 1)) * 100;
    const y = (row / (ROWS - 1)) * 100;

    return (
        <div
            className={`${className} bg-no-repeat overflow-hidden`}
            style={{
                backgroundImage: `url(${iconSheet})`,
                backgroundSize: `${COLUMNS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${x}% ${y}%`,
            }}
            title={type}
        />
    );
};

export default MushroomIcon;

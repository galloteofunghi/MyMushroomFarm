import React from 'react';
import type { ElementType } from '../types';
import { Warehouse, Box, ThermometerSnowflake } from 'lucide-react';

const ElementList: React.FC = () => {
    const draggables: { type: ElementType; label: string; icon: React.ReactNode; width: number; height: number }[] = [
        { type: 'greenhouse', label: 'Greenhouse', icon: <Warehouse />, width: 150, height: 100 },
        { type: 'room', label: 'Cultivation Room', icon: <Box />, width: 120, height: 120 },
        { type: 'fridge', label: 'Cold Storage', icon: <ThermometerSnowflake />, width: 100, height: 100 },
    ];

    const handleDragStart = (e: React.DragEvent, item: any) => {
        // Create a clean object without React nodes (icons) for serialization
        const dragData = {
            type: item.type,
            label: item.label,
            width: item.width,
            height: item.height
        };
        console.log('Drag start:', dragData);
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="w-64 bg-neutral-800 p-4 border-r border-neutral-700 flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">Elements</h2>
            {draggables.map((item) => (
                <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="bg-neutral-700 p-3 rounded cursor-move hover:bg-neutral-600 transition-colors flex items-center gap-3 border border-neutral-600"
                >
                    {item.icon}
                    <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-neutral-400">{item.width}x{item.height}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ElementList;

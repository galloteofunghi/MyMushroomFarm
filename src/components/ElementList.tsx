import React from 'react';
import { Warehouse, Box, ThermometerSnowflake, MapPin, Truck, Building2, ParkingSquare, CornerDownRight, Split, Route, ZoomIn, Layers } from 'lucide-react';

interface ElementListProps {
    stats?: {
        scale: number;
        count: number;
    };
}

const ElementList: React.FC<ElementListProps> = ({ stats }) => {
    const categories = [
        {
            title: 'CLT', // Cultivation
            items: [
                { type: 'greenhouse', label: 'Serra Coltura', icon: <Warehouse size={18} />, width: 100, height: 200 },
                { type: 'room', label: 'Stanza Custom', icon: <Box size={18} />, width: 150, height: 150 },
                { type: 'fridge', label: 'Cella Frigo', icon: <ThermometerSnowflake size={18} />, width: 120, height: 100 },
                { type: 'incubation_room', label: 'Incubazione', icon: <ThermometerSnowflake size={18} className="text-purple-400" />, width: 120, height: 120 },
            ]
        },
        {
            title: 'INF', // Infrastructure
            items: [
                { type: 'road_straight', label: 'Strada Dritta', icon: <Route size={18} />, width: 200, height: 60 },
                { type: 'road_curve', label: 'Curva', icon: <CornerDownRight size={18} />, width: 100, height: 100 },
                { type: 'road_intersection', label: 'Incrocio', icon: <Split size={18} />, width: 150, height: 150 },
            ]
        },
        {
            title: 'LOG', // Logistics
            items: [
                { type: 'parking', label: 'Parcheggio', icon: <ParkingSquare size={18} />, width: 100, height: 80 },
                { type: 'truck_parking', label: 'Park Camion', icon: <Truck size={18} />, width: 150, height: 80 },
                { type: 'loading_area', label: 'Carico/Scarico', icon: <MapPin size={18} />, width: 150, height: 100 },
            ]
        },
        {
            title: 'OFF', // Office
            items: [
                { type: 'office', label: 'Uffici', icon: <Building2 size={18} />, width: 120, height: 120 },
            ]
        }
    ];

    const handleDragStart = (e: React.DragEvent, item: any) => {
        const dragPayload = {
            type: item.type,
            label: item.label,
            width: item.width,
            height: item.height
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="w-full h-14 bg-black/90 border-b border-neutral-800 flex items-center px-6 gap-6 backdrop-blur-sm z-10 shrink-0 overflow-x-auto custom-scrollbar">
            {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider writing-mode-vertical rotate-180 hidden">{cat.title}</span>
                    <div className="flex items-center gap-2">
                        {cat.items.map((item) => (
                            <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                className="
                                    w-10 h-10 flex items-center justify-center rounded-lg 
                                    bg-neutral-900 border border-neutral-800 text-neutral-400
                                    hover:bg-neutral-800 hover:text-ochre-500 hover:border-ochre-500/50 
                                    cursor-grab active:cursor-grabbing transition-all group relative
                                "
                                title={item.label}
                            >
                                {item.icon}
                                {/* Tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-white shadow-xl">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                    {idx < categories.length - 1 && <div className="w-px h-8 bg-neutral-800 mx-1" />}
                </div>
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Stats Display */}
            {stats && (
                <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 border-l border-neutral-800 pl-6 h-full select-none">
                    <div className="flex items-center gap-2">
                        <ZoomIn size={14} />
                        <span>{(stats.scale * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Layers size={14} />
                        <span>{stats.count} items</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElementList;

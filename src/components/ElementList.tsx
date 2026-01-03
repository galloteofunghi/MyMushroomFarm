import React from 'react';
import { Warehouse, Box, ThermometerSnowflake, MapPin, Truck, Building2, ParkingSquare, CornerDownRight, Split, Route, ZoomIn, Layers, Undo2, Redo2, Lock, Unlock } from 'lucide-react';

export interface ElementItem {
    type: string;
    label: string;
    icon: React.ReactNode;
    width: number;
    height: number;
}

export interface ElementCategory {
    title: string;
    items: ElementItem[];
}

interface ElementListProps {
    onDragStart?: (e: React.DragEvent, item: any) => void; // Key: exposed if needed, but we handle it internally usually
    // Stats removed
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isEditing: boolean;
    onToggleEditing: () => void;
    stats?: {
        scale: number;
        count: number;
    };
}

const ElementList: React.FC<ElementListProps> = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isEditing,
    onToggleEditing,
    stats
}) => {
    // ... categories ...
    const categories: ElementCategory[] = [
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
        <div className="w-full h-16 bg-neutral-900 border-b border-neutral-800 flex items-center px-6 gap-6 z-10 shrink-0 shadow-lg relative">

            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-neutral-800" />

            {/* Editing Toggle */}
            <button
                onClick={onToggleEditing}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border
                    ${isEditing
                        ? 'bg-ochre-500/10 text-ochre-500 border-ochre-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'}
                `}
            >
                {isEditing ? <Unlock size={16} /> : <Lock size={16} />}
                <span>{isEditing ? 'Editing Mode' : 'Monitoring'}</span>
            </button>

            {/* Stats - Moved here */}
            {stats && (
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 border-l border-neutral-800 pl-6 h-8">
                    <div className="flex items-center gap-2">
                        <ZoomIn size={14} />
                        <span>{(stats.scale * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Layers size={14} />
                        <span>{stats.count}</span>
                    </div>
                </div>
            )}

            {!isEditing && <div className="text-xs text-neutral-500 italic ml-2">Read-Only Mode</div>}

            <div className="w-px h-6 bg-neutral-700" />

            {/* Element Palette - Only visible in Editing Mode */}
            {isEditing && (
                <div className="flex items-center gap-6 animate-fadeIn">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-4 shrink-0 relative z-10">
                            <div className="flex items-center gap-3">
                                {cat.items.map((item) => (
                                    <div
                                        key={item.type}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className="
                                            w-11 h-11 flex items-center justify-center rounded-lg 
                                            bg-neutral-800 border border-neutral-700 text-neutral-400
                                            hover:bg-ochre-500 hover:text-black hover:border-transparent hover:scale-105 hover:shadow-lg hover:shadow-ochre-500/30
                                            cursor-grab active:cursor-grabbing transition-all duration-200 group relative
                                        "
                                        title={item.label}
                                    >
                                        {item.icon}
                                        {/* Tooltip */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 text-white shadow-xl">
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {idx < categories.length - 1 && <div className="w-px h-6 bg-neutral-700 mx-2" />}
                        </div>
                    ))}
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* History Controls (Only in Editing) */}
            <div className={`flex items-center gap-2 border-l border-neutral-800 pl-6 relative z-10 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`
                        w-9 h-9 flex items-center justify-center rounded-lg transition-all
                        ${canUndo
                            ? 'text-neutral-400 hover:text-ochre-500 hover:bg-neutral-800 active:scale-95'
                            : 'text-neutral-700 cursor-not-allowed opacity-50'}
                    `}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={18} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`
                        w-9 h-9 flex items-center justify-center rounded-lg transition-all
                        ${canRedo
                            ? 'text-neutral-400 hover:text-ochre-500 hover:bg-neutral-800 active:scale-95'
                            : 'text-neutral-700 cursor-not-allowed opacity-50'}
                    `}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={18} />
                </button>
            </div>

        </div>
    );
};

export default ElementList;

import React from 'react';
import { Warehouse, Box, ThermometerSnowflake, Ruler, MapPin, Truck, Building2, ParkingSquare, CornerDownRight, Split, Route } from 'lucide-react';

const ElementList: React.FC = () => {
    const items = [
        { type: 'greenhouse', label: 'Serra Coltura', icon: <Warehouse size={20} />, width: 100, height: 200 },
        { type: 'room', label: 'Stanza Custom', icon: <Box size={20} />, width: 150, height: 150 },
        { type: 'fridge', label: 'Cella Frigo', icon: <ThermometerSnowflake size={20} />, width: 120, height: 100 },
        // Infrastructure
        { type: 'road_straight', label: 'Strada Dritta', icon: <Route size={20} />, width: 200, height: 60 },
        { type: 'road_curve', label: 'Curva', icon: <CornerDownRight size={20} />, width: 100, height: 100 },
        { type: 'road_intersection', label: 'Incrocio', icon: <Split size={20} />, width: 150, height: 150 },
        // Logistics
        { type: 'parking', label: 'Parcheggio', icon: <ParkingSquare size={20} />, width: 100, height: 80 },
        { type: 'truck_parking', label: 'Park Camion', icon: <Truck size={20} />, width: 150, height: 80 },
        { type: 'loading_area', label: 'Carico/Scarico', icon: <MapPin size={20} />, width: 150, height: 100 },
        // Buildings
        { type: 'office', label: 'Uffici', icon: <Building2 size={20} />, width: 120, height: 120 },
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
        <div className="w-64 bg-neutral-800 border-r border-neutral-700 p-4 flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Elementi</h2>

            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg hover:bg-neutral-600 hover:ring-2 hover:ring-blue-500 cursor-grab active:cursor-grabbing transition-all border border-neutral-600"
                    >
                        <div className="text-neutral-300 pointer-events-none">
                            {item.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{item.label}</span>
                            <span className="text-[10px] text-neutral-400">{item.width}x{item.height}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto p-3 bg-neutral-900/50 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 text-neutral-400 mb-1">
                    <Ruler size={14} />
                    <span className="text-xs font-medium">Info</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                    Trascina gli elementi sulla griglia. Usa Shift per selezionare più oggetti.
                </p>
            </div>
        </div>
    );
};

export default ElementList;

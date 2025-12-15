import React from 'react';
import { Warehouse, Box, ThermometerSnowflake, Ruler, MapPin, Truck, Building2, ParkingSquare, CornerDownRight, Split, Route } from 'lucide-react';

const ElementList: React.FC = () => {
    const categories = [
        {
            title: 'Coltivazione',
            items: [
                { type: 'greenhouse', label: 'Serra Coltura', icon: <Warehouse size={20} />, width: 100, height: 200 },
                { type: 'room', label: 'Stanza Custom', icon: <Box size={20} />, width: 150, height: 150 },
                { type: 'fridge', label: 'Cella Frigo', icon: <ThermometerSnowflake size={20} />, width: 120, height: 100 },
                { type: 'incubation_room', label: 'Incubazione', icon: <ThermometerSnowflake size={20} className="text-purple-400" />, width: 120, height: 120 },
            ]
        },
        {
            title: 'Infrastruttura',
            items: [
                { type: 'road_straight', label: 'Strada Dritta', icon: <Route size={20} />, width: 200, height: 60 },
                { type: 'road_curve', label: 'Curva', icon: <CornerDownRight size={20} />, width: 100, height: 100 },
                { type: 'road_intersection', label: 'Incrocio', icon: <Split size={20} />, width: 150, height: 150 },
            ]
        },
        {
            title: 'Logistica',
            items: [
                { type: 'parking', label: 'Parcheggio', icon: <ParkingSquare size={20} />, width: 100, height: 80 },
                { type: 'truck_parking', label: 'Park Camion', icon: <Truck size={20} />, width: 150, height: 80 },
                { type: 'loading_area', label: 'Carico/Scarico', icon: <MapPin size={20} />, width: 150, height: 100 },
            ]
        },
        {
            title: 'Edifici',
            items: [
                { type: 'office', label: 'Uffici', icon: <Building2 size={20} />, width: 120, height: 120 },
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
        <div className="w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col overflow-y-auto">
            <div className="p-4 pb-2">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Elementi</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat, idx) => (
                    <div key={idx} className="mb-4 px-4">
                        <h3 className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">{cat.title}</h3>
                        <div className="flex flex-col gap-2">
                            {cat.items.map((item) => (
                                <div
                                    key={item.type}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    className="flex items-center gap-3 p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg border border-transparent hover:border-neutral-500 cursor-grab active:cursor-grabbing transition-all group"
                                >
                                    <div className="text-neutral-400 group-hover:text-white transition-colors">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-neutral-200 group-hover:text-white">{item.label}</span>
                                        <span className="text-[10px] text-neutral-500">{item.width}x{item.height}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-700">
                <div className="flex items-center gap-2 text-neutral-400 mb-1">
                    <Ruler size={14} />
                    <span className="text-xs font-medium">Info</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                    Trascina nella griglia. Shift+Click per selezione multipla.
                </p>
            </div>
        </div>
    );
};

export default ElementList;

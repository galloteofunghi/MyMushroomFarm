import React, { useState, useEffect } from 'react';
import { X, Save, Box, Package, Activity } from 'lucide-react';
import type { FarmElement } from '../types';

interface ElementDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FarmElement>) => void;
    selectedElements: FarmElement[];
}

const ElementDetailsDialog: React.FC<ElementDetailsDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    selectedElements
}) => {
    const [capacity, setCapacity] = useState<string>('');
    const [bagCount, setBagCount] = useState<string>('');
    const [status, setStatus] = useState<string>('storage');
    const [mushroomType, setMushroomType] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');

    useEffect(() => {
        if (isOpen && selectedElements.length > 0) {
            // If single element, populate fields
            if (selectedElements.length === 1) {
                const el = selectedElements[0];
                setCapacity(el.capacity?.toString() || '');
                setBagCount(el.bagCount?.toString() || '');
                setStatus(el.lifecycleStatus || 'storage');
                setMushroomType(el.mushroomType || '');
                setStartDate(el.phaseStartDate ? new Date(el.phaseStartDate).toISOString().split('T')[0] : '');
            } else {
                // If multiple, populate only if all match, else empty/mixed
                const first = selectedElements[0];
                const allCapSame = selectedElements.every(e => e.capacity === first.capacity);
                const allBagSame = selectedElements.every(e => e.bagCount === first.bagCount);
                const allStatusSame = selectedElements.every(e => e.lifecycleStatus === first.lifecycleStatus);
                const allTypeSame = selectedElements.every(e => e.mushroomType === first.mushroomType);
                const allDateSame = selectedElements.every(e => e.phaseStartDate === first.phaseStartDate);

                setCapacity(allCapSame ? first.capacity?.toString() || '' : '');
                setBagCount(allBagSame ? first.bagCount?.toString() || '' : '');
                setStatus(allStatusSame ? first.lifecycleStatus || 'storage' : 'mixed');
                setMushroomType(allTypeSame ? first.mushroomType || '' : 'mixed');
                setStartDate(allDateSame && first.phaseStartDate ? new Date(first.phaseStartDate).toISOString().split('T')[0] : '');
            }
        }
    }, [isOpen, selectedElements]);

    if (!isOpen) return null;

    const handleSave = () => {
        const updates: Partial<FarmElement> = {};

        if (capacity !== '') updates.capacity = Number(capacity);
        if (bagCount !== '') updates.bagCount = Number(bagCount);
        if (status !== 'mixed') updates.lifecycleStatus = status as any;
        if (mushroomType !== 'mixed' && mushroomType !== '') updates.mushroomType = mushroomType as any;
        if (startDate !== '') updates.phaseStartDate = new Date(startDate).getTime();

        onSave(updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-neutral-800 p-4 border-b border-neutral-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedElements.length > 1
                            ? `Modifica ${selectedElements.length} Elementi`
                            : `Modifica ${selectedElements[0]?.name || 'Elemento'}`}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Capacity */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                            <Box size={14} /> Capacità Stoccaggio (Sacchi)
                        </label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            placeholder={selectedElements.length > 1 ? "Valori misti..." : "0"}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Current Bags */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                            <Package size={14} /> Numero Sacchi Attuali
                        </label>
                        <input
                            type="number"
                            value={bagCount}
                            onChange={(e) => setBagCount(e.target.value)}
                            placeholder={selectedElements.length > 1 ? "Valori misti..." : "0"}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Mushroom Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                            <Package size={14} /> Tipologia Fungo
                        </label>
                        <select
                            value={mushroomType}
                            onChange={(e) => setMushroomType(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none"
                        >
                            <option value="" disabled>Seleziona tipologia...</option>
                            {mushroomType === 'mixed' && <option value="mixed">Misti (non modificare)</option>}
                            {[
                                'Pleurotus', 'Pleurotus Cornucopiae', 'Champignon Bianco', 'Champignon Crema', 'Pioppino', 'Cardoncello',
                                'Shiitake', 'Lion\'s Mane', 'Reishi', 'Nameko', 'Grifola Frondosa'
                            ].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lifecycle Status & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                <Activity size={14} /> Stato Operativo
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'storage', label: 'Stoccaggio', color: 'bg-blue-500' },
                                    { id: 'incubation', label: 'Incubazione', color: 'bg-purple-500' },
                                    { id: 'fruiting', label: 'Fruttificazione', color: 'bg-green-500' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setStatus(opt.id)}
                                        className={`
                                            px-2 py-3 rounded-lg text-xs font-bold border transition-all
                                            ${status === opt.id
                                                ? `${opt.color} border-transparent text-white shadow-lg scale-105`
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700'}
                                        `}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Picker (Only if active phase) */}
                        {(status === 'incubation' || status === 'fruiting') && (
                            <div className="space-y-2 col-span-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    Data Inizio Fase
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-neutral-950 flex justify-end gap-3 border-t border-neutral-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Save size={16} /> Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ElementDetailsDialog;

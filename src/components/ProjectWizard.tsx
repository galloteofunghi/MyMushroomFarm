import React, { useState, useCallback } from 'react';
import type { Project, MushroomType, MushroomSettings } from '../types';
import { MUSHROOM_TYPES, DEFAULT_MUSHROOM_SETTINGS } from '../constants/mushrooms';
import { ArrowRight, Check, Settings as SettingsIcon, Upload, Image as ImageIcon } from 'lucide-react';

interface ProjectWizardProps {
    onComplete: (project: Project) => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [activeMushrooms, setActiveMushrooms] = useState<MushroomType[]>([]);
    const [settings, setSettings] = useState<Record<MushroomType, MushroomSettings>>({} as any);
    const [isDragging, setIsDragging] = useState(false);

    // --- Drag & Drop Logo ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleNext = () => {
        if (step === 1 && companyName) setStep(2);
        else if (step === 2 && activeMushrooms.length > 0) {
            // Initialize settings
            const newSettings = { ...settings };
            activeMushrooms.forEach(m => {
                if (!newSettings[m]) newSettings[m] = { ...DEFAULT_MUSHROOM_SETTINGS };
            });
            setSettings(newSettings);
            setStep(3);
        } else if (step === 3) {
            handleFinish();
        }
    };

    const handleFinish = () => {
        const project: Project = {
            id: crypto.randomUUID(),
            companyName,
            logoUrl: logoPreview || undefined,
            activeMushrooms,
            mushroomSettings: settings,
            elements: [],
            lastModified: Date.now(),
        };
        onComplete(project);
    };

    const updateSetting = (type: MushroomType, field: keyof MushroomSettings, value: number) => {
        setSettings(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    // --- STEP 1: Company Info ---
    const renderStep1 = () => (
        <div className="flex flex-col gap-8 animate-fadeIn max-w-2xl mx-auto w-full">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-ochre-500 mb-2 font-display">Benvenuto in FarmDesigner</h2>
                <p className="text-neutral-400">Iniziamo configurando la tua azienda.</p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-ochre-400 uppercase tracking-widest">Nome Azienda</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-neutral-900 border-2 border-neutral-800 rounded-xl p-4 text-2xl text-white focus:border-ochre-500 outline-none transition-colors"
                    placeholder="Es. My Sustainable Farm"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-ochre-400 uppercase tracking-widest">Logo Aziendate</label>
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-all
                        ${isDragging ? 'border-ochre-500 bg-ochre-900/20' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}
                        ${logoPreview ? 'border-solid border-ochre-600' : ''}
                    `}
                >
                    {logoPreview ? (
                        <div className="relative w-full h-full p-4">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                            <button
                                onClick={() => setLogoPreview(null)}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-red-900/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                            >
                                <SettingsIcon size={16} className="rotate-45" /> {/* Close icon substitute */}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-neutral-500 pointer-events-none">
                            <Upload size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Trascina qui il tuo logo</p>
                            <p className="text-sm opacity-60">o incolla un file immagine</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- STEP 2: Mushroom Selection ---
    const renderStep2 = () => (
        <div className="flex flex-col gap-6 animate-fadeIn h-full">
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-ochre-500 mb-2">Seleziona Colture</h2>
                <p className="text-neutral-400">Quali varietà intendi coltivare?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {MUSHROOM_TYPES.map((m) => {
                    const isSelected = activeMushrooms.includes(m.type);
                    return (
                        <div
                            key={m.type}
                            onClick={() => {
                                if (isSelected) setActiveMushrooms(activeMushrooms.filter(t => t !== m.type));
                                else setActiveMushrooms([...activeMushrooms, m.type]);
                            }}
                            className={`
                                aspect-[3/4] relative rounded-xl cursor-pointer transition-all overflow-hidden group
                                ${isSelected
                                    ? 'ring-4 ring-ochre-500 shadow-[0_0_20px_rgba(219,135,30,0.3)]'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105'}
                            `}
                        >
                            {/* Placeholder Image background - In real app use m.image */}
                            <div className="absolute inset-0 bg-neutral-800">
                                {m.image ? (
                                    <img src={m.image} alt={m.label} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 border border-neutral-800">
                                        <div className="text-center opacity-30">
                                            <ImageIcon size={48} className="mx-auto mb-2" />
                                            <span className="text-xs uppercase font-bold">{m.label}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                            <div className="absolute bottom-0 left-0 w-full p-4">
                                <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-ochre-400' : 'text-neutral-300'}`}>{m.label}</h3>
                            </div>

                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-ochre-500 text-black p-1 rounded-full shadow-lg">
                                    <Check size={16} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // --- STEP 3: Settings ---
    const renderStep3 = () => (
        <div className="flex flex-col gap-6 animate-fadeIn h-full">
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-ochre-500 mb-2">Configurazione Parametri</h2>
                <p className="text-neutral-400">Definisci i cicli produttivi per le colture scelte.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar flex flex-col gap-4 max-w-4xl mx-auto w-full">
                {activeMushrooms.map(m => (
                    <div key={m} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 flex flex-col md:flex-row gap-6 hover:border-ochre-900 transition-colors">
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="w-12 h-12 bg-ochre-900/20 text-ochre-500 rounded-full flex items-center justify-center text-2xl border border-ochre-900">
                                🍄
                            </div>
                            <h3 className="font-bold text-xl text-neutral-200">{m}</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">Incubazione</label>
                                <div className="flex items-center gap-2">
                                    <input type="number"
                                        value={settings[m]?.incubationDays}
                                        onChange={(e) => updateSetting(m, 'incubationDays', Number(e.target.value))}
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white text-center focus:border-ochre-500 outline-none"
                                    />
                                    <span className="text-xs text-neutral-600">gg</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">1° Raccolto</label>
                                <div className="flex items-center gap-2">
                                    <input type="number"
                                        value={settings[m]?.firstHarvestDays}
                                        onChange={(e) => updateSetting(m, 'firstHarvestDays', Number(e.target.value))}
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white text-center focus:border-ochre-500 outline-none"
                                    />
                                    <span className="text-xs text-neutral-600">gg</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">Resa 1 (%)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number"
                                        value={settings[m]?.firstHarvestYield}
                                        onChange={(e) => updateSetting(m, 'firstHarvestYield', Number(e.target.value))}
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white text-center focus:border-ochre-500 outline-none"
                                    />
                                    <span className="text-xs text-neutral-600">%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">Resa 2 (%)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number"
                                        value={settings[m]?.secondHarvestYield}
                                        onChange={(e) => updateSetting(m, 'secondHarvestYield', Number(e.target.value))}
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-white text-center focus:border-ochre-500 outline-none"
                                    />
                                    <span className="text-xs text-neutral-600">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col font-sans">
            {/* Minimal Header */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-neutral-900 bg-black/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-ochre-500 rounded-lg flex items-center justify-center font-bold text-black text-xl">
                        F
                    </div>
                    <span className="font-bold text-xl tracking-wide">FarmDesigner</span>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-ochre-500' : 'w-2 bg-neutral-800'}`} />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative p-8 flex flex-col items-center justify-center">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>

            {/* Footer Actions */}
            <div className="h-24 border-t border-neutral-900 bg-black/50 backdrop-blur-md flex items-center justify-between px-8">
                <button
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    className={`text-neutral-500 hover:text-white transition-colors flex items-center gap-2 px-6 py-3 uppercase tracking-widest text-xs font-bold ${step === 1 ? 'invisible' : ''}`}
                >
                    Indietro
                </button>

                <button
                    onClick={handleNext}
                    disabled={(step === 1 && !companyName) || (step === 2 && activeMushrooms.length === 0)}
                    className="bg-ochre-600 hover:bg-ochre-500 text-black px-8 py-4 rounded-xl flex items-center gap-3 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-[0_0_20px_rgba(219,135,30,0.4)]"
                >
                    {step === 3 ? 'Crea Progetto' : 'Continua'}
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default ProjectWizard;

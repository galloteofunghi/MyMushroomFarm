import React, { useState } from 'react';
import type { Project, MushroomType, MushroomSettings } from '../types';
import { MUSHROOM_TYPES, DEFAULT_MUSHROOM_SETTINGS } from '../constants/mushrooms';
import { ArrowRight, Check, Sprout, Building, Settings as SettingsIcon } from 'lucide-react';

interface ProjectWizardProps {
    onComplete: (project: Project) => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [activeMushrooms, setActiveMushrooms] = useState<MushroomType[]>([]);
    const [settings, setSettings] = useState<Record<MushroomType, MushroomSettings>>({} as any);

    const handleNext = () => {
        if (step === 1 && companyName) setStep(2);
        else if (step === 2 && activeMushrooms.length > 0) {
            // Initialize settings for selected mushrooms
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
        <div className="flex flex-col gap-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building className="text-blue-400" />
                Dati Aziendali
            </h2>
            <div className="flex flex-col gap-2">
                <label className="text-sm text-neutral-400">Nome Azienda</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Es. My Sustainable Farm"
                />
            </div>
            {/* Logo Upload Placeholder - Can be expanded later */}
            <div className="p-8 border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center text-neutral-500 text-sm">
                Logo Upload (Optional - Coming Soon)
            </div>
        </div>
    );

    // --- STEP 2: Mushroom Selection ---
    const renderStep2 = () => (
        <div className="flex flex-col gap-6 animate-fadeIn h-full overflow-hidden">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sprout className="text-green-400" />
                Seleziona Colture
            </h2>
            <p className="text-neutral-400 text-sm">Seleziona i funghi che intendi coltivare.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
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
                                p-4 rounded-lg cursor-pointer border transition-all flex flex-col items-center gap-2 text-center relative
                                ${isSelected
                                    ? 'bg-green-900/40 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-750'}
                            `}
                        >
                            {isSelected && <div className="absolute top-2 right-2 text-green-400"><Check size={16} /></div>}
                            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-2xl">
                                🍄
                            </div>
                            <span className="font-medium text-sm">{m.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // --- STEP 3: Settings ---
    const renderStep3 = () => (
        <div className="flex flex-col gap-6 animate-fadeIn h-full overflow-hidden">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="text-purple-400" />
                Configurazione Cicli
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
                {activeMushrooms.map(m => (
                    <div key={m} className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                        <h3 className="font-bold text-lg text-emerald-400 mb-4">{m}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <label className="text-neutral-500">Incubazione (gg)</label>
                                <input type="number" value={settings[m]?.incubationDays} onChange={(e) => updateSetting(m, 'incubationDays', Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-neutral-500">Raccolto 1 (gg)</label>
                                <input type="number" value={settings[m]?.firstHarvestDays} onChange={(e) => updateSetting(m, 'firstHarvestDays', Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-neutral-500">Resa 1 (%)</label>
                                <input type="number" value={settings[m]?.firstHarvestYield} onChange={(e) => updateSetting(m, 'firstHarvestYield', Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-neutral-500">Resa 2 (%)</label>
                                <input type="number" value={settings[m]?.secondHarvestYield} onChange={(e) => updateSetting(m, 'secondHarvestYield', Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
                {/* Header Steps */}
                <div className="flex border-b border-neutral-800 bg-neutral-950/50">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex-1 p-4 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors ${step >= i ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= i ? 'bg-blue-500 text-black' : 'bg-neutral-800'}`}>
                                {i}
                            </div>
                            <span className="hidden sm:inline">
                                {i === 1 && 'Azienda'}
                                {i === 2 && 'Colture'}
                                {i === 3 && 'Parametri'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-hidden">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-neutral-800 flex justify-between bg-neutral-950/30">
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`px-6 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors ${step === 1 ? 'invisible' : ''}`}
                    >
                        Indietro
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={(step === 1 && !companyName) || (step === 2 && activeMushrooms.length === 0)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {step === 3 ? 'Crea Progetto' : 'Avanti'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectWizard;

import React, { useState } from 'react';
import type { Project, MushroomType, MushroomSettings } from '../types';
import { Save, Upload } from 'lucide-react';
import { persistenceManager } from '../services/persistence';

interface SettingsViewProps {
    project: Project;
    onUpdateProject: (p: Project) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ project, onUpdateProject }) => {
    const [companyName, setCompanyName] = useState(project.companyName);
    const [settings, setSettings] = useState(project.mushroomSettings);
    // We don't support adding new mushrooms here yet for simplicity, just editing existing
    // But user asked "Nei settings ci vanno tutti i dati messi nel wizard"

    // Auto-save handler
    const handleSave = () => {
        const updated = {
            ...project,
            companyName,
            mushroomSettings: settings,
            lastModified: Date.now()
        };
        persistenceManager.saveProject(updated);
        onUpdateProject(updated);
        alert('Settings Saved!');
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

    return (
        <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-20">
                <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Impostazioni Progetto</h1>
                        <p className="text-neutral-500">Gestisci i dati dell'azienda e i parametri di coltivazione.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-ochre-600 hover:bg-ochre-500 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        Salva Modifiche
                    </button>
                </header>

                {/* Company Section */}
                <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-ochre-500 mb-6 uppercase tracking-wider text-sm">Dati Aziendali</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-400">Nome Azienda</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-ochre-500 outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-400">Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700 overflow-hidden">
                                    {project.logoUrl ? <img src={project.logoUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-neutral-600">No Logo</span>}
                                </div>
                                <button className="text-sm text-ochre-500 hover:underline flex items-center gap-2">
                                    <Upload size={14} /> Cambia Logo (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mushrooms Section */}
                <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-ochre-500 mb-6 uppercase tracking-wider text-sm">Parametri Colture Attive</h2>
                    <div className="flex flex-col gap-6">
                        {project.activeMushrooms.map(m => (
                            <div key={m} className="bg-black/40 p-4 rounded-lg border border-neutral-800">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="text-ochre-500">🍄</span> {m}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-neutral-500 uppercase">Incubazione</label>
                                        <input type="number" className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-ochre-500 outline-none"
                                            value={settings[m]?.incubationDays} onChange={e => updateSetting(m, 'incubationDays', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-neutral-500 uppercase">1° Raccolto</label>
                                        <input type="number" className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-ochre-500 outline-none"
                                            value={settings[m]?.firstHarvestDays} onChange={e => updateSetting(m, 'firstHarvestDays', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-neutral-500 uppercase">2° Raccolto</label>
                                        <input type="number" className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-ochre-500 outline-none"
                                            value={settings[m]?.secondHarvestDays} onChange={e => updateSetting(m, 'secondHarvestDays', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-neutral-500 uppercase">Resa 1 (%)</label>
                                        <input type="number" className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-ochre-500 outline-none"
                                            value={settings[m]?.firstHarvestYield} onChange={e => updateSetting(m, 'firstHarvestYield', Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-neutral-500 uppercase">Resa 2 (%)</label>
                                        <input type="number" className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-ochre-500 outline-none"
                                            value={settings[m]?.secondHarvestYield} onChange={e => updateSetting(m, 'secondHarvestYield', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsView;

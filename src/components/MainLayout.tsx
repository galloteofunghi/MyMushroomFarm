import React from 'react';
import type { Project } from '../types';
import { LayoutDashboard, Factory, Truck, Sprout, ClipboardList, Package, Settings, Warehouse } from 'lucide-react';

interface MainLayoutProps {
    project: Project;
    currentView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { id: 'farm-designer', label: 'Farm Designer', icon: <LayoutDashboard size={20} /> },
    { id: 'recap', label: 'Serre Recap', icon: <Warehouse size={20} /> },
    { id: 'loads', label: 'Carichi', icon: <Truck size={20} /> },
    { id: 'harvest', label: 'Raccolta', icon: <Sprout size={20} /> },
    { id: 'incubation', label: 'Incubazione', icon: <Settings size={20} /> }, // Placeholder icon
    { id: 'production', label: 'Produzione', icon: <Factory size={20} /> },
    { id: 'warehouse', label: 'Magazzino', icon: <Package size={20} /> },
    { id: 'orders', label: 'Ordini', icon: <ClipboardList size={20} /> },
    { id: 'settings', label: 'Setting', icon: <Settings size={20} /> },
];

const MainLayout: React.FC<MainLayoutProps> = ({ project, currentView, onViewChange, children }) => {
    return (
        <div className="flex w-full h-full bg-neutral-950 text-white overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <div className="w-16 md:w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300">
                {/* Header */}
                <div className="h-16 flex items-center px-4 border-b border-neutral-800 gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
                        {project.companyName.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold truncate hidden md:block">{project.companyName}</span>
                </div>

                {/* Nav Items */}
                <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`
                                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors group relative
                                ${currentView === item.id
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}
                            `}
                            title={item.label}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            <span className="font-medium hidden md:block truncate">{item.label}</span>

                            {/* Active Indicator */}
                            {currentView === item.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer User Profile (Mock) */}
                <div className="p-4 border-t border-neutral-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 shrink-0"></div>
                    <div className="flex flex-col hidden md:flex">
                        <span className="text-xs font-bold text-neutral-300">Admin User</span>
                        <span className="text-[10px] text-neutral-500">View Profile</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;

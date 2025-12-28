import React, { useState } from 'react';
import type { Project } from '../types';
import { LayoutDashboard, Factory, Truck, Sprout, ClipboardList, Package, Settings, Warehouse, ChevronLeft, ChevronRight } from 'lucide-react';

interface MainLayoutProps {
    project: Project;
    currentView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { id: 'farm-designer', label: 'Farm Designer', icon: <LayoutDashboard size={24} /> },
    { id: 'recap', label: 'Serre Recap', icon: <Warehouse size={24} /> },
    { id: 'loads', label: 'Carichi', icon: <Truck size={24} /> },
    { id: 'harvest', label: 'Raccolta', icon: <Sprout size={24} /> },
    { id: 'incubation', label: 'Incubazione', icon: <Settings size={24} /> },
    { id: 'production', label: 'Produzione', icon: <Factory size={24} /> },
    { id: 'warehouse', label: 'Magazzino', icon: <Package size={24} /> },
    { id: 'orders', label: 'Ordini', icon: <ClipboardList size={24} /> },
    { id: 'settings', label: 'Setting', icon: <Settings size={24} /> },
];

const MainLayout: React.FC<MainLayoutProps> = ({ project, currentView, onViewChange, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex w-screen h-screen bg-black text-white overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <div
                className={`
                    relative bg-black border-r border-neutral-900 flex flex-col transition-all duration-300 ease-in-out z-20
                    ${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                {/* Header / Brand */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-neutral-900">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-ochre-500 rounded-lg flex items-center justify-center font-bold text-black text-xl shrink-0 shadow-[0_0_15px_rgba(219,135,30,0.3)]">
                            {project.logoUrl ? (
                                <img src={project.logoUrl} className="w-full h-full object-cover rounded-lg" alt="Logo" />
                            ) : (
                                project.companyName.substring(0, 1).toUpperCase()
                            )}
                        </div>
                        <div className={`flex flex-col transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            <span className="font-bold text-lg whitespace-nowrap text-white">{project.companyName}</span>
                            <span className="text-[10px] text-ochre-500 uppercase tracking-widest font-bold">Manager</span>
                        </div>
                    </div>
                </div>

                {/* Collapse Toggle - Absolute on border */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer z-50 hover:scale-110 transition-transform"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Nav Items */}
                <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar px-2">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`
                                flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative overflow-hidden
                                ${currentView === item.id
                                    ? 'bg-ochre-500 text-black shadow-lg font-bold'
                                    : 'text-neutral-500 hover:bg-neutral-900 hover:text-ochre-400'}
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                            title={item.label}
                        >
                            <span className="shrink-0 transition-transform group-hover:scale-110">{item.icon}</span>

                            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                {item.label}
                            </span>

                            {/* Active Indicator Line for Collapsed Mode */}
                            {currentView === item.id && isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black rounded-r-full opacity-30" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-neutral-900 bg-neutral-950/30">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 shrink-0"></div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-neutral-300">Admin User</span>
                                <span className="text-[10px] text-neutral-600 truncate">admin@farm.com</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-neutral-950/50">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;

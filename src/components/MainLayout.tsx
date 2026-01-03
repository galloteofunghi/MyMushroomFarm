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
        <div className="flex w-screen h-screen text-neutral-200 overflow-hidden font-sans">
            {/* Sidebar Navigation - Solid Dark Grey */}
            <div
                className={`
                    relative flex flex-col transition-all duration-300 ease-spring z-20
                    border-r border-neutral-800 bg-neutral-900 shadow-2xl
                    ${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                {/* Header / Brand */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-ochre-500 rounded-lg flex items-center justify-center font-bold text-black text-xl shrink-0 shadow-lg shadow-ochre-500/20">
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

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-ochre-400 hover:border-ochre-500 cursor-pointer z-50 hover:scale-110 transition-all shadow-lg"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Nav Items */}
                <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar px-3">
                    {NAV_ITEMS.map(item => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`
                                    flex items-center gap-4 px-3 py-3 rounded-lg transition-all group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-ochre-500/10 text-ochre-500 border-l-2 border-ochre-500'
                                        : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200'}
                                    ${isCollapsed ? 'justify-center px-0' : ''}
                                `}
                                title={item.label}
                            >
                                <span className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>

                                <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 shrink-0"></div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-neutral-300">Admin User</span>
                                <span className="text-[10px] text-neutral-500 truncate">admin@farm.com</span>
                            </div>
                        )}
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

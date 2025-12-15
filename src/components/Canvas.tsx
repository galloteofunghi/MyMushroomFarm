import React from 'react';
import type { FarmElement } from '../types';
import { Copy, RotateCw, Trash2, Warehouse, Box, ThermometerSnowflake } from 'lucide-react';

interface CanvasProps {
    elements: FarmElement[];
    onDrop: (item: any, x: number, y: number) => void;
    onRemove: (id: string) => void;
    onMove: (id: string, x: number, y: number) => void;
    onResize: (id: string, width: number, height: number, x?: number, y?: number) => void;
    onRotate: (id: string) => void;
    onDuplicate: (id: string) => void;
    onColorChange: (id: string, color: string) => void;
    onRename: (id: string, name: string) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

const Canvas: React.FC<CanvasProps> = ({
    elements, onDrop, onRemove, onMove, onResize,
    onRotate, onDuplicate, onColorChange, onRename,
    selectedId, onSelect
}) => {
    const [dragging, setDragging] = React.useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    // Include direction in resizing state
    const [resizing, setResizing] = React.useState<{
        id: string;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        startLeft: number;
        startTop: number;
        direction: string; // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    } | null>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [tempName, setTempName] = React.useState<string | null>(null);
    const [guidelines, setGuidelines] = React.useState<{ x?: number; y?: number }[]>([]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;

        try {
            const item = JSON.parse(data);
            // Default dimensions if missing
            const width = item.width || 100;
            const height = item.height || 100;

            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - width / 2;
            const y = e.clientY - rect.top - height / 2;

            onDrop(item, x, y);
        } catch (err) {
            console.error("Failed to parse drop data", err);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
        e.stopPropagation();
        setDragging({ id, offsetX: e.clientX - x, offsetY: e.clientY - y });
        onSelect(id);
    };

    const handleResizeStart = (e: React.MouseEvent, id: string, width: number, height: number, left: number, top: number, direction: string) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        setResizing({
            id,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: width,
            startHeight: height,
            startLeft: left,
            startTop: top,
            direction
        });
        onSelect(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const SNAP_THRESHOLD = 10;
        const SNAP_GAP = 5; // As requested by user

        if (dragging) {
            let newX = e.clientX - dragging.offsetX;
            let newY = e.clientY - dragging.offsetY;

            const activeEl = elements.find(el => el.id === dragging.id);
            const otherElements = elements.filter(el => el.id !== dragging.id);
            const newGuidelines: { x?: number; y?: number }[] = [];

            if (activeEl) {
                // Helper for X Snapping
                const checkXSnap = (current: number, target: number) => {
                    if (Math.abs(current - target) < SNAP_THRESHOLD) {
                        newGuidelines.push({ x: target });
                        return target;
                    }
                    return null;
                };

                let snappedX = false;
                for (const other of otherElements) {
                    if (snappedX) break;
                    const targets = [
                        other.x, // Align Left
                        other.x + other.width, // Align Right
                        other.x + other.width / 2, // Align Center
                        other.x - activeEl.width - SNAP_GAP, // Snap Left with Gap
                        other.x + other.width + SNAP_GAP // Snap Right with Gap
                    ];

                    for (const t of targets) {
                        // Visual guidelines check
                        checkXSnap(newX, t) ?? checkXSnap(newX + activeEl.width, t + activeEl.width) ?? checkXSnap(newX + activeEl.width / 2, t + activeEl.width / 2);

                        // More precise checking per edge
                        if (Math.abs(newX - t) < SNAP_THRESHOLD) { newX = t; snappedX = true; newGuidelines.push({ x: t }); break; }
                        if (Math.abs((newX + activeEl.width) - t) < SNAP_THRESHOLD) { newX = t - activeEl.width; snappedX = true; newGuidelines.push({ x: t }); break; }
                    }
                }

                // Helper for Y Snapping
                let snappedY = false;
                for (const other of otherElements) {
                    if (snappedY) break;
                    const targets = [
                        other.y,
                        other.y + other.height,
                        other.y + other.height / 2,
                        other.y - activeEl.height - SNAP_GAP,
                        other.y + other.height + SNAP_GAP
                    ];

                    for (const t of targets) {
                        if (Math.abs(newY - t) < SNAP_THRESHOLD) { newY = t; snappedY = true; newGuidelines.push({ y: t }); break; }
                        if (Math.abs((newY + activeEl.height) - t) < SNAP_THRESHOLD) { newY = t - activeEl.height; snappedY = true; newGuidelines.push({ y: t }); break; }
                    }
                }
            }

            setGuidelines(newGuidelines);
            onMove(dragging.id, newX, newY);

        } else if (resizing) {
            const deltaX = e.clientX - resizing.startX;
            const deltaY = e.clientY - resizing.startY;

            let newWidth = resizing.startWidth;
            let newHeight = resizing.startHeight;
            let newX = resizing.startLeft;
            let newY = resizing.startTop;

            if (resizing.direction.includes('e')) newWidth = Math.max(50, resizing.startWidth + deltaX);
            if (resizing.direction.includes('s')) newHeight = Math.max(50, resizing.startHeight + deltaY);
            if (resizing.direction.includes('w')) {
                const maxDelta = resizing.startWidth - 50;
                const validDelta = Math.min(maxDelta, deltaX);
                newWidth = resizing.startWidth - validDelta;
                newX = resizing.startLeft + validDelta;
            }
            if (resizing.direction.includes('n')) {
                const maxDelta = resizing.startHeight - 50;
                const validDelta = Math.min(maxDelta, deltaY);
                newHeight = resizing.startHeight - validDelta;
                newY = resizing.startTop + validDelta;
            }

            // Dimension Snapping
            const activeEl = elements.find(el => el.id === resizing.id);
            const otherElements = elements.filter(el => el.id !== resizing.id);

            if (activeEl) { // Should always be true
                // Width Snapping
                if (resizing.direction.includes('e') || resizing.direction.includes('w')) {
                    for (const other of otherElements) {
                        if (Math.abs(newWidth - other.width) < SNAP_THRESHOLD) {
                            // Adjust X if resizing West
                            if (resizing.direction.includes('w')) {
                                newX = resizing.startLeft + (resizing.startWidth - other.width);
                            }
                            newWidth = other.width;
                            break;
                        }
                    }
                }
                // Height Snapping
                if (resizing.direction.includes('s') || resizing.direction.includes('n')) {
                    for (const other of otherElements) {
                        if (Math.abs(newHeight - other.height) < SNAP_THRESHOLD) {
                            if (resizing.direction.includes('n')) {
                                newY = resizing.startTop + (resizing.startHeight - other.height);
                            }
                            newHeight = other.height;
                            break;
                        }
                    }
                }
            }

            // Update both Size and Position (if needing shift) using the merged handler to avoid race conditions
            onResize(resizing.id, newWidth, newHeight, newX, newY);
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
        setResizing(null);
        setGuidelines([]);
    };

    // Helper to get icon
    const getIcon = (type: string) => {
        switch (type) {
            case 'greenhouse': return <Warehouse className="w-8 h-8 opacity-50" />;
            case 'room': return <Box className="w-8 h-8 opacity-50" />;
            case 'fridge': return <ThermometerSnowflake className="w-8 h-8 opacity-50" />;
            default: return null;
        }
    };

    return (
        <div
            className={`flex-1 bg-neutral-900 relative overflow-hidden board-pattern transition-colors ${isDragOver ? 'bg-neutral-800 border-4 border-blue-500' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={() => {
                onSelect(null);
                setTempName(null);
            }}
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Snap Guidelines */}
            {guidelines.map((g, i) => (
                <div key={i} className="absolute bg-red-500 z-50 pointer-events-none" style={{
                    left: g.x !== undefined ? g.x : 0,
                    top: g.y !== undefined ? g.y : 0,
                    width: g.x !== undefined ? '1px' : '100%',
                    height: g.y !== undefined ? '1px' : '100%',
                    display: 'block'
                }} />
            ))}

            {elements.map((el) => {
                const isSelected = selectedId === el.id;
                const isInteracting = dragging?.id === el.id || resizing?.id === el.id;

                return (
                    <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
                        style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            transform: `rotate(${el.rotation || 0}deg)`,
                            backgroundColor: el.color,
                            cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
                            zIndex: isInteracting || isSelected ? 100 : 1
                        }}
                        className={`
                            border-2 rounded flex flex-col items-center justify-center relative group select-none shadow-lg transition-transform
                            ${!el.color && el.type === 'greenhouse' ? 'border-green-500 bg-green-900/50' : ''}
                            ${!el.color && el.type === 'room' ? 'border-blue-500 bg-blue-900/50' : ''}
                            ${!el.color && el.type === 'fridge' ? 'border-cyan-500 bg-cyan-900/50' : ''}
                            ${isSelected ? 'shadow-2xl ring-2 ring-white/50 border-white' : ''}
                        `}
                    >
                        {/* Icon Background */}
                        <div className="absolute opacity-20 pointer-events-none" style={{ transform: `rotate(${- (el.rotation || 0)}deg)` }}>
                            {getIcon(el.type)}
                        </div>

                        {/* Context Menu - Hidden when dragging */}
                        {isSelected && !dragging && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-neutral-800 p-1 rounded-lg border border-neutral-700 shadow-xl z-20 cursor-default"
                                onMouseDown={e => e.stopPropagation()}>
                                <button onClick={() => onRotate(el.id)} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Rotate">
                                    <RotateCw size={14} />
                                </button>
                                <button onClick={() => onDuplicate(el.id)} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Duplicate">
                                    <Copy size={14} />
                                </button>
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (window.confirm("Sei sicuro di voler eliminare questo elemento?")) {
                                            onRemove(el.id);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-neutral-700 rounded text-red-500 hover:text-red-600"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div className="w-px bg-neutral-700 mx-0.5"></div>
                                <div className="flex gap-1 items-center px-1">
                                    {['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => onColorChange(el.id, c)}
                                            className="w-3 h-3 rounded-full hover:scale-125 transition-transform"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Renaming Input or Label */}
                        <div className="w-full px-2 text-center relative z-10" style={{ transform: `rotate(${- (el.rotation || 0)}deg)` }}>
                            {isSelected ? (
                                <input
                                    className="w-full bg-transparent text-center text-xs font-bold outline-none border-b border-transparent focus:border-white pointer-events-auto text-white drop-shadow-md"
                                    value={tempName !== null ? tempName : el.name}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onBlur={() => {
                                        if (tempName) onRename(el.id, tempName);
                                        setTempName(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (tempName) onRename(el.id, tempName);
                                            setTempName(null);
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onFocus={() => setTempName(el.name)}
                                    onMouseDown={e => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-xs font-bold truncate block text-white drop-shadow-md">{el.name}</span>
                            )}
                            {(isInteracting || isSelected) && (
                                <div className="text-[10px] text-neutral-300 font-mono mt-0.5 drop-shadow-md">
                                    {Math.round(el.width)} x {Math.round(el.height)}
                                </div>
                            )}
                        </div>

                        {/* Resize Handles - Show only if selected and not dragging */}
                        {isSelected && !dragging && (
                            <>
                                {/* Corners */}
                                <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize -ml-1.5 -mt-1.5 bg-white border border-neutral-400 rounded-sm z-20"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'nw')} />
                                <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize -mr-1.5 -mt-1.5 bg-white border border-neutral-400 rounded-sm z-20"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'ne')} />
                                <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize -ml-1.5 -mb-1.5 bg-white border border-neutral-400 rounded-sm z-20"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'sw')} />
                                <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize -mr-1.5 -mb-1.5 bg-white border border-neutral-400 rounded-sm z-20"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'se')} />

                                {/* Sides */}
                                <div className="absolute top-0 left-1/2 w-3 h-3 cursor-n-resize -ml-1.5 -mt-1.5 bg-white/50 border border-neutral-400 rounded-sm z-10"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'n')} />
                                <div className="absolute bottom-0 left-1/2 w-3 h-3 cursor-s-resize -ml-1.5 -mb-1.5 bg-white/50 border border-neutral-400 rounded-sm z-10"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 's')} />
                                <div className="absolute top-1/2 left-0 w-3 h-3 cursor-w-resize -ml-1.5 -mt-1.5 bg-white/50 border border-neutral-400 rounded-sm z-10"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'w')} />
                                <div className="absolute top-1/2 right-0 w-3 h-3 cursor-e-resize -mr-1.5 -mt-1.5 bg-white/50 border border-neutral-400 rounded-sm z-10"
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, 'e')} />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Canvas;

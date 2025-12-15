import React, { useRef, useEffect } from 'react';
import type { FarmElement } from '../types';
import { Copy, RotateCw, Trash2, Warehouse, Box, ThermometerSnowflake, ZoomIn, ZoomOut, Maximize, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, ArrowUpToLine, ArrowDownToLine, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, MapPin, Building2 } from 'lucide-react';

interface CanvasProps {
    elements: FarmElement[];
    selectedIds: string[];
    view: { x: number; y: number; scale: number };
    onViewChange: (view: { x: number; y: number; scale: number }) => void;
    onDrop: (item: any, x: number, y: number) => void;
    onRemove: (ids: string[]) => void;
    onMove: (id: string, dx: number, dy: number, isDelta?: boolean) => void;
    onResize: (id: string, width: number, height: number, x?: number, y?: number) => void;
    onRotate: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDuplicateReturn: (id: string) => string | null;
    onColorChange: (id: string, color: string) => void;
    onRename: (id: string, name: string) => void;
    onSelect: (id: string | null, multi: boolean) => void;
    onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    onDistribute: (type: 'horizontal' | 'vertical') => void;
    onInteractionEnd: () => void;
}

const Canvas: React.FC<CanvasProps> = ({
    elements, selectedIds, view, onViewChange,
    onDrop, onRemove, onMove, onResize,
    onRotate, onDuplicate, onDuplicateReturn, onColorChange, onRename,
    onSelect, onAlign, onDistribute, onInteractionEnd
}) => {
    // Interaction States
    const [dragging, setDragging] = React.useState<{ id: string; startX: number; startY: number } | null>(null);
    const [panning, setPanning] = React.useState<{ startX: number; startY: number; initialViewX: number; initialViewY: number } | null>(null);
    const [resizing, setResizing] = React.useState<{
        id: string; startX: number; startY: number;
        startWidth: number; startHeight: number; startLeft: number; startTop: number; direction: string;
        rotationRad: number;
    } | null>(null);
    const [isSpacePressed, setIsSpacePressed] = React.useState(false);

    // UI States
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [tempName, setTempName] = React.useState<string | null>(null);
    const [guidelines, setGuidelines] = React.useState<{ x?: number; y?: number }[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);

    // --- Global Keys (Space) ---
    useEffect(() => {
        const hDown = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(true); };
        const hUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
        window.addEventListener('keydown', hDown);
        window.addEventListener('keyup', hUp);
        return () => { window.removeEventListener('keydown', hDown); window.removeEventListener('keyup', hUp); };
    }, []);


    // --- Zoom and Pan ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Stop native scroll
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, view.scale + scaleAmount), 5);

        onViewChange({ ...view, scale: newScale });
    };

    const startPan = (e: React.MouseEvent) => {
        if (e.button === 1 || isSpacePressed || (e.button === 0 && e.altKey)) {
            setPanning({ startX: e.clientX, startY: e.clientY, initialViewX: view.x, initialViewY: view.y });
        }
    };


    // --- Drag and Drop ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;
        try {
            const item = JSON.parse(data);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            onDrop(item, e.clientX - rect.left, e.clientY - rect.top);
        } catch (err) { console.error(err); }
    };


    // --- Interactions ---

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (isSpacePressed) {
            startPan(e);
            return;
        }

        if (e.button !== 0) return; // Only left click

        const isSelected = selectedIds.includes(id);

        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            const newId = onDuplicateReturn(id);
            if (newId) {
                setDragging({ id: newId, startX: e.clientX, startY: e.clientY });
                return;
            }
        }

        if (e.shiftKey) {
            onSelect(id, true);
        } else {
            if (!isSelected) {
                onSelect(id, false);
            }
        }

        setDragging({ id, startX: e.clientX, startY: e.clientY });
    };

    const handleResizeStart = (e: React.MouseEvent, id: string, width: number, height: number, left: number, top: number, rotation: number, direction: string) => {
        e.stopPropagation();
        e.preventDefault();
        setResizing({
            id, startX: e.clientX, startY: e.clientY,
            startWidth: width, startHeight: height, startLeft: left, startTop: top,
            direction,
            rotationRad: (rotation || 0) * (Math.PI / 180)
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (panning) {
            const dx = e.clientX - panning.startX;
            const dy = e.clientY - panning.startY;
            onViewChange({ ...view, x: panning.initialViewX + dx, y: panning.initialViewY + dy });
            return;
        }

        if (dragging) {
            const screenDx = e.clientX - dragging.startX;
            const screenDy = e.clientY - dragging.startY;

            // Basic step delta
            let stepX = screenDx / view.scale;
            let stepY = screenDy / view.scale;

            // --- Snapping Logic ---
            const SNAP_THRESHOLD = 8 / view.scale;
            const activeEl = elements.find(el => el.id === dragging.id);
            const otherElements = elements.filter(el => !selectedIds.includes(el.id) && el.id !== dragging.id); // Don't snap to self or other moving selection
            const newGuidelines: { x?: number, y?: number }[] = [];

            if (activeEl && otherElements.length > 0) {
                // Calculate proposed new absolute position (Top-Left)
                let newX = activeEl.x + stepX;
                let newY = activeEl.y + stepY;

                // Edges: Left, Center, Right | Top, Middle, Bottom
                const myEdges = {
                    l: newX, c: newX + activeEl.width / 2, r: newX + activeEl.width,
                    t: newY, m: newY + activeEl.height / 2, b: newY + activeEl.height
                };

                // Find X Snaps
                let snappedX = newX;
                let snapFoundX = false;

                // We check offsets from my edges to find a "correction"
                let minDeltaX = Infinity;

                for (const other of otherElements) {
                    const otherEdges = {
                        l: other.x, c: other.x + other.width / 2, r: other.x + other.width,
                        t: other.y, m: other.y + other.height / 2, b: other.y + other.height
                    };

                    // Check Left, Center, Right of Mine against L, C, R of Other
                    const checksX = [
                        { val: myEdges.l, target: otherEdges.l }, { val: myEdges.l, target: otherEdges.c }, { val: myEdges.l, target: otherEdges.r },
                        { val: myEdges.c, target: otherEdges.l }, { val: myEdges.c, target: otherEdges.c }, { val: myEdges.c, target: otherEdges.r },
                        { val: myEdges.r, target: otherEdges.l }, { val: myEdges.r, target: otherEdges.c }, { val: myEdges.r, target: otherEdges.r },
                    ];

                    for (const check of checksX) {
                        const diff = check.target - check.val;
                        if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(minDeltaX)) {
                            minDeltaX = diff;
                            snapFoundX = true;
                        }
                    }
                }

                if (snapFoundX) {
                    snappedX += minDeltaX;
                    stepX += minDeltaX; // Adjust step
                    newGuidelines.push({ x: snappedX + (myEdges.l === snappedX ? 0 : (myEdges.c === snappedX ? activeEl.width / 2 : activeEl.width)) });
                }

                // Find Y Snaps
                let snappedY = newY;
                let snapFoundY = false;
                let minDeltaY = Infinity;

                for (const other of otherElements) {
                    const otherEdges = {
                        t: other.y, m: other.y + other.height / 2, b: other.y + other.height
                    };
                    const checksY = [
                        { val: myEdges.t, target: otherEdges.t }, { val: myEdges.t, target: otherEdges.m }, { val: myEdges.t, target: otherEdges.b },
                        { val: myEdges.m, target: otherEdges.t }, { val: myEdges.m, target: otherEdges.m }, { val: myEdges.m, target: otherEdges.b },
                        { val: myEdges.b, target: otherEdges.t }, { val: myEdges.b, target: otherEdges.m }, { val: myEdges.b, target: otherEdges.b },
                    ];
                    for (const check of checksY) {
                        const diff = check.target - check.val;
                        if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(minDeltaY)) {
                            minDeltaY = diff;
                            snapFoundY = true;
                        }
                    }
                }

                if (snapFoundY) {
                    stepY += minDeltaY;
                    snappedY += minDeltaY;
                    newGuidelines.push({ y: snappedY + (myEdges.t === snappedY ? 0 : (myEdges.m === snappedY ? activeEl.height / 2 : activeEl.height)) });
                }
            }

            if (newGuidelines.length > 0) setGuidelines(newGuidelines);
            else setGuidelines([]);

            if (Math.abs(screenDx) > 0 || Math.abs(screenDy) > 0) {
                setDragging({ ...dragging, startX: e.clientX, startY: e.clientY });
                onMove(dragging.id, stepX, stepY, true);
            }

        } else if (resizing) {
            const screenDx = e.clientX - resizing.startX;
            const screenDy = e.clientY - resizing.startY;

            // Convert screen delta to unscaled delta
            const rawDx = screenDx / view.scale;
            const rawDy = screenDy / view.scale;

            // Rotate delta into local space
            // For width/height changes, we need component along local axes.
            // Local X axis: (cos, sin)
            // Local Y axis: (-sin, cos)
            const cos = Math.cos(resizing.rotationRad);
            const sin = Math.sin(resizing.rotationRad);

            const options = {
                nw: { x: -1, y: -1 }, ne: { x: 1, y: -1 },
                sw: { x: -1, y: 1 }, se: { x: 1, y: 1 },
                n: { x: 0, y: -1 }, s: { x: 0, y: 1 },
                w: { x: -1, y: 0 }, e: { x: 1, y: 0 }
            };

            const dir = options[resizing.direction as keyof typeof options];

            // Project mouse movement onto local axes
            // dxLocal represents change in Width direction (Right)
            // dyLocal represents change in Height direction (Down)
            const dxLocal = rawDx * cos + rawDy * sin;
            const dyLocal = rawDx * -sin + rawDy * cos;

            // Calculate resizing
            let newWidth = resizing.startWidth;
            let newHeight = resizing.startHeight;
            let newX = resizing.startLeft;
            let newY = resizing.startTop;

            // 1. Calculate DeltaW/H in local space
            const dW = (dxLocal * dir.x);
            const dH = (dyLocal * dir.y);

            newWidth = Math.max(20, resizing.startWidth + dW);
            newHeight = Math.max(20, resizing.startHeight + dH);

            // 2. Adjust Position to account for anchor point
            // When we resize, the center moves. We need to calculate the Shift of the center
            // in Local Space, then Rotate it to Global Space, and apply to TopLeft.

            const usedDW = newWidth - resizing.startWidth;
            const usedDH = newHeight - resizing.startHeight;

            // Center Shift Local:
            // If East (1): Center moves +dW/2. If West (-1): Center moves -dW/2.
            // Formula: Shift = (dir * usedD) / 2
            const shiftX_Local = (dir.x !== 0 ? usedDW / 2 * dir.x : 0);
            const shiftY_Local = (dir.y !== 0 ? usedDH / 2 * dir.y : 0);

            // Rotate Shift to Global
            const shiftX_Global = shiftX_Local * cos - shiftY_Local * sin;
            const shiftY_Global = shiftX_Local * sin + shiftY_Local * cos;

            // Apply Shift to Top Left (Centroid Logic compensation)
            // The visual bounding box center should move by ShiftGlobal.
            // Our 'x/y' is TopLeft. 
            // NewCenter = OldCenter + ShiftGlobal.
            // NewTopLeft = NewCenter - NewSize/2.
            // NewTopLeft = (OldTopLeft + OldSize/2) + ShiftGlobal - NewSize/2.
            // NewTopLeft = OldTopLeft + ShiftGlobal - (NewSize - OldSize)/2.

            newX = resizing.startLeft + shiftX_Global - (usedDW / 2);
            newY = resizing.startTop + shiftY_Global - (usedDH / 2);

            onResize(resizing.id, newWidth, newHeight, newX, newY);
        }
    };

    const handleMouseUp = () => {
        if (dragging || resizing) {
            onInteractionEnd();
        }
        setDragging(null);
        setResizing(null);
        setPanning(null);
        setGuidelines([]);
    };

    const getSelectionBounds = () => {
        if (selectedIds.length === 0) return null;
        const selected = elements.filter(el => selectedIds.includes(el.id));
        if (selected.length === 0) return null;
        const minX = Math.min(...selected.map(e => e.x));
        const maxX = Math.max(...selected.map(e => e.x + e.width));
        const minY = Math.min(...selected.map(e => e.y));
        return { x: minX + (maxX - minX) / 2, y: minY };
    };

    const selectionBounds = getSelectionBounds();

    // Helper to render distinct internal content
    const renderElementContent = (el: FarmElement) => {
        // SimCity Style Logic

        // ROAD STRAIGHT
        if (el.type === 'road_straight') {
            return (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center overflow-hidden border-y-4 border-neutral-600 box-border">
                    {/* Dashed Center Marker */}
                    <div className="w-full h-0 border-t-2 border-dashed border-neutral-400 opacity-60"></div>
                </div>
            );
        }

        // ROAD CURVE
        if (el.type === 'road_curve') {
            return (
                <div className="w-full h-full bg-neutral-800 relative overflow-hidden rounded-br-[100%]">
                    {/* Road Surface */}
                    <div className="absolute top-0 left-0 w-full h-full bg-neutral-700 rounded-br-[100%] border-r-4 border-b-4 border-neutral-600"></div>
                    {/* Inner Grass/Corner */}
                    <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-neutral-900 border-r-2 border-b-2 border-neutral-600 rounded-br-lg z-10"></div>
                    {/* Lane Marker (Curve) */}
                    <div className="absolute top-0 left-0 w-[70%] h-[70%] border-r-2 border-b-2 border-dashed border-neutral-400 rounded-br-[100%] opacity-60 pointer-events-none"></div>
                </div>
            );
        }

        // INTERSECTION
        if (el.type === 'road_intersection') {
            return (
                <div className="w-full h-full bg-neutral-700 relative flex items-center justify-center">
                    {/* Road markings */}
                    <div className="absolute w-full h-[60%] bg-neutral-700"></div>
                    <div className="absolute h-full w-[60%] bg-neutral-700"></div>
                    <div className="absolute w-full h-0 border-t-2 border-dashed border-neutral-400 opacity-50"></div>
                    <div className="absolute h-full w-0 border-l-2 border-dashed border-neutral-400 opacity-50"></div>
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-[20%] h-[20%] bg-neutral-800 border-r border-b border-neutral-600 rounded-br"></div>
                    <div className="absolute top-0 right-0 w-[20%] h-[20%] bg-neutral-800 border-l border-b border-neutral-600 rounded-bl"></div>
                    <div className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-neutral-800 border-r border-t border-neutral-600 rounded-tr"></div>
                    <div className="absolute bottom-0 right-0 w-[20%] h-[20%] bg-neutral-800 border-l border-t border-neutral-600 rounded-tl"></div>
                </div>
            );
        }

        // PARKING
        if (el.type === 'parking' || el.type === 'truck_parking') {
            const isTruck = el.type === 'truck_parking';
            return (
                <div className="w-full h-full bg-neutral-700 p-1 flex flex-col justify-between border border-neutral-600">
                    <div className="flex-1 flex justify-around">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-full w-[25%] border-x border-white/30 flex items-end justify-center pb-1">
                                {i % 2 === 0 && <span className="text-[8px] text-white/50">{isTruck ? 'T' : 'P'}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Standard Elements
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center
                ${!el.color && el.type === 'greenhouse' ? 'bg-green-900/50' : ''}
                ${!el.color && el.type === 'room' ? 'bg-blue-900/50' : ''}
                ${!el.color && el.type === 'fridge' ? 'bg-cyan-900/50' : ''}
                ${!el.color && el.type === 'incubation_room' ? 'bg-purple-900/50' : ''} 
                ${!el.color && el.type === 'loading_area' ? 'bg-yellow-900/20 striped-bg' : ''}
                ${!el.color && el.type === 'office' ? 'bg-slate-700' : ''}
            `}>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`flex-1 bg-neutral-900 relative overflow-hidden board-pattern transition-colors select-none ${isDragOver ? 'border-4 border-blue-500' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isSpacePressed || panning ? 'grab' : 'default' }}
            onMouseDown={(e) => {
                if (e.target === containerRef.current) {
                    startPan(e);
                    if (!panning && e.button === 0 && !e.altKey && !e.shiftKey && !isSpacePressed) {
                        onSelect(null, false);
                        setTempName(null);
                    }
                }
            }}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none origin-top-left"
                style={{
                    backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
                }}>
            </div>

            {/* Guidelines Layer */}
            {guidelines.map((g, i) => (
                <div key={i} className="absolute bg-cyan-400 z-50 pointer-events-none shadow-[0_0_2px_rgba(34,211,238,0.8)]" style={{
                    left: g.x !== undefined ? (g.x * view.scale + view.x) : 0,
                    top: g.y !== undefined ? (g.y * view.scale + view.y) : 0,
                    width: g.x !== undefined ? '1px' : '100%',
                    height: g.y !== undefined ? '1px' : '100%',
                }} />
            ))}


            {/* UI Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2 z-50">
                <div className="bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 flex flex-col overflow-hidden">
                    <button onClick={() => onViewChange({ ...view, scale: view.scale + 0.1 })} className="p-2 hover:bg-neutral-700 text-white"><ZoomIn size={18} /></button>
                    <button onClick={() => onViewChange({ ...view, scale: view.scale - 0.1 })} className="p-2 hover:bg-neutral-700 text-white"><ZoomOut size={18} /></button>
                    <button onClick={() => onViewChange({ x: 0, y: 0, scale: 1 })} className="p-2 hover:bg-neutral-700 text-white"><Maximize size={18} /></button>
                </div>
            </div>

            {/* World Container */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none origin-top-left "
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>

                {elements.map((el) => {
                    const isSelected = selectedIds.includes(el.id);
                    const isInteracting = dragging?.id === el.id || resizing?.id === el.id;
                    const isRoad = el.type.startsWith('road') || el.type.includes('parking');

                    return (
                        <div
                            key={el.id}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                            style={{
                                position: 'absolute',
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                backgroundColor: el.color,
                                cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
                                zIndex: isSelected ? 10 : 1,
                                pointerEvents: 'auto'
                            }}
                            className={`
                                flex flex-col items-center justify-center relative group shadow-lg transition-transform
                                ${isSelected ? 'shadow-2xl ring-2 ring-white/50 border border-white' : (isRoad ? '' : 'border-2 rounded')}
                                ${!isRoad && !el.color && el.type === 'greenhouse' ? 'border-green-500' : ''}
                                ${!isRoad && !el.color && el.type === 'room' ? 'border-blue-500' : ''}
                                ${!isRoad && !el.color ? 'border-neutral-500' : ''}
                            `}
                        >
                            {/* RENDER CONTENT */}
                            {renderElementContent(el)}


                            {/* Floating Icon (Only for non-road/infra elements to be cleaner) */}
                            {!isRoad && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/50 p-1 bg-neutral-900/50 rounded-full pointer-events-none" style={{ transform: `rotate(${- (el.rotation || 0)}deg)` }}>
                                    {el.type === 'greenhouse' && <Warehouse size={16} />}
                                    {el.type === 'room' && <Box size={16} />}
                                    {el.type === 'fridge' && <ThermometerSnowflake size={16} />}
                                    {el.type === 'incubation_room' && <ThermometerSnowflake size={16} className="text-purple-400" />}
                                    {el.type === 'loading_area' && <MapPin size={16} />}
                                    {el.type === 'office' && <Building2 size={16} />}
                                </div>
                            )}

                            {/* Labels & Dims */}
                            <div className="absolute w-full px-2 text-center z-10 pointer-events-none" style={{ transform: `rotate(${- (el.rotation || 0)}deg)` }}>
                                {isSelected && selectedIds.length === 1 ? (
                                    <input
                                        className="w-full bg-transparent text-center text-xs font-bold outline-none border-b border-transparent focus:border-white text-white drop-shadow-md pointer-events-auto"
                                        value={tempName !== null ? tempName : el.name}
                                        onChange={(e) => setTempName(e.target.value)}
                                        onBlur={() => { if (tempName) onRename(el.id, tempName); setTempName(null); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { if (tempName) onRename(el.id, tempName); setTempName(null); e.currentTarget.blur(); } }}
                                        onFocus={() => setTempName(el.name)}
                                        onMouseDown={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className={`text-xs font-bold truncate block drop-shadow-md ${isRoad ? 'hidden group-hover:block text-white/70' : 'text-white'}`}>{el.name}</span>
                                )}

                                {/* Dims - Editable */}
                                {(isInteracting || isSelected) && (
                                    <div
                                        className="text-[10px] text-neutral-300 font-mono mt-0.5 drop-shadow-md cursor-pointer hover:text-white hover:underline pointer-events-auto"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const w = prompt("Larghezza:", Math.round(el.width).toString());
                                            if (w) {
                                                const h = prompt("Altezza:", Math.round(el.height).toString());
                                                if (h && !isNaN(Number(w)) && !isNaN(Number(h))) {
                                                    onResize(el.id, Number(w), Number(h));
                                                    onInteractionEnd();
                                                }
                                            }
                                        }}
                                    >
                                        {Math.round(el.width)} x {Math.round(el.height)}
                                    </div>
                                )}
                            </div>

                            {isSelected && selectedIds.length === 1 && !dragging && (
                                <>
                                    <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize -ml-1.5 -mt-1.5 bg-white border border-neutral-400 rounded-sm z-20" onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, el.rotation || 0, 'nw')} />
                                    <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize -mr-1.5 -mt-1.5 bg-white border border-neutral-400 rounded-sm z-20" onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, el.rotation || 0, 'ne')} />
                                    <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize -ml-1.5 -mb-1.5 bg-white border border-neutral-400 rounded-sm z-20" onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, el.rotation || 0, 'sw')} />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize -mr-1.5 -mb-1.5 bg-white border border-neutral-400 rounded-sm z-20" onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height, el.x, el.y, el.rotation || 0, 'se')} />
                                </>
                            )}
                        </div>
                    );
                })}

                {selectionBounds && !dragging && (
                    <div
                        className="absolute flex flex-col gap-1 bg-neutral-800 p-1.5 rounded-lg border border-neutral-700 shadow-xl z-50 pointer-events-auto"
                        style={{ left: selectionBounds.x, top: selectionBounds.y - 70, transform: 'translateX(-50%)' }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className="flex gap-1">
                            {selectedIds.length === 1 && (
                                <>
                                    <button onClick={() => onRotate(selectedIds[0])} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Rotate">
                                        <RotateCw size={14} />
                                    </button>
                                    <button onClick={() => onDuplicate(selectedIds[0])} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Duplicate">
                                        <Copy size={14} />
                                    </button>
                                </>
                            )}

                            {selectedIds.length > 1 && (
                                <>
                                    <button onClick={() => onAlign('left')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Left"><AlignLeft size={14} /></button>
                                    <button onClick={() => onAlign('center')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Center"><AlignCenter size={14} /></button>
                                    <button onClick={() => onAlign('right')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Right"><AlignRight size={14} /></button>
                                    <div className="w-px bg-neutral-700 mx-1"></div>
                                    <button onClick={() => onAlign('top')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Top"><ArrowUpToLine size={14} /></button>
                                    <button onClick={() => onAlign('middle')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Middle"><AlignVerticalJustifyCenter size={14} /></button>
                                    <button onClick={() => onAlign('bottom')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Align Bottom"><ArrowDownToLine size={14} /></button>
                                    <div className="w-px bg-neutral-700 mx-1"></div>
                                    <button onClick={() => onDistribute('horizontal')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Distribute Horizontal"><AlignHorizontalDistributeCenter size={14} /></button>
                                    <button onClick={() => onDistribute('vertical')} className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white" title="Distribute Vertical"><AlignVerticalDistributeCenter size={14} /></button>
                                </>
                            )}

                            <div className="w-px bg-neutral-700 mx-1"></div>

                            <button onClick={() => {
                                if (window.confirm(`Eliminare ${selectedIds.length} elementi?`)) {
                                    onRemove(selectedIds);
                                }
                            }} className="p-1.5 hover:bg-neutral-700 rounded text-red-500 hover:text-red-600" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="flex gap-1 justify-center pt-1 border-t border-neutral-700">
                            {['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => onColorChange(selectedIds[0], c)}
                                    className="w-3 h-3 rounded-full hover:scale-125 transition-transform"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;

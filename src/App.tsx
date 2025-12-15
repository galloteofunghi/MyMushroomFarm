import { useState } from 'react';
import ElementList from './components/ElementList';
import Canvas from './components/Canvas';
import type { FarmElement } from './types';
import { Layout } from 'lucide-react';

function App() {
  const [elements, setElements] = useState<FarmElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDrop = (item: any, x: number, y: number) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
    const newElement: FarmElement = {
      id,
      name: `${item.label} ${elements.filter(e => e.type === item.type).length + 1}`,
      type: item.type,
      width: item.width,
      height: item.height,
      x,
      y,
    };
    setElements([...elements, newElement]);
    setSelectedId(id); // Select the new element
  };

  const handleRemove = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMove = (id: string, x: number, y: number) => {
    setElements(elements.map(el => el.id === id ? { ...el, x, y } : el));
  };

  const handleResize = (id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prevElements => prevElements.map(el =>
      el.id === id
        ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) }
        : el
    ));
  };

  const handleRotate = (id: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, rotation: (el.rotation || 0) + 90 } : el));
  };

  const handleDuplicate = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `el-${Date.now()}-${Math.random()}`;
    const newElement: FarmElement = {
      ...el,
      id: newId,
      name: `${el.name} (Copy)`,
      x: el.x + 20,
      y: el.y + 20
    };
    setElements([...elements, newElement]);
    setSelectedId(newId); // Select the duplicate
  };

  const handleColorChange = (id: string, color: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, color } : el));
  };

  const handleRename = (id: string, name: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, name } : el));
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
      <div className="flex flex-col flex-1">
        <header className="h-14 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-3 shadow-sm z-10">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Layout size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">MyMushroomFarm <span className="text-neutral-500 font-normal">Designer</span></h1>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <ElementList />
          <Canvas
            elements={elements}
            onDrop={handleDrop}
            onRemove={handleRemove}
            onMove={handleMove}
            onResize={handleResize}
            onRotate={handleRotate}
            onDuplicate={handleDuplicate}
            onColorChange={handleColorChange}
            onRename={handleRename}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import Canvas from './components/Canvas';
import ElementList from './components/ElementList';
import ProjectWizard from './components/ProjectWizard';
import MainLayout from './components/MainLayout';
import SettingsView from './components/SettingsView';
import { useCanvasState } from './hooks/useCanvasState';
import { useProject } from './hooks/useProject';

function App() {
  const [currentView, setCurrentView] = useState('farm-designer');

  // 1. Canvas State & Logic
  const canvasState = useCanvasState([]);

  // 2. Project State & Logic
  // We pass setters to sync loaded project into canvas state
  const {
    project,
    setProject,
    isLoading,
    handleProjectCreated
  } = useProject(
    canvasState.elements,
    canvasState.setElements,
    canvasState.setHistory,
    canvasState.setHistoryIndex
  );

  if (isLoading) {
    return <div className="w-full h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="w-full h-screen bg-neutral-950 text-white font-sans board-pattern">
        <ProjectWizard onComplete={handleProjectCreated} />
      </div>
    );
  }

  return (
    <MainLayout project={project} currentView={currentView} onViewChange={setCurrentView}>
      {/* Render View Content */}
      {currentView === 'farm-designer' && (
        <div className="flex flex-col h-full w-full">
          <ElementList
            onUndo={canvasState.undo}
            onRedo={canvasState.redo}
            canUndo={canvasState.canUndo}
            canRedo={canvasState.canRedo}
            isEditing={canvasState.isEditing}
            onToggleEditing={() => canvasState.setIsEditing(!canvasState.isEditing)}
            stats={{ scale: canvasState.view.scale, count: canvasState.elements.length }}
          />
          <div className="flex-1 relative flex flex-col h-full overflow-hidden">
            {/* Stats Overlay Removed - Moved to ElementList */}

            <Canvas
              elements={canvasState.elements}
              view={canvasState.view}
              onViewChange={canvasState.setView}
              selectedIds={canvasState.selectedIds}
              onDrop={canvasState.handleDrop}
              onRemove={canvasState.handleRemove}
              onMove={canvasState.handleMove}
              onResize={canvasState.handleResize}
              onRotate={canvasState.handleRotate}
              onDuplicate={canvasState.handleDuplicate}
              onDuplicateReturn={canvasState.handleDuplicateReturn}
              onColorChange={(id, c) => canvasState.setElements(prev => prev.map(e => e.id === id ? { ...e, color: c } : e))}
              onRename={(id, n) => canvasState.setElements(prev => prev.map(e => e.id === id ? { ...e, name: n } : e))}
              onSelect={(id, multi) => {
                if (id === null) canvasState.setSelectedIds([]);
                else canvasState.setSelectedIds(multi ? (canvasState.selectedIds.includes(id) ? canvasState.selectedIds.filter(i => i !== id) : [...canvasState.selectedIds, id]) : [id]);
              }}
              onAlign={canvasState.handleAlign}
              onDistribute={canvasState.handleDistribute}
              onInteractionEnd={canvasState.handleInteractionEnd}
              isEditing={canvasState.isEditing}
            />
          </div>
        </div>
      )}

      {currentView === 'settings' && (
        <SettingsView project={project} onUpdateProject={setProject} />
      )}

      {currentView !== 'farm-designer' && currentView !== 'settings' && (
        <div className="flex items-center justify-center h-full text-neutral-500 flex-col gap-4">
          <div className="text-4xl text-neutral-700 animate-pulse font-bold uppercase tracking-widest">
            {currentView.replace('-', ' ')}
          </div>
          <p className="text-sm">Work in progress...</p>
        </div>
      )}
    </MainLayout>
  );
}

export default App;

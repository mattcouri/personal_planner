import React from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';

interface DragDropProviderProps {
  children: React.ReactNode;
  onDragEnd?: (event: any) => void;
  onDragStart?: (event: any) => void;
}

export default function DragDropProvider({ children, onDragEnd, onDragStart }: DragDropProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    onDragEnd?.(event);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeId ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-lg border opacity-90">
            Dragging item...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

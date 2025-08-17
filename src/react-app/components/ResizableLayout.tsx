import React, { useState, useRef, useCallback } from 'react';

interface ResizableLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // Percentage for left panel (0-100)
}

export default function ResizableLayout({ left, right, initialSplit = 50 }: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftWidth(constrainedWidth);
  }, [isDragging]);

  // Attach global mouse events when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      <div style={{ width: `${leftWidth}%` }} className="flex-shrink-0">
        {left}
      </div>
      
      <div
        className="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 relative"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      
      <div style={{ width: `${100 - leftWidth}%` }} className="flex-shrink-0">
        {right}
      </div>
    </div>
  );
}

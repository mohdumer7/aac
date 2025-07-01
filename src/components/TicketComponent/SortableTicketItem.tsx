// @ts-nocheck
// src/components/TicketComponent/SortableTicketItem.tsx
"use client";

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TicketComponent from './TicketComponent';

interface SortableTicketItemProps {
  id: string;
  ticket: any;
  onTicketClick: (id: string) => void;
}

export function SortableTicketItem({ id, ticket, onTicketClick }: SortableTicketItemProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: id,
    data: {
      ticket: ticket
    }
  });

  // Style to handle dragging smoothly
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none',
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? 'hidden' : 'visible',
    position: isDragging ? 'fixed' : 'relative',
    zIndex: isDragging ? -1 : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
    willChange: isDragging ? 'transform' : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onTicketClick(id);
    }
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ticket-id={id}
      data-draggable={true}
      className="relative animate-fade-in"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative">
        {/* The ticket component - using compactView for board */}
        <TicketComponent 
          ticket={ticket}
          onClick={handleClick}
          compactView={true}
          className={isHovering ? 'ring-1 ring-primary/20' : ''}
        />
        
        {/* Draggable overlay - only visible on hover */}
        <div 
          className={`absolute inset-0 cursor-grab active:cursor-grabbing rounded-lg transition-opacity duration-200 
                    ${isHovering ? 'bg-primary/5 opacity-30' : 'opacity-0'}`}
          {...attributes}
          {...listeners}
        >
          {/* Subtle drag indicator that only appears on hover */}
          {isHovering && (
            <div className="absolute top-1 right-1 bg-primary/10 rounded-full p-1">
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary/60"
              >
                <path 
                  d="M8 6H9.5M9.5 6H11M9.5 6V4.5M9.5 6V7.5M8 12H9.5M9.5 12H11M9.5 12V10.5M9.5 12V13.5M8 18H9.5M9.5 18H11M9.5 18V16.5M9.5 18V19.5M15 6H16.5M16.5 6H18M16.5 6V4.5M16.5 6V7.5M15 12H16.5M16.5 12H18M16.5 12V10.5M16.5 12V13.5M15 18H16.5M16.5 18H18M16.5 18V16.5M16.5 18V19.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
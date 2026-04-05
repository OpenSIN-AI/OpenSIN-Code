/**
 * VirtualMessageList — Virtual scrolling for long conversations
 */
import React, { useRef, useCallback } from 'react';

interface VirtualMessageListProps {
  messages: Array<{ id: string; content: string; role: string }>;
  itemHeight: number;
  overscan?: number;
}

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({ messages, itemHeight, overscan = 5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerHeight = 600;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(messages.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
  const visibleMessages = messages.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div ref={containerRef} onScroll={onScroll} style={{ height: containerHeight, overflow: 'auto' }}>
      <div style={{ height: messages.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleMessages.map((msg) => (
            <div key={msg.id} style={{ height: itemHeight }} className={`message message-${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CircularSliderProps {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

const CircularSlider: React.FC<CircularSliderProps> = ({
  min = 0,
  max = 100,
  value = 0,
  onChange,
  size = 200,
  strokeWidth = 20,
  primaryColor = '#0070f3',
  secondaryColor = '#e5e5e5',
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate the progress (0 to 1)
  const progress = (currentValue - min) / (max - min);
  const dashOffset = circumference * (1 - progress);

  // Convert value to angle (0 to 360 degrees)
  const angle = progress * 360;

  // Handle mouse/touch events
  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    updateValueFromPoint(clientX, clientY);
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    updateValueFromPoint(clientX, clientY);
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
  };

  const updateValueFromPoint = (clientX: number, clientY: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + center;
    const centerY = rect.top + center;

    // Calculate angle from center to pointer
    let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    
    // Convert angle to 0-360 range
    angle = (angle + 360) % 360;
    
    // Rotate by 90 degrees so 0 is at the top
    angle = (angle + 90) % 360;
    
    // Convert angle to value
    const newValue = Math.round((angle / 360) * (max - min) + min);
    
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX, e.clientY);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, touch.clientY);
  };

  // Add global event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleInteractionMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleInteractionMove(touch.clientX, touch.clientY);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchend', handleInteractionEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging]);

  // Calculate knob position
  const knobX = center + radius * Math.cos((angle - 90) * (Math.PI / 180));
  const knobY = center + radius * Math.sin((angle - 90) * (Math.PI / 180));

  return (
    <div 
      ref={sliderRef}
      className="relative touch-none select-none"
      style={{ width: size, height: size }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Background circle */}
      <svg width={size} height={size} className="absolute">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Progress circle */}
      <svg width={size} height={size} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Knob */}
      <div
        className="absolute bg-white border-4 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-grab"
        style={{
          borderColor: primaryColor,
          left: knobX,
          top: knobY,
          width: strokeWidth * 1.5,
          height: strokeWidth * 1.5,
        }}
      />

      {/* Value display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold">{currentValue}</span>
      </div>
    </div>
  );
};

export default CircularSlider;
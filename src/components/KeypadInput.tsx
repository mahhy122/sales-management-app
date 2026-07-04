'use client';

import React, { useState } from 'react';
import NumericKeypadModal from './NumericKeypadModal';

interface KeypadInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  title: string;
  suffix?: string;
  className?: string;
}

export default function KeypadInput({
  value,
  onChange,
  title,
  suffix = '円',
  className,
  ...props
}: KeypadInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle keypad confirmation
  const handleConfirm = (confirmedVal: string) => {
    onChange(confirmedVal);
    setIsOpen(false);
  };

  return (
    <>
      <input
        {...props}
        className={className}
        value={value}
        onClick={() => {
          if (!props.disabled) {
            setIsOpen(true);
          }
        }}
        readOnly // Critical: Blocks native virtual keyboard on mobile devices
        style={{ 
          cursor: props.disabled ? 'not-allowed' : 'pointer', 
          caretColor: 'transparent', // Hide blinking text caret
          ...props.style 
        }}
      />
      
      {isOpen && (
        <NumericKeypadModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={title}
          initialValue={value}
          suffix={suffix}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

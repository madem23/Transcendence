import React, { useRef, useEffect } from 'react';

interface DropdownMenuProps {
  className?: string;
  show: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  isTranslate?: Boolean;
  dropDownMenuX?: number;
  dropDownMenuY?: number;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ show, onClose, children, className, style, isTranslate }) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`fixed ${isTranslate ? '-translate-x-20' : '-translate-x-full'} bg-opacity-90 bg-gray-900 text-white rounded dropdown-z-index ${className}`}
      style={{...style}}

    >
      {children}
    </div>
  );

};

export default DropdownMenu;

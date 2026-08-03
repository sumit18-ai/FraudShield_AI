import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const MagneticButton = ({ children, className = '', onClick, variant = 'primary', ...props }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const getVariantStyles = () => {
    if (variant === 'danger') {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.2)]';
    }
    if (variant === 'secondary') {
      return 'bg-white/80 dark:bg-[#141D30] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#1A2740]';
    }
    // Default Reference Royal Violet Gradient
    return 'pearl-btn-gradient border border-violet-400/30';
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 250, damping: 15, mass: 0.2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 backdrop-blur-md cursor-pointer select-none overflow-hidden group ${getVariantStyles()} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 font-mono text-xs uppercase tracking-widest">{children}</span>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transform duration-1000" />
    </motion.button>
  );
};

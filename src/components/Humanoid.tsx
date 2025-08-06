import React from 'react';

interface HumanoidProps {
  style?: React.CSSProperties;
  className?: string;
  delay?: number;
  size?: number;
}

export default function Humanoid({ style, className = '', delay = 0, size = 100 }: HumanoidProps) {
  return (
    <svg
      width={size}
      height={size * 2}
      viewBox="0 0 100 200"
      style={{
        ...style,
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        filter: 'drop-shadow(0 0 16px #00fff7) drop-shadow(0 0 32px #00fff7)',
        opacity: 0.7,
        zIndex: 0,
        position: 'absolute',
      }}
      className={className}
    >
      <circle cx="50" cy="30" r="20" fill="#fff" />
      <rect x="40" y="50" width="20" height="60" fill="#fff" />
      <line x1="40" y1="110" x2="20" y2="150" stroke="#fff" strokeWidth="5" />
      <line x1="60" y1="110" x2="80" y2="150" stroke="#fff" strokeWidth="5" />
      <line x1="40" y1="50" x2="20" y2="80" stroke="#fff" strokeWidth="5" />
      <line x1="60" y1="50" x2="80" y2="80" stroke="#fff" strokeWidth="5" />
    </svg>
  );
} 
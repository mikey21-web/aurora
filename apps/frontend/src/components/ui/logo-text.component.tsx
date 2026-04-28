import React from 'react';

export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-[10px]">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#612BD3" />
        <path d="M16 6L25 24H7L16 6Z" fill="white" opacity="0.9" />
        <circle cx="16" cy="19" r="3" fill="#612BD3" />
      </svg>
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 700,
          fontSize: '22px',
          letterSpacing: '-0.5px',
          color: 'white',
        }}
      >
        Aurora
      </span>
    </div>
  );
};

import React from 'react';
import manifest from '../assets/figma.json';
export const art = (screen, name) => manifest[screen][name];
// Crop transforms mirror the Figma image fills; source files remain unmodified.
export function Art({ screen, name, width, height, className = '', crop, alt = '', ...props }) {
  return <span className={`relative block shrink-0 overflow-hidden ${className}`} style={{ width, height }} {...props}>
    <img src={art(screen, name)} alt={alt} draggable="false" className={`pointer-events-none absolute max-w-none ${crop ? '' : 'inset-0 size-full object-cover'}`} style={crop} />
  </span>;
}
export function ArtButton({ screen, name, width, height, children, className = '', crop, label, ...props }) {
  return <button type="button" aria-label={label} className={`relative block shrink-0 disabled:opacity-50 ${className}`} style={{ width, height }} {...props}>
    <Art screen={screen} name={name} width={width} height={height} crop={crop} />
    {children && <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-retro text-[15px] text-black">{children}</span>}
  </button>;
}

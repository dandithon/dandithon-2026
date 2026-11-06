import React, { useEffect, useRef } from 'react';
export default function Dialog({ children, onClose, label, className = '', shade = true,panelBounds }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, element = ref.current;
    element.focus();
    const handle = e => {
      if(e.key === 'Escape'){e.preventDefault();onClose();}
      if(e.key === 'Tab'){
        const items=[...element.querySelectorAll('button:not(:disabled):not([tabindex="-1"]), input, textarea, select, [tabindex="0"]')];
        if(!items.length){e.preventDefault();return;}
        const first=items[0],last=items.at(-1);
        if(e.shiftKey && (document.activeElement===first || document.activeElement===element)){e.preventDefault();last.focus();}
        else if(!e.shiftKey && (document.activeElement===last || document.activeElement===element)){e.preventDefault();first.focus();}
      }
    };
    element.addEventListener('keydown',handle);
    return ()=>{element.removeEventListener('keydown',handle);if(previous?.isConnected)previous.focus();};
  },[onClose]);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={`absolute inset-0 z-30 outline-none ${className}`}>
    <button type="button" tabIndex={-1} aria-label="닫기" onClick={onClose} className={`dialog-backdrop absolute inset-0 ${shade?'bg-[rgba(30,37,43,0.5)]':''}`} />
    <div className="dialog-surface pointer-events-none absolute inset-0">{panelBounds&&<div data-dialog-panel aria-hidden="true" className="absolute" style={panelBounds}/>}{children}</div>
  </div>;
}

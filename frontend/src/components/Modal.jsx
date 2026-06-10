import React from 'react';

export default function Modal({ isOpen, title, children, onClose, actions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
        </div>
        <div className="mb-4">{children}</div>
        {actions && (
          <div className="flex justify-end gap-3">{actions.map((act, idx) => (
            <button
              key={idx}
              onClick={act.onClick}
              className={`px-4 py-2 rounded ${act.variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              {act.label}
            </button>
          ))}</div>
        )}
      </div>
    </div>
  );
}

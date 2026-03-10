import React from 'react';

function LoadingSpinner() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-ink/10 dark:border-white/10 border-t-neon rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-transparent border-b-neon/30 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;

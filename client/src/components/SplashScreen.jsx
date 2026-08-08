import { useState, useEffect } from "react";

export default function SplashScreen({ onComplete }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Show for 2 seconds, then fade out
    const timer = setTimeout(() => {
      setFade(true);
    }, 2000);
    
    // Unmount after fade transition (300ms)
    const cleanup = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2300);

    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f7f8f9] transition-opacity duration-300 ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img 
        src="/logo.png" 
        alt="Hunar Naqsha Logo" 
        className="w-[280px] h-auto object-contain animate-pulse" 
      />
    </div>
  );
}

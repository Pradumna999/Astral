import { useFrame } from '@react-three/fiber';

export function PerformanceMonitor() {
  useFrame((state) => {
    const currentFps = Math.round(1 / state.clock.getDelta());
    const fpsDisplay = document.getElementById('fps-display');
    
    if (fpsDisplay) {
      fpsDisplay.textContent = `${currentFps} FPS`;
      if (currentFps < 30) {
        fpsDisplay.className = 'text-sm font-mono text-red-400';
      } else if (currentFps < 50) {
        fpsDisplay.className = 'text-sm font-mono text-yellow-400';
      } else {
        fpsDisplay.className = 'text-sm font-mono text-green-400';
      }
    }
  });
  
  return null;
}

export function PerformanceDisplay() {
  return (
    <div className="fixed top-4 right-[420px] bg-black/80 backdrop-blur-sm border border-white/20 rounded px-3 py-2">
      <div id="fps-display" className="text-sm font-mono text-green-400">
        60 FPS
      </div>
    </div>
  );
}

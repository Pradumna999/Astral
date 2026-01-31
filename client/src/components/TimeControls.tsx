import { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function TimeControls() {
  const { currentTime, timeSpeed, isPaused, setCurrentTime, setTimeSpeed, togglePause, setPaused } = useSatelliteStore();
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentTime(new Date(currentTime.getTime() + 100 * timeSpeed));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPaused, currentTime, timeSpeed, setCurrentTime]);
  
  const handleReset = () => {
    setCurrentTime(new Date());
    setTimeSpeed(1);
    setPaused(false);
  };
  
  const speedPresets = [1, 10, 50, 100, 500];
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[400px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-white text-sm font-mono">
            {currentTime.toUTCString()}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="default"
            onClick={togglePause}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          
          <div className="flex-1">
            <div className="text-white text-xs mb-1">
              Speed: {timeSpeed}x
            </div>
            <div className="flex gap-2">
              {speedPresets.map(speed => (
                <button
                  key={speed}
                  onClick={() => setTimeSpeed(speed)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeSpeed === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

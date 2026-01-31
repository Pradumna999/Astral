import { Home, Eye, Camera, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function NavigationControls() {
  const { visitedObject, setVisitedObject, satellites, setSelectedSatellite } = useSatelliteStore();
  
  const handleReturnToOverview = () => {
    setVisitedObject(null);
    setSelectedSatellite(null);
  };
  
  const handleVisitEarth = () => {
    setVisitedObject('earth');
    setSelectedSatellite(null);
  };
  
  const getVisitedName = () => {
    if (visitedObject === 'earth') return 'Earth';
    const sat = satellites.find(s => s.noradId === visitedObject);
    return sat ? sat.name : 'Satellite';
  };
  
  const getCameraMode = () => {
    if (!visitedObject) return 'Overview Mode';
    if (visitedObject === 'earth') return 'Earth Observation';
    return 'Satellite Close-Up';
  };
  
  const getCameraModeIcon = () => {
    if (!visitedObject) return <Globe className="w-4 h-4" />;
    if (visitedObject === 'earth') return <Eye className="w-4 h-4" />;
    return <Camera className="w-4 h-4" />;
  };
  
  return (
    <div className="fixed top-4 left-4 flex flex-col gap-2 z-50">
      {/* Camera Mode Indicator */}
      <div className="bg-black/90 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          {getCameraModeIcon()}
          <div>
            <div className="text-white text-xs font-semibold uppercase tracking-wide opacity-60">
              Camera Mode
            </div>
            <div className="text-white text-sm font-mono">
              {getCameraMode()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Breadcrumb Navigation */}
      {visitedObject && (
        <div className="bg-black/90 backdrop-blur-sm border border-blue-500/50 rounded-lg px-4 py-2 shadow-lg">
          <div className="text-white text-sm font-mono flex items-center gap-2">
            <span className="text-white/60">Overview</span>
            <span className="text-blue-400">→</span>
            <span className="text-blue-400 font-semibold">{getVisitedName()}</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Return to Overview Button */}
        {visitedObject && (
          <Button
            onClick={handleReturnToOverview}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg border border-blue-500/50 transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            Return to Overview
          </Button>
        )}
        
        {/* Visit Earth Button (only show in overview or satellite view) */}
        {visitedObject !== 'earth' && (
          <Button
            onClick={handleVisitEarth}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-lg border border-green-500/50 transition-all hover:scale-105"
          >
            <Globe className="w-4 h-4" />
            {visitedObject ? 'View Earth' : 'Visit Earth'}
          </Button>
        )}
      </div>
      
      {/* Tips */}
      {!visitedObject && (
        <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 max-w-xs">
          <div className="text-white/60 text-xs">
            💡 <span className="font-semibold">Tip:</span> Click on satellites or Earth to visit them up close!
          </div>
        </div>
      )}
    </div>
  );
}

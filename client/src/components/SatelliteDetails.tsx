import { X, Eye, EyeOff, Navigation, Orbit, Gauge, MapPin, Satellite, Target, Link } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function SatelliteDetails() {
  const {
    selectedSatellite,
    satellites,
    satellitePositions,
    setSelectedSatellite,
    showTrails,
    toggleTrails,
    visitedObject,
    setVisitedObject,
    closestSatelliteMode,
    closestSatelliteId,
    closestSatelliteDistance,
    enableClosestSatelliteMode,
    disableClosestSatelliteMode
  } = useSatelliteStore();
  
  if (!selectedSatellite) return null;
  
  const satellite = satellites.find(s => s.noradId === selectedSatellite);
  const position = satellitePositions.get(selectedSatellite);
  
  if (!satellite) return null;
  
  const isVisiting = visitedObject === selectedSatellite;
  
  // Get closest satellite info if available
  const closestSatellite = closestSatelliteId 
    ? satellites.find(s => s.noradId === closestSatelliteId)
    : null;
  
  const handleVisit = () => {
    if (isVisiting) {
      setVisitedObject(null);
    } else {
      setVisitedObject(selectedSatellite);
    }
  };
  
  const handleClosestSatellite = () => {
    if (closestSatelliteMode) {
      disableClosestSatelliteMode();
    } else {
      enableClosestSatelliteMode();
      // Disable visit mode when enabling closest satellite mode
      if (visitedObject) {
        setVisitedObject(null);
      }
    }
  };
  
  // Calculate additional orbital info
  const getOrbitalType = (alt: number) => {
    if (alt < 2000) return 'LEO (Low Earth Orbit)';
    if (alt < 35786) return 'MEO (Medium Earth Orbit)';
    if (alt > 35000 && alt < 36000) return 'GEO (Geostationary)';
    return 'HEO (High Earth Orbit)';
  };
  
  const formatCoordinate = (value: number, type: 'lat' | 'lon') => {
    const abs = Math.abs(value);
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${abs.toFixed(4)}° ${direction}`;
  };
  
  const formatDistance = (km: number) => {
    if (km < 1) return `${(km * 1000).toFixed(0)} m`;
    if (km < 100) return `${km.toFixed(2)} km`;
    return `${km.toFixed(0)} km`;
  };
  
  return (
    <div className="fixed right-4 top-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto bg-black/90 backdrop-blur-sm border border-white/30 rounded-lg shadow-2xl">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-white/20 pb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-blue-400" />
            <h2 className="text-white text-lg font-bold">Satellite Details</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedSatellite(null)}
            className="text-white hover:bg-white/10 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Satellite Name & Info */}
          <div>
            <h3 className="text-white font-semibold text-xl mb-2">
              {satellite.name}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white/60">
                NORAD ID: <span className="text-white font-mono">{satellite.noradId}</span>
              </div>
              {satellite.category && (
                <div className="text-white/60">
                  Category: <span className="text-white">{satellite.category}</span>
                </div>
              )}
              {satellite.operator && (
                <div className="text-white/60 col-span-2">
                  Operator: <span className="text-white">{satellite.operator}</span>
                </div>
              )}
              {satellite.launchDate && (
                <div className="text-white/60 col-span-2">
                  Launch: <span className="text-white">{satellite.launchDate}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Closest Satellite Info (if in mode) */}
          {closestSatelliteMode && closestSatellite && closestSatelliteDistance && (
            <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/50 animate-pulse-slow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link className="w-4 h-4 text-red-400" />
                  <h4 className="text-white font-semibold">Closest Satellite Detected!</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-white/60 text-xs mb-1">Satellite</div>
                    <div className="text-white font-medium">{closestSatellite.name}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Distance</div>
                    <div className="text-red-400 font-mono text-lg font-bold">
                      {formatDistance(closestSatelliteDistance)}
                    </div>
                  </div>
                  <div className="text-white/70 text-xs mt-2 p-2 bg-black/30 rounded">
                    💡 Red line shows the connection between satellites
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Current Position */}
          {position && (
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-semibold">Current Position</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-white/60 text-xs mb-1">Latitude</div>
                    <div className="text-white font-mono">
                      {formatCoordinate(position.lat, 'lat')}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Longitude</div>
                    <div className="text-white font-mono">
                      {formatCoordinate(position.lon, 'lon')}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Altitude</div>
                    <div className="text-white font-mono flex items-baseline gap-1">
                      <span className="text-lg font-bold">{position.alt.toFixed(0)}</span>
                      <span className="text-xs">km</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Velocity</div>
                    <div className="text-white font-mono flex items-baseline gap-1">
                      <span className="text-lg font-bold">{position.velocity.toFixed(2)}</span>
                      <span className="text-xs">km/s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Orbital Information */}
          {position && (
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Orbit className="w-4 h-4 text-green-400" />
                  <h4 className="text-white font-semibold">Orbital Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Orbit Type:</span>
                    <span className="text-white font-medium">{getOrbitalType(position.alt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Speed (km/h):</span>
                    <span className="text-white font-mono">{(position.velocity * 3600).toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* TLE Data */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-purple-400" />
              <h4 className="text-white font-semibold text-sm">Orbital Elements (TLE)</h4>
            </div>
            <div className="bg-black/40 rounded p-3 border border-white/10">
              <pre className="text-white/80 text-xs font-mono overflow-x-auto">
                {satellite.line1}
                {'\n'}
                {satellite.line2}
              </pre>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-white/20">
            {/* Find Closest Satellite Button (NEW!) */}
            <Button
              onClick={handleClosestSatellite}
              className={`w-full ${
                closestSatelliteMode
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-500/50'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-orange-500/50'
              } shadow-lg border`}
            >
              <Target className="w-4 h-4 mr-2" />
              {closestSatelliteMode ? '✓ Showing Closest' : 'Find Closest Satellite'}
            </Button>
            
            {/* Visit Button */}
            <Button
              onClick={handleVisit}
              disabled={closestSatelliteMode}
              className={`w-full ${
                isVisiting 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              } shadow-lg border ${isVisiting ? 'border-green-500/50' : 'border-purple-500/50'} ${closestSatelliteMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isVisiting ? '✓ Currently Visiting' : 'Visit This Satellite'}
            </Button>
            
            {/* Show/Hide Trail Button */}
            <Button
              onClick={toggleTrails}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg border border-blue-500/50"
            >
              {showTrails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showTrails ? 'Hide' : 'Show'} Orbital Trail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

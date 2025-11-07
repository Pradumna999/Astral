import { X, Eye, EyeOff } from 'lucide-react';
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
    toggleTrails
  } = useSatelliteStore();
  
  if (!selectedSatellite) return null;
  
  const satellite = satellites.find(s => s.noradId === selectedSatellite);
  const position = satellitePositions.get(selectedSatellite);
  
  if (!satellite) return null;
  
  return (
    <div className="fixed right-4 top-4 w-96 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg">
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Satellite Details</h2>
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
          <div>
            <h3 className="text-white font-semibold text-xl mb-2">
              {satellite.name}
            </h3>
            <div className="text-white/60 text-sm space-y-1">
              <div>NORAD ID: <span className="text-white">{satellite.noradId}</span></div>
              {satellite.category && (
                <div>Category: <span className="text-white">{satellite.category}</span></div>
              )}
              {satellite.operator && (
                <div>Operator: <span className="text-white">{satellite.operator}</span></div>
              )}
              {satellite.launchDate && (
                <div>Launch: <span className="text-white">{satellite.launchDate}</span></div>
              )}
            </div>
          </div>
          
          {position && (
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-2">Current Position</h4>
                <div className="text-white/60 text-sm space-y-1">
                  <div>
                    Latitude: <span className="text-white font-mono">{position.lat.toFixed(4)}°</span>
                  </div>
                  <div>
                    Longitude: <span className="text-white font-mono">{position.lon.toFixed(4)}°</span>
                  </div>
                  <div>
                    Altitude: <span className="text-white font-mono">{position.alt.toFixed(2)} km</span>
                  </div>
                  <div>
                    Velocity: <span className="text-white font-mono">{position.velocity.toFixed(2)} km/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div>
            <h4 className="text-white font-semibold mb-2">Orbital Elements</h4>
            <div className="bg-white/5 rounded p-3">
              <pre className="text-white/80 text-xs font-mono overflow-x-auto">
                {satellite.line1}
                {'\n'}
                {satellite.line2}
              </pre>
            </div>
          </div>
          
          <Button
            onClick={toggleTrails}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {showTrails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showTrails ? 'Hide' : 'Show'} Orbital Trail
          </Button>
        </div>
      </div>
    </div>
  );
}

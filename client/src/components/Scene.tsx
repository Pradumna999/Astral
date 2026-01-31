import { useEffect } from 'react';
import { Stars } from '@react-three/drei';
import { Earth } from './Earth';
import { Satellites } from './Satellites';
import { SatelliteTrails } from './SatelliteTrails';
import { MotionTrails } from './MotionTrails';
import { ClosestSatelliteLine } from './ClosestSatelliteLine';
import { CameraController } from './CameraController';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function Scene() {
  const { setSatellites, findClosestSatellite, closestSatelliteMode } = useSatelliteStore();
  
  useEffect(() => {
    async function fetchSatellites() {
      try {
        const response = await fetch('/api/satellites');
        const data = await response.json();
        setSatellites(data.satellites.slice(0,2000));
        console.log(`Loaded ${data.satellites.length} satellites`);
      } catch (error) {
        console.error('Failed to fetch satellites:', error);
      }
    }
    
    fetchSatellites();
  }, [setSatellites]);
  
  // Update closest satellite every 2 seconds when in closest satellite mode
  useEffect(() => {
    if (!closestSatelliteMode) return;
    
    const interval = setInterval(() => {
      findClosestSatellite();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [closestSatelliteMode, findClosestSatellite]);
  
  return (
    <>
      <color attach="background" args={['#000000']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[100, 0, 0]} intensity={1.5} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#ffffff" />
      
      {/* Background */}
      <Stars 
        radius={300} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1} 
      />
      
      {/* Main Objects */}
      <Earth />
      <Satellites />
      
      {/* Orbital Visualization */}
      <SatelliteTrails />
      
      {/* Motion Effects */}
      <MotionTrails />
      
      {/* Closest Satellite Line (NEW!) */}
      <ClosestSatelliteLine />
      
      {/* Camera Controls */}
      <CameraController />
    </>
  );
}

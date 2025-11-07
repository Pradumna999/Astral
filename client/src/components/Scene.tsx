import { useEffect } from 'react';
import { Stars } from '@react-three/drei';
import { Earth } from './Earth';
import { Satellites } from './Satellites';
import { SatelliteTrails } from './SatelliteTrails';
import { CameraController } from './CameraController';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function Scene() {
  const { setSatellites } = useSatelliteStore();
  
  useEffect(() => {
    async function fetchSatellites() {
      try {
        const response = await fetch('/api/satellites');
        const data = await response.json();
        setSatellites(data.satellites);
        console.log(`Loaded ${data.satellites.length} satellites`);
      } catch (error) {
        console.error('Failed to fetch satellites:', error);
      }
    }
    
    fetchSatellites();
  }, [setSatellites]);
  
  return (
    <>
      <color attach="background" args={['#000000']} />
      
      <ambientLight intensity={0.3} />
      <directionalLight position={[100, 0, 0]} intensity={1.5} />
      
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Satellites />
      <SatelliteTrails />
      
      <CameraController />
    </>
  );
}

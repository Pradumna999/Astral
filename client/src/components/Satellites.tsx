import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useSatelliteStore, type SatelliteInfo } from '@/lib/stores/useSatelliteStore';
import { EARTH_RADIUS } from './Earth';

const SCALE_FACTOR = 1 / 1000;

interface SatelliteData {
  satrec: satellite.SatRec;
  info: SatelliteInfo;
  trail: THREE.Vector3[];
}

export function Satellites() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { satellites, currentTime, setSatellitePosition, selectedSatellite, setSelectedSatellite, hoveredSatellite, setHoveredSatellite } = useSatelliteStore();
  const { camera, raycaster, pointer } = useThree();
  
  const satelliteData = useMemo<SatelliteData[]>(() => {
    return satellites.map(sat => {
      try {
        const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
        return {
          satrec,
          info: sat,
          trail: []
        };
      } catch (error) {
        console.error(`Failed to parse TLE for ${sat.name}:`, error);
        return null;
      }
    }).filter(Boolean) as SatelliteData[];
  }, [satellites]);
  
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  useEffect(() => {
    if (meshRef.current && satelliteData.length > 0) {
      meshRef.current.count = satelliteData.length;
    }
  }, [satelliteData.length]);
  
  useFrame(() => {
    if (!meshRef.current || satelliteData.length === 0) return;
    
    const time = currentTime;
    
    satelliteData.forEach((satData, index) => {
      try {
        const positionAndVelocity = satellite.propagate(satData.satrec, time);
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
          const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
          
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          
          const lat = positionGd.latitude;
          const lon = positionGd.longitude;
          const alt = positionGd.height;
          
          const radius = (EARTH_RADIUS + alt * SCALE_FACTOR);
          
          const x = radius * Math.cos(lat) * Math.cos(lon);
          const y = radius * Math.sin(lat);
          const z = radius * Math.cos(lat) * Math.sin(lon);
          
          tempObject.position.set(x, y, z);
          
          const isSelected = satData.info.noradId === selectedSatellite;
          const isHovered = satData.info.noradId === hoveredSatellite;
          
          let scale = 0.05;
          if (isSelected) {
            scale = 0.12;
            tempColor.setHex(0xffff00);
          } else if (isHovered) {
            scale = 0.08;
            tempColor.setHex(0xff8800);
          } else {
            switch (satData.info.category) {
              case 'Space Station':
                tempColor.setHex(0x00ff00);
                scale = 0.08;
                break;
              case 'Communications':
                tempColor.setHex(0x4488ff);
                break;
              case 'Weather':
                tempColor.setHex(0xff4444);
                break;
              case 'Navigation':
                tempColor.setHex(0xffaa00);
                break;
              default:
                tempColor.setHex(0xcccccc);
            }
          }
          
          tempObject.scale.setScalar(scale);
          tempObject.updateMatrix();
          
          meshRef.current!.setMatrixAt(index, tempObject.matrix);
          meshRef.current!.setColorAt(index, tempColor);
          
          if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
            const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
            const velocity = Math.sqrt(
              velocityEci.x * velocityEci.x +
              velocityEci.y * velocityEci.y +
              velocityEci.z * velocityEci.z
            );
            
            setSatellitePosition(satData.info.noradId, {
              x, y, z,
              lat: lat * (180 / Math.PI),
              lon: lon * (180 / Math.PI),
              alt,
              velocity
            });
          }
        }
      } catch (error) {
        console.error(`Error propagating satellite ${satData.info.name}:`, error);
      }
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  const handlePointerMove = (event: THREE.Event) => {
    if (!meshRef.current) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && instanceId < satelliteData.length) {
        setHoveredSatellite(satelliteData[instanceId].info.noradId);
        document.body.style.cursor = 'pointer';
      }
    } else {
      setHoveredSatellite(null);
      document.body.style.cursor = 'default';
    }
  };
  
  const handleClick = (event: THREE.Event) => {
    if (!meshRef.current) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && instanceId < satelliteData.length) {
        const clickedSat = satelliteData[instanceId].info.noradId;
        setSelectedSatellite(clickedSat === selectedSatellite ? null : clickedSat);
      }
    }
  };
  
  if (satelliteData.length === 0) return null;
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, satelliteData.length]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { useSatelliteStore, type SatelliteInfo } from "@/lib/stores/useSatelliteStore";
import { EARTH_RADIUS } from "./Earth";
import { sendToArduino } from "@/lib/hardware/serial";
import { createSatelliteGeometry } from './SatelliteModel';

const SCALE_FACTOR = 1 / 1000;
const ZUSTAND_UPDATE_INTERVAL = 60;

/* ===============================
   OBSERVER LOCATION
================================ */
const OBSERVER = {
  lat: 26.4499 * Math.PI / 180,
  lon: 80.3319 * Math.PI / 180,
  alt: 0.12 // km
};

interface SatelliteData {
  satrec: satellite.SatRec;
  info: SatelliteInfo;
  trail: THREE.Vector3[];
}

interface LocalPositionBuffer {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  alt: number;
  velocity: number;
}

export function Satellites() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const {
    satellites,
    currentTime,
    setSatellitePosition,
    selectedSatellite,
    hoveredSatellite,
    setRealtimePositionGetter
  } = useSatelliteStore();

  const localPositionBuffer = useRef<Map<string, LocalPositionBuffer>>(new Map());
  const frameCounter = useRef(0);
  const lastArduinoSend = useRef(0);

  const satelliteData = useMemo<SatelliteData[]>(() => {
    return satellites
      .map((sat) => {
        try {
          const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
          return { satrec, info: sat, trail: [] };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as SatelliteData[];
  }, [satellites]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const satelliteGeometry = useMemo(() => createSatelliteGeometry(), []);

  useEffect(() => {
    setRealtimePositionGetter(() => localPositionBuffer.current);
    return () => setRealtimePositionGetter(null);
  }, [setRealtimePositionGetter]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.count = satelliteData.length;
    }
  }, [satelliteData.length]);

  useFrame(() => {
    if (!meshRef.current || satelliteData.length === 0) return;

    frameCounter.current++;
    const time = currentTime;

    const shouldUpdateZustand =
      frameCounter.current % ZUSTAND_UPDATE_INTERVAL === 0;

    satelliteData.forEach((satData, index) => {
      try {
        const pv = satellite.propagate(
          satData.satrec,
          time
        ) as unknown as {
          position: satellite.EciVec3<number>;
          velocity: satellite.EciVec3<number>;
        };

        const positionEci = pv.position;
        const velocityEci = pv.velocity;

        const gmst = satellite.gstime(time);

        /* ===============================
           TRUE TRACKING MATH
        ================================ */

        const isTracked =
          selectedSatellite !== null &&
          satData.info.noradId === selectedSatellite;

        if (isTracked) {
          const satEcef = satellite.eciToEcf(positionEci, gmst);

          const obsEcef = satellite.geodeticToEcf({
            longitude: OBSERVER.lon,
            latitude: OBSERVER.lat,
            height: OBSERVER.alt
          });

          const rx = satEcef.x - obsEcef.x;
          const ry = satEcef.y - obsEcef.y;
          const rz = satEcef.z - obsEcef.z;

          const sinLat = Math.sin(OBSERVER.lat);
          const cosLat = Math.cos(OBSERVER.lat);
          const sinLon = Math.sin(OBSERVER.lon);
          const cosLon = Math.cos(OBSERVER.lon);

          const east  = -sinLon * rx + cosLon * ry;
          const north = -sinLat * cosLon * rx - sinLat * sinLon * ry + cosLat * rz;
          const up    =  cosLat * cosLon * rx + cosLat * sinLon * ry + sinLat * rz;

          const range = Math.sqrt(east * east + north * north + up * up);

          let azimuth = Math.atan2(east, north) * 180 / Math.PI;
          if (azimuth < 0) azimuth += 360;

          let elevation = Math.asin(up / range) * 180 / Math.PI;

          azimuth = Math.min(180, azimuth);
          elevation = Math.max(0, Math.min(90, elevation));

          const now = performance.now();
          if (now - lastArduinoSend.current > 250) {
            sendToArduino(azimuth, elevation);
            lastArduinoSend.current = now;
          }
        }

        /* ===============================
           VISUAL POSITION (UNCHANGED)
        ================================ */

        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const lat = positionGd.latitude;
        const lon = positionGd.longitude;
        const alt = positionGd.height;

        const radius = EARTH_RADIUS + alt * SCALE_FACTOR;

        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);

        tempObject.position.set(x, y, z);

        const isSelected = satData.info.noradId === selectedSatellite;
        const isHovered = satData.info.noradId === hoveredSatellite;

        let scale = 0.15;

        if (isSelected) {
          scale = 0.25;
          tempColor.setHex(0xffff00);
        } else if (isHovered) {
          scale = 0.20;
          tempColor.setHex(0xff8800);
        } else {
          tempColor.setHex(0xcccccc);
        }

        tempObject.scale.setScalar(scale);
        tempObject.updateMatrix();

        meshRef.current!.setMatrixAt(index, tempObject.matrix);
        meshRef.current!.setColorAt(index, tempColor);

        const velocity = Math.sqrt(
          velocityEci.x ** 2 +
          velocityEci.y ** 2 +
          velocityEci.z ** 2
        );

        localPositionBuffer.current.set(satData.info.noradId, {
          x,
          y,
          z,
          lat: lat * 180 / Math.PI,
          lon: lon * 180 / Math.PI,
          alt,
          velocity
        });

      } catch (e) {
        console.error(e);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    if (shouldUpdateZustand) {
      localPositionBuffer.current.forEach((pos, id) => {
        setSatellitePosition(id, pos);
      });
    }
  });

  if (satelliteData.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[satelliteGeometry, null as any, satelliteData.length]}
    >
      <meshStandardMaterial />
    </instancedMesh>
  );
}

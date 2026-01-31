import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import "@fontsource/inter";
import { Scene } from "./components/Scene";
import { TimeControls } from "./components/TimeControls";
import { NavigationControls } from "./components/NavigationControls";
import { SatelliteList } from "./components/SatelliteList";
import { SatelliteDetails } from "./components/SatelliteDetails";
import { PerformanceMonitor, PerformanceDisplay } from "./components/PerformanceMonitor";

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{
          position: [0, 15, 30],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <Scene />
          <PerformanceMonitor />
        </Suspense>
      </Canvas>
      
      <TimeControls />
      <NavigationControls />
      <SatelliteList />
      <SatelliteDetails />
      <PerformanceDisplay />
    </div>
  );
}

export default App;

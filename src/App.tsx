// App.tsx
import { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import Sphere, { SphereData } from './Sphere';
import './index.css';
import { useControls } from 'leva';
import axios from 'axios';
// import { NumberKeyframeTrack } from 'three';

const App: FC = () => {
  // meta.env doesn't seem to import .env file vars
  // const envir = import.meta.env.BASE_URL;  
  // console.log(envir);
  const [spheres, setSpheres] = useState<SphereData[]>([]);
  const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);

  const fetchapi = async () => {
    const response = await axios.get("/api/data");
    console.log(response.data);
  }

  useEffect(() => {
    fetchapi();
  },[])
  function MyComponent() {
    const { myValue } = useControls({ myValue: 10 })
    return myValue
  }

  // Adds a new sphere at the origin with default scale.
  const addSphere = () => {
    const newSphere: SphereData = {
      id: Math.random().toString(36).substring(2, 9),
      position: [0, 0, 0],
      scale: 1,
    };
    setSpheres((prev) => [...prev, newSphere]);
    setSelectedSphereId(newSphere.id);
  };

  // Update the properties of a sphere by id.
  const updateSphere = (
    id: string,
    key: 'position' | 'scale',
    value: number | [number, number, number]
  ) => {
    setSpheres((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (key === 'position') {
            return { ...s, position: value as [number, number, number]};
          } else if (key === 'scale') {
            return { ...s, scale: value as number};
          }
        }
        return s;
      })
    );
  };

  // Find the currently selected sphere.
  const selectedSphere = spheres.find((s) => s.id === selectedSphereId);

  // Export the scene (all spheres) to a JSON file.
  const exportScene = () => {
    const dataStr = JSON.stringify(spheres, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* UI panel */}
      <MyComponent />
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1,
          background: 'rgba(255,255,255,0.8)',
          padding: 10,
          borderRadius: 4,
        }}
      >
        <button onClick={addSphere}>Add Sphere</button>
        <button onClick={exportScene} style={{ marginLeft: 10 }}>
          Export Scene
        </button>
        {selectedSphere && (
          <div style={{ marginTop: 10 }}>
            <div>
              <label>
                X:{' '}
                <input
                  type="number"
                  value={selectedSphere.position[0]}
                  onChange={(e) => {
                    const x = parseFloat(e.target.value);
                    updateSphere(selectedSphere.id, 'position', [
                      x,
                      selectedSphere.position[1],
                      selectedSphere.position[2],
                    ]);
                  }}
                />
              </label>
            </div>
            <div>
              <label>
                Y:{' '}
                <input
                  type="number"
                  value={selectedSphere.position[1]}
                  onChange={(e) => {
                    const y = parseFloat(e.target.value);
                    updateSphere(selectedSphere.id, 'position', [
                      selectedSphere.position[0],
                      y,
                      selectedSphere.position[2],
                    ]);
                  }}
                />
              </label>
            </div>
            <div>
              <label>
                Z:{' '}
                <input
                  type="number"
                  value={selectedSphere.position[2]}
                  onChange={(e) => {
                    const z = parseFloat(e.target.value);
                    updateSphere(selectedSphere.id, 'position', [
                      selectedSphere.position[0],
                      selectedSphere.position[1],
                      z,
                    ]);
                  }}
                />
              </label>
            </div>
            <div>
              <label>
                Scale:{' '}
                <input
                  type="number"
                  value={selectedSphere.scale}
                  step="0.1"
                  onChange={(e) => {
                    const scale = parseFloat(e.target.value);
                    updateSphere(selectedSphere.id, 'scale', scale);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
      {/* 3D Scene */}
      <Canvas
        style={{ width: '100vw', height: '100vh', background: '#000' }}
        camera={{ fov: 50, position: [0, 0, 5], near: 0.1, far: 100 }}
        onPointerMissed={() => setSelectedSphereId(null)}
      >
        <hemisphereLight color={0x0099ff} groundColor={0xaa5500} intensity={1} />
        {spheres.map((sphere) => (
          <Sphere
            key={sphere.id}
            data={sphere}
            isSelected={sphere.id === selectedSphereId}
            onSelect={(id) => setSelectedSphereId(id)}
          />
        ))}
        <FirstPersonControls activeLook={false}/>
      </Canvas>
    </div>
  );
};

export default App;

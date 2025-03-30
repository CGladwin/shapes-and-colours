// App.tsx
import { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import { useControls, button, Leva,folder } from 'leva';
import Sphere, { Primitive, MaterialType } from './Sphere';
import axios from 'axios';
import './index.css';

type CameraSettings = {
  aspect_ratio: number;
  image_width: number;
  samples_per_pixel: number;
  max_depth: number;
  vfov: number;
  lookfrom: [number, number, number];
  lookat: [number, number, number];
  vup: [number, number, number];
  defocus_angle: number;
  focus_dist: number;
};

type SceneData = {
  primitives: Primitive[];
  camera: CameraSettings;
};

const App: FC = () => {
  const fetchapi = async () => {
    const response = await axios.get("/api/data");
    console.log(response.data);
  }

  useEffect(() => {
    fetchapi();
  },[])

  const [spheres, setSpheres] = useState<Primitive[]>([]);
  const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<CameraSettings>({
    aspect_ratio: 16.0 / 9.0,
    image_width: 400,
    samples_per_pixel: 100,
    max_depth: 50,
    vfov: 20,
    lookfrom: [0, 0, 5],
    lookat: [0, 0, -1],
    vup: [0, 1, 0],
    defocus_angle: 10.0,
    focus_dist: 3.4,
  });

// Sync Leva UI with camera state
const levaControls = useControls('Camera', {
  aspect_ratio: { value: cameraState.aspect_ratio, min: 0.1, max: 5, step: 0.1 },
  image_width: { value: cameraState.image_width, min: 100, max: 2000, step: 100 },
  samples_per_pixel: { value: cameraState.samples_per_pixel, min: 1, max: 500, step: 1 },
  max_depth: { value: cameraState.max_depth, min: 1, max: 100, step: 1 },
  vfov: { value: cameraState.vfov, min: 5, max: 120, step: 1 },
  lookfrom: { value: cameraState.lookfrom },
  lookat: { value: cameraState.lookat },
  vup: { value: cameraState.vup },
  defocus_angle: { value: cameraState.defocus_angle, min: 0, max: 20, step: 0.1 },
  focus_dist: { value: cameraState.focus_dist, min: 0.1, max: 20, step: 0.1 },
});

// Sync Leva UI with sphere state
useEffect(() => {
  setCameraState(levaControls);
}, [levaControls]);

useEffect(() => {
  setSpheres([...spheres]); // Forces re-render when spheres update
}, [spheres]);

  // Sphere controls with Leva
  useControls('Spheres', {
    Add: button(() => addSphere()),
    Export: button(() => exportScene()),
  });

  // Selected sphere controls
  const selectedSphere = spheres.find((s) => s.id === selectedSphereId);
  
  useControls({
    'Selected Sphere': folder({
      position: {
        value: selectedSphere?.center || [0, 0, 0],
        onChange: (value: [number, number, number]) => {
          if (selectedSphereId) {
            setSpheres(spheres.map(s => 
              s.id === selectedSphereId ? { ...s, center: value } : s
            ));
          }
        },
        render: () => !!selectedSphereId,
        immediate: true 
      },
      radius: {
        value: selectedSphere?.radius || 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        onChange: (value: number) => {
          if (selectedSphereId) {
            setSpheres(spheres.map(s => 
              s.id === selectedSphereId ? { ...s, radius: value } : s
            ));
          }
        },
        render: () => !!selectedSphereId,
        immediate: true 
      },
      material: folder({
        type: {
          value: selectedSphere?.material || "lambertian",
          options: ["lambertian", "metal", "dielectric"],
          onChange: (value: MaterialType) => {
            if (selectedSphereId) {
              setSpheres(spheres.map(s => 
                s.id === selectedSphereId ? { ...s, material: value } : s
              ));
            }
          },
          render: () => !!selectedSphereId,
          immediate: true 
        },
        color: {
          value: selectedSphere?.color_args || [0.8, 0.8, 0.8],
          onChange: (value: [number, number, number]) => {
            if (selectedSphereId) {
              setSpheres(spheres.map(s => 
                s.id === selectedSphereId ? { ...s, color_args: value } : s
              ));
            }
          },
          render: (get) => !!selectedSphereId && get('Selected Sphere.material.type') !== 'dielectric',
          immediate: true 
        },
        fuzz: {
          value: selectedSphere?.metal_fuzz || 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value: number) => {
            if (selectedSphereId) {
              setSpheres(spheres.map(s => 
                s.id === selectedSphereId ? { ...s, metal_fuzz: value } : s
              ));
            }
          },
          render: (get) => !!selectedSphereId && get('Selected Sphere.material.type') === 'metal',
          immediate: true 
        },
        refractionIndex: {
          value: selectedSphere?.dielectric_refraction_index || 1.5,
          min: 1,
          max: 3,
          step: 0.1,
          onChange: (value: number) => {
            if (selectedSphereId) {
              setSpheres(spheres.map(s => 
                s.id === selectedSphereId ? { ...s, dielectric_refraction_index: value } : s
              ));
            }
          },
          render: (get) => !!selectedSphereId && get('Selected Sphere.material.type') === 'dielectric',
          immediate: true 
        }
      }, { collapsed: true, render: () => !!selectedSphereId })
    }, { collapsed: true, render: () => !!selectedSphereId })
  });

  const addSphere = () => {
    const newSphere: Primitive = {
      type: "sphere",
      id: Math.random().toString(36).substring(2, 9),
      center: [0, 0, 0],
      radius: 1,
      material: "lambertian",
      color_args: [0.8, 0.8, 0.8]
      
    };
    setSpheres([...spheres, newSphere]);
    setSelectedSphereId(newSphere.id);
  };

  // App.tsx (fixed version)
  const exportScene = () => {
    // Use the latest camera and sphere data from state
    const primitives: Primitive[] = spheres.map((sphere) => ({
      ...sphere,
      metal_fuzz: sphere.material === "metal" ? sphere.metal_fuzz : undefined,
      dielectric_refraction_index: sphere.material === "dielectric" ? sphere.dielectric_refraction_index : undefined,
    }));
  
    const sceneData: SceneData = {
      primitives,
      camera: cameraState, // Use updated state
    };
  
    const dataStr = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva collapsed />
      <Canvas
        style={{ width: '100vw', height: '100vh', background: '#000' }}
        camera={{
          fov: cameraState.vfov,
          position: cameraState.lookfrom,
          near: 0.1,
          far: 100,
          up: cameraState.vup          
          }}
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
        <FirstPersonControls activeLook={false} />
      </Canvas>
    </div>
  );
};

export default App;
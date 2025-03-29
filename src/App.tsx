// App.tsx
import { FC, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import { useControls, button, Leva } from 'leva';
import Sphere, { Primitive, MaterialType } from './Sphere';
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
  const [spheres, setSpheres] = useState<Primitive[]>([]);
  const [selectedSphereId, setSelectedSphereId] = useState<string | null>(null);

  // Camera controls with Leva
  const cameraSettings = useControls('Camera', {
    aspect_ratio: { value: 16.0 / 9.0, min: 0.1, max: 5, step: 0.1 },
    image_width: { value: 400, min: 100, max: 2000, step: 100 },
    samples_per_pixel: { value: 100, min: 1, max: 500, step: 1 },
    max_depth: { value: 50, min: 1, max: 100, step: 1 },
    vfov: { value: 20, min: 5, max: 120, step: 1 },
    lookfrom: { value: [-2, 2, 1] as [number, number, number] },
    lookat: { value: [0, 0, -1] as [number, number, number] },
    vup: { value: [0, 1, 0] as [number, number, number] },
    defocus_angle: { value: 10.0, min: 0, max: 20, step: 0.1 },
    focus_dist: { value: 3.4, min: 0.1, max: 20, step: 0.1 },
  });

  // Sphere controls with Leva
  const sphereControls = useControls('Spheres', {
    Add: button(() => addSphere()),
    Export: button(() => exportScene()),
  });

  // Material controls for selected sphere
  const selectedSphere = spheres.find((s) => s.id === selectedSphereId);
  useControls('Material', {
    type: {
      value: selectedSphere?.material || "lambertian",
      options: ["lambertian", "metal", "dielectric"],
      onChange: (value: MaterialType) => {
        if (selectedSphereId) {
          setSpheres(spheres.map(s => 
            s.id === selectedSphereId ? { ...s, material: value } : s
          ));
        }
      }
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
      render: (get) => get('Material.type') !== 'dielectric'
    },
    fuzz: {
      value: 1.0,
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
      render: (get) => get('Material.type') === 'metal'
    },
    refractionIndex: {
      value: 1.5,
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
      render: (get) => get('Material.type') === 'dielectric'
    }
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

  const exportScene = () => {
    const primitives: Primitive[] = spheres.map(sphere => {
      const base: Primitive = {
        type: "sphere",
        center: sphere.center,
        radius: sphere.radius,
        material: sphere.material,
        id: sphere.id
      };

      if (sphere.material === "lambertian" || sphere.material === "metal") {
        base.color_args = sphere.color_args;
      }
      if (sphere.material === "metal") {
        base.metal_fuzz = sphere.metal_fuzz || 0.5;
      }
      if (sphere.material === "dielectric") {
        base.dielectric_refraction_index = sphere.dielectric_refraction_index || 1.5;
      }

      return base;
    });

    const sceneData: SceneData = {
      primitives,
      camera: cameraSettings
    };

    const dataStr = JSON.stringify(sceneData, null, 2);
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
      <Leva collapsed />
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
        <FirstPersonControls activeLook={false} />
      </Canvas>
    </div>
  );
};

export default App;
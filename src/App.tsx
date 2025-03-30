// App.tsx
import { FC, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import GUI from 'lil-gui';
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
  // Initialize ref with null as the initial value.
  const guiRef = useRef<GUI | null>(null);
  const sphereFolderRef = useRef<GUI | null>(null);
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

  useEffect(() => {
    // Initialize GUI
    const gui = new GUI();
    guiRef.current = gui;

    // Camera controls
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(cameraState, 'aspect_ratio', 0.1, 5, 0.1).name('Aspect Ratio');
    cameraFolder.add(cameraState, 'image_width', 100, 2000, 100).name('Image Width');
    cameraFolder.add(cameraState, 'samples_per_pixel', 1, 500, 1).name('Samples');
    cameraFolder.add(cameraState, 'max_depth', 1, 100, 1).name('Max Depth');
    cameraFolder.add(cameraState, 'vfov', 5, 120, 1).name('FOV');
    cameraFolder.add(cameraState.lookfrom, '0', -10, 10, 0.1).name('LookFrom X');
    cameraFolder.add(cameraState.lookfrom, '1', -10, 10, 0.1).name('LookFrom Y');
    cameraFolder.add(cameraState.lookfrom, '2', -10, 10, 0.1).name('LookFrom Z');
    // Fix: Use cameraState as the target object instead of its numeric property.
    cameraFolder.add(cameraState, 'defocus_angle', 0, 20, 0.1).name('Defocus Angle');
    cameraFolder.add(cameraState, 'focus_dist', 0.1, 20, 0.1).name('Focus Dist');

    // Sphere controls
    const sphereFolder = gui.addFolder('Spheres');
    sphereFolderRef.current = sphereFolder;
    sphereFolder.add({ Add: () => addSphere() }, 'Add').name('Add Sphere');
    sphereFolder.add({ Export: () => exportScene() }, 'Export').name('Export Scene');

    return () => {
      gui.destroy();
    };
  }, []);

  useEffect(() => {
    // Update sphere controls when selection changes
    if (!guiRef.current || !selectedSphereId) return;

    const selectedSphere = spheres.find(s => s.id === selectedSphereId);
    if (!selectedSphere) return;

    // Clear previous controls
    if (sphereFolderRef.current) {
      sphereFolderRef.current.destroy();
      sphereFolderRef.current = guiRef.current.addFolder('Selected Sphere');
    }

    // Position controls
    sphereFolderRef.current.add(selectedSphere.center, '0', -10, 10, 0.1)
      .name('X').onChange((v: number) => updateSpherePosition(0, v));
    sphereFolderRef.current.add(selectedSphere.center, '1', -10, 10, 0.1)
      .name('Y').onChange((v: number) => updateSpherePosition(1, v));
    sphereFolderRef.current.add(selectedSphere.center, '2', -10, 10, 0.1)
      .name('Z').onChange((v: number) => updateSpherePosition(2, v));

    // Radius control
    sphereFolderRef.current.add(selectedSphere, 'radius', 0.1, 5, 0.1)
      .name('Radius').onChange((v: number) => updateSphereRadius(v));

    // Material controls
    const materialFolder = sphereFolderRef.current.addFolder('Material');
    materialFolder.add(selectedSphere, 'material', ['lambertian', 'metal', 'dielectric'])
      .name('Type').onChange((v: MaterialType) => updateSphereMaterial(v));

    if (selectedSphere.material !== 'dielectric') {
      materialFolder.addColor(selectedSphere, 'color_args').name('Color')
        .onChange((v: [number, number, number]) => updateSphereColor(v));
    }

    if (selectedSphere.material === 'metal') {
      materialFolder.add(selectedSphere, 'metal_fuzz', 0, 1, 0.01).name('Fuzz');
    }

    if (selectedSphere.material === 'dielectric') {
      materialFolder.add(selectedSphere, 'dielectric_refraction_index', 1, 3, 0.1)
        .name('Refraction Index');
    }

    sphereFolderRef.current.open();
  }, [selectedSphereId, spheres]);

  const updateSpherePosition = (index: number, value: number) => {
    setSpheres(spheres.map(s => {
      if (s.id === selectedSphereId) {
        const newCenter = [...s.center] as [number, number, number];
        newCenter[index] = value;
        return { ...s, center: newCenter };
      }
      return s;
    }));
  };

  const updateSphereRadius = (value: number) => {
    setSpheres(spheres.map(s => 
      s.id === selectedSphereId ? { ...s, radius: value } : s
    ));
  };

  const updateSphereMaterial = (value: MaterialType) => {
    setSpheres(spheres.map(s => {
      if (s.id === selectedSphereId) {
        const updated: Primitive = { ...s, material: value };
        if (value === 'dielectric') {
          updated.dielectric_refraction_index = 1.5;
        } else {
          updated.color_args = [0.8, 0.8, 0.8];
        }
        return updated;
      }
      return s;
    }));
  };

  const updateSphereColor = (value: [number, number, number]) => {
    setSpheres(spheres.map(s => 
      s.id === selectedSphereId ? { ...s, color_args: value } : s
    ));
  };

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
    const sceneData: SceneData = {
      primitives: spheres.map(sphere => ({
        ...sphere,
        metal_fuzz: sphere.material === "metal" ? sphere.metal_fuzz : undefined,
        dielectric_refraction_index: sphere.material === "dielectric" 
          ? sphere.dielectric_refraction_index 
          : undefined
      })),
      camera: cameraState
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

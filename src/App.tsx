import { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import { useControls, button } from 'leva';
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
  const [camera, setCamera] = useState<CameraSettings>({
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

  // Camera controls via Leva – changes are reflected instantly
  const cameraControls = useControls('Camera', {
    aspect_ratio: { value: camera.aspect_ratio, min: 0.1, max: 5, step: 0.1 },
    image_width: { value: camera.image_width, min: 100, max: 2000, step: 100 },
    samples_per_pixel: { value: camera.samples_per_pixel, min: 1, max: 500, step: 1 },
    max_depth: { value: camera.max_depth, min: 1, max: 100, step: 1 },
    vfov: { value: camera.vfov, min: 5, max: 120, step: 1 },
    lookfrom: { value: camera.lookfrom, step: 0.1 },
    lookat: { value: camera.lookat, step: 0.1 },
    vup: { value: camera.vup, step: 0.1 },
    defocus_angle: { value: camera.defocus_angle, min: 0, max: 20, step: 0.1 },
    focus_dist: { value: camera.focus_dist, min: 0.1, max: 20, step: 0.1 },
  });

  useEffect(() => {
    setCamera(cameraControls);
  }, [cameraControls]);

  // Global sphere controls: add a sphere and export the scene
  useControls('Spheres', {
    Add_Sphere: button(() => addSphere()),
    Export_Scene: button(() => exportScene()),
  });

  // Find the selected sphere (if any)
  const selectedSphere = spheres.find((s) => s.id === selectedSphereId);

  // Selected sphere controls – these update state instantly via onChange callbacks
  useControls(
    'Selected Sphere',
    () => {
      if (!selectedSphere) return {};
      return {
        X: {
          value: selectedSphere.center[0],
          min: -10,
          max: 10,
          step: 0.1,
          onChange: (v: number) => updateSpherePosition(0, v),
        },
        Y: {
          value: selectedSphere.center[1],
          min: -10,
          max: 10,
          step: 0.1,
          onChange: (v: number) => updateSpherePosition(1, v),
        },
        Z: {
          value: selectedSphere.center[2],
          min: -10,
          max: 10,
          step: 0.1,
          onChange: (v: number) => updateSpherePosition(2, v),
        },
        radius: {
          value: selectedSphere.radius,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: (v: number) => updateSphereRadius(v),
        },
        material: {
          value: selectedSphere.material,
          options: { lambertian: 'lambertian', metal: 'metal', dielectric: 'dielectric' },
          onChange: (v: MaterialType) => updateSphereMaterial(v),
        },
        ...(selectedSphere.material !== 'dielectric'
          ? {
              color: {
                value: selectedSphere.color_args ?? [0.8, 0.8, 0.8],
                label: 'Color',
                onChange: (v: [number, number, number]) => updateSphereColor(v),
              },
            }
          : {}),
        ...(selectedSphere.material === 'metal'
          ? {
              metal_fuzz: {
                value: selectedSphere.metal_fuzz ?? 0,
                min: 0,
                max: 1,
                step: 0.01,
              },
            }
          : {}),
        ...(selectedSphere.material === 'dielectric'
          ? {
              dielectric_refraction_index: {
                value: selectedSphere.dielectric_refraction_index ?? 1.5,
                min: 1,
                max: 3,
                step: 0.1,
              },
            }
          : {}),
      };
    },
    [selectedSphere]
  );

  // Update functions – update the spheres state so the scene re-renders
  const updateSpherePosition = (index: number, value: number) => {
    setSpheres((prev) =>
      prev.map((s) => {
        if (s.id === selectedSphereId) {
          const newCenter = [...s.center] as [number, number, number];
          newCenter[index] = value;
          return { ...s, center: newCenter };
        }
        return s;
      })
    );
  };

  const updateSphereRadius = (value: number) => {
    setSpheres((prev) =>
      prev.map((s) => (s.id === selectedSphereId ? { ...s, radius: value } : s))
    );
  };

  const updateSphereMaterial = (value: MaterialType) => {
    setSpheres((prev) =>
      prev.map((s) => {
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
      })
    );
  };

  const updateSphereColor = (value: [number, number, number]) => {
    setSpheres((prev) =>
      prev.map((s) => (s.id === selectedSphereId ? { ...s, color_args: value } : s))
    );
  };

  // Adds a new sphere and marks it as selected
  const addSphere = () => {
    const newSphere: Primitive = {
      type: 'sphere',
      id: Math.random().toString(36).substring(2, 9),
      center: [0, 0, -10],
      radius: 1,
      material: 'lambertian',
      color_args: [0.8, 0.8, 0.8],
    };
    setSpheres((prev) => [...prev, newSphere]);
    setSelectedSphereId(newSphere.id);
  };

  // Export the scene (primitives and camera settings) as JSON
  const exportScene = () => {
    const sceneData: SceneData = {
      primitives: spheres.map((sphere) => ({
        ...sphere,
        metal_fuzz: sphere.material === 'metal' ? sphere.metal_fuzz : undefined,
        dielectric_refraction_index:
          sphere.material === 'dielectric' ? sphere.dielectric_refraction_index : undefined,
      })),
      camera: {
        aspect_ratio: cameraControls.aspect_ratio,
        image_width: cameraControls.image_width,
        samples_per_pixel: cameraControls.samples_per_pixel,
        max_depth: cameraControls.max_depth,
        vfov: cameraControls.vfov,
        lookfrom: cameraControls.lookfrom,
        lookat: cameraControls.lookat,
        vup: cameraControls.vup,
        defocus_angle: cameraControls.defocus_angle,
        focus_dist: cameraControls.focus_dist,
      },
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
        <button onClick={exportScene} style={{ marginLeft: 10 }}>
          Export Scene
        </button>
      </div>
      <Canvas
        style={{ width: '100vw', height: '100vh', background: '#000' }}
        camera={{
          fov: cameraControls.vfov,
          position: cameraControls.lookfrom,
          near: 0.1,
          far: 100,
          up: cameraControls.vup,
        }}
        onPointerMissed={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedSphereId(null);
          }
        }}
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

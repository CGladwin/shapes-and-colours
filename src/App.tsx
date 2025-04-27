import { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { FirstPersonControls } from '@react-three/drei';
import Sphere, { SphereType, MaterialType } from './Sphere';
import './index.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from "@/components/ui/theme-provider"
import CameraUpdater from './CameraUpdater';

// types cannot have fields added later, interfaces can
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
  denoise: number;
  upscale: boolean;
};

type SceneData = {
  primitives: SphereType[];
  camera: CameraSettings;
};

const App: FC = () => {
  const [spheres, setSpheres] = useState<SphereType[]>([]);
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
    defocus_angle: 0.6,
    focus_dist: 10.0,
    denoise: 0,
    upscale: false
  });

  useEffect(() => { 
    window.addEventListener("keydown", function(e) {
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
    }, false);
  })


  // Find the selected sphere (if any)
  const selectedSphere = spheres.find((s) => s.id === selectedSphereId);

  const updateCameraLookFrom = (position: [number, number, number]) => {
    setCamera((prev) => ({ ...prev, lookfrom: position.map((val) => {return Number(val.toFixed(2))} ) as [number,number,number]
    }));
  };


  const handleCameraChange = (field: keyof CameraSettings, value: unknown) => {
    setCamera(prev => ({ ...prev, [field]: value }));
  };

  // Adds a new sphere and marks it as selected
  const addSphere = () => {
    const newSphere: SphereType = {
      type: 'sphere',
      id: Math.random().toString(36).substring(2, 9),
      center: [0, 0, -5],
      radius: 1,
      material: 'lambertian',
      color_args: [0.8, 0.8, 0.8],
    };
    setSpheres((prev) => [...prev, newSphere]);
    setSelectedSphereId(newSphere.id);
  };

  const updateSphere = (field: keyof SphereType, value: unknown) => {
    if (!selectedSphereId) return;
    setSpheres(prev => prev.map(s => 
      s.id === selectedSphereId ? { ...s, [field]: value } : s
    ));
  };

  // Export the scene (primitives and camera settings) as JSON
  const exportScene = () => {
    // Prepare primitives data with conditional properties
    const primitives = spheres.map(sphere => ({
      type: sphere.type,
      id: sphere.id,
      center: sphere.center,
      radius: sphere.radius,
      material: sphere.material,
      color_args: sphere.material !== 'dielectric' 
        ? sphere.color_args?.map((e) => {
          return Number(e.toFixed(2));
      }) as [number,number,number] : undefined,
      metal_fuzz: sphere.material === 'metal' ? sphere.metal_fuzz : undefined,
      dielectric_refraction_index: 
        sphere.material === 'dielectric' ? sphere.dielectric_refraction_index : undefined
    }));

    // Create complete scene data
    const sceneData: SceneData = {
      primitives: primitives.map(p => (
        p.material === 'dielectric' && (p.dielectric_refraction_index ??= 0.1),
        p.material === 'metal' && (p.metal_fuzz ??= 0.1),
        p
      )),
      camera: {
        aspect_ratio: camera.aspect_ratio,
        image_width: camera.image_width,
        samples_per_pixel: camera.samples_per_pixel,
        max_depth: camera.max_depth,
        vfov: camera.vfov,
        lookfrom: [camera.lookfrom[0],camera.lookfrom[1],camera.lookfrom[2]-3],
        lookat: [camera.lookfrom[0],camera.lookfrom[1],camera.lookfrom[2]-6],
        vup: camera.vup,
        defocus_angle: camera.defocus_angle,
        focus_dist: camera.focus_dist,
        denoise: camera.denoise,
        upscale: camera.upscale
      }
    };

    // Create and trigger download
    const dataStr = JSON.stringify(sceneData, null, 2);
    if(sceneData.primitives.length < 1){
      alert("error! I dont see shapes or colors!");
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataStr
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        console.log(response);// Parse JSON response
        return response.blob();
      })
      .then(blob => {
        console.log("Success");
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement('a');
        link.href = url;
        link.download = 'scene.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(error => console.error("Error:", error));

};

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {<div className="flex h-screen">
      {/* Controls Sidebar */}
      <div className="w-80 p-4 border-r space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Camera Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Field of View</Label>
              <Slider
                value={[camera.vfov]}
                min={5}
                max={120}
                step={1}
                onValueChange={([v]) => handleCameraChange('vfov', v)}
              />
              <Input
                type="number"
                value={camera.vfov}
                onChange={(e) => handleCameraChange('vfov', Number(e.target.value))}
              />
            </div>
            {/* Add other camera controls similarly */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Postprocessing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Denoising</Label>
              <Slider
                value={[camera.denoise]}
                min={0}
                max={3}
                step={1}
                onValueChange={([v]) => handleCameraChange('denoise', v)}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="upscale-switch">Upscale</Label>
                <Switch
                  id="upscale-switch"
                  checked={camera.upscale}
                  onCheckedChange={(v) => handleCameraChange('upscale', v)}
                />
              </div>
            </div>
            {/* Add other camera controls similarly */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scene Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={addSphere}>
              Add Sphere
            </Button>
            <Button className="w-full" onClick={exportScene}>
              Export Scene
            </Button>
          </CardContent>
        </Card>

        {selectedSphere && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Sphere</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedSphere.center.map((val, i) => (
                    <Input
                      key={i}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newPos = [...selectedSphere.center] as [number, number, number];
                        newPos[i] = Number(e.target.value);
                        updateSphere('center', newPos);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Radius</Label>
                <Slider
                  value={[selectedSphere.radius]}
                  min={0.1}
                  max={5}
                  step={0.1}
                  onValueChange={([v]) => updateSphere('radius', v)}
                />
                <Input
                  type="number"
                  value={selectedSphere.radius}
                  onChange={(e) => updateSphere('radius', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Material</Label>
                <Select
                  value={selectedSphere.material}
                  onValueChange={(v: MaterialType) => updateSphere('material', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lambertian">Lambertian</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="dielectric">Dielectric</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedSphere.material !== 'dielectric' && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={`#${selectedSphere.color_args?.map(x => 
                      Math.round(x * 255).toString(16).padStart(2, '0')
                    ).join('')}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      const rgb = [
                        parseInt(hex.substring(0,2), 16) / 255,
                        parseInt(hex.substring(2,4), 16) / 255,
                        parseInt(hex.substring(4,6), 16) / 255
                      ] as [number, number, number];
                      updateSphere('color_args', rgb);
                    }}
                  />
                </div>
              )}

              {selectedSphere.material === 'metal' && (
                <div className="space-y-2">
                  <Label>Metal Fuzz</Label>
                  <Slider
                    value={[selectedSphere.metal_fuzz || 0]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => updateSphere('metal_fuzz', v)}
                  />
                </div>
              )}

              {selectedSphere.material === 'dielectric' && (
                <div className="space-y-2">
                  <Label>Refraction Index</Label>
                  <Slider
                    value={[selectedSphere.dielectric_refraction_index || 1.5]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={([v]) => updateSphere('dielectric_refraction_index', v)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas
          camera={{
            fov: camera.vfov,
            position: camera.lookfrom,
            near: 0.01,
            far: 100,
            up: camera.vup,
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
          <CameraUpdater onUpdate={updateCameraLookFrom}></CameraUpdater>
          <FirstPersonControls activeLook={false} />
        </Canvas>
      </div>
    </div>}
    </ThemeProvider>
    
  );

};

export default App;

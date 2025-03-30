// Sphere.tsx
import { FC } from 'react';
import { Color } from 'three';

export type MaterialType = "lambertian" | "metal" | "dielectric";

export interface Primitive {
  type: "sphere";
  id: string;
  center: [number, number, number];
  radius: number;
  material: MaterialType;
  color_args?: [number, number, number];
  metal_fuzz?: number;
  dielectric_refraction_index?: number;
};

interface SphereProps {
  data: Primitive;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const Sphere: FC<SphereProps> = ({ data, isSelected, onSelect }) => {
  // Convert color_args to Three.js Color
  const sphereColor = data.color_args 
    ? new Color(...data.color_args)
    : new Color(0.8, 0.8, 0.8);
    return (
      <group
        position={data.center}
        scale={[data.radius, data.radius, data.radius]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(data.id);
        }}
      >
        {/* Main sphere with material */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial 
            color={sphereColor} 
            metalness={data.material === 'metal' ? 0.8 : 0}
            roughness={data.material === 'metal' ? data.metal_fuzz : 1}
            transparent={data.material === 'dielectric'}
            opacity={data.material === 'dielectric' ? 0.8 : 1}
          />
        </mesh>
  
        {/* Selection outline */}
        {isSelected && (
          <mesh scale={1.02}>
            <icosahedronGeometry args={[1, 3]} />
            <meshBasicMaterial 
              color="white" 
              wireframe
              wireframeLinewidth={2}
            />
          </mesh>
        )}
      </group>
    );
};

export default Sphere;

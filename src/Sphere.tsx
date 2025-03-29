// Sphere.tsx
import { FC } from 'react';

export interface SphereData {
  id: string;
  center: [number, number, number];
  radius: number;
  material: "lambertian" | "dielectric" | "metal";
  color_args: [number, number, number];
}

interface SphereProps {
  data: SphereData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const Sphere: FC<SphereProps> = ({ data, isSelected, onSelect }) => {
  return (
    <group
      position={data.center}
      scale={[data.radius, data.radius, data.radius]}
      onClick={(e) => {
        e.stopPropagation(); // Prevent click events from bubbling up
        onSelect(data.id);
      }}
    >
      {/* Main sphere */}
      <mesh>
        <icosahedronGeometry args={[1.0, 3]} />
        <meshToonMaterial color={0x808080} />
      </mesh>
      {/* Wireframe overlay only for selected sphere */}
      {isSelected && (
        <mesh scale={[1.001, 1.001, 1.001]}>
          <icosahedronGeometry args={[1.0, 3]} />
          <meshBasicMaterial color={0xffffff} wireframe />
        </mesh>
      )}
    </group>
  );
};

export default Sphere;

// CameraUpdater.tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useRef,FC } from 'react';

type CameraUpdaterProps = {
  onUpdate: (position: [number, number, number]) => void;
};

const CameraUpdater: FC<CameraUpdaterProps> = ({ onUpdate }) => {
  const { camera } = useThree();
  const prevPosition = useRef(camera.position.clone());

  useFrame(() => {
    // Check if the camera's position has changed
    if (!camera.position.equals(prevPosition.current)) {
      prevPosition.current.copy(camera.position);
      onUpdate([
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ]);
    }
  });

  return null;
};

export default CameraUpdater;

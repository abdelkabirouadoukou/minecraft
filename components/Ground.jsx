import { usePlane } from '@react-three/cannon';
import { useThree } from '@react-three/fiber';
import { groundTexture } from '@/utils/textures';
import { useStore } from '@/hooks/useStore';
import { useEffect } from 'react';
import { Vector3 } from 'three';

const REACH_LIMIT = 6;

export const Ground = () => {
    const { camera } = useThree();
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -0.5, 0],
    }));

    // Accessing store functions with a default value
    const [addCube] = useStore((state) => {
        if (!state) return [() => {}]; // Default function if state is undefined
        return [state.addCube];
    });

    // Set the texture repeat before applying it
    useEffect(() => {
        if (groundTexture) {
            groundTexture.repeat.set(100, 100);
        }
    }, []);

    return (
        <mesh
            onClick={(e) => {
                e.stopPropagation();
                const [x, y, z] = Object.values(e.point).map(val => Math.ceil(val));
                const dist = camera.position.distanceTo(new Vector3(x, y, z));
                if (dist > REACH_LIMIT) return;
                if (typeof addCube === 'function') {
                    addCube(x, y, z);
                } else {
                    console.error('addCube is not a function');
                }
            }}
            ref={ref}
        >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial map={groundTexture} />
        </mesh>
    );
};

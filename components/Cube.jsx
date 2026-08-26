import { useBox } from "@react-three/cannon";
import { useThree } from "@react-three/fiber";
import { useState } from "react";
import { Vector3 } from "three";
import * as textures from "@/utils/textures";
import { useStore } from "@/hooks/useStore";

const REACH_LIMIT = 6;

export const Cube = ({ position, texture }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();
  const [ref] = useBox(() => ({
    type: "Static",
    position,
  }));

  const [addCube, removeCube] = useStore((state) => {
    if (!state) {
      console.error("State is undefined");
      return [() => {}, () => {}]; // Return default functions
    }
    return [state.addCube, state.removeCube];
  });

  const activeTexture = textures[texture + "Texture"];

  return (
    <mesh
      onPointerMove={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        const { x, y, z } = ref.current.position;
        const dist = camera.position.distanceTo(new Vector3(x, y, z));
        if (dist > REACH_LIMIT) return;
        const clickedFace = Math.floor(e.faceIndex / 2);
        if (e.altKey) {
          removeCube(x, y, z);
          return;
        }
        if (clickedFace === 0) addCube(x + 1, y, z);
        else if (clickedFace === 1) addCube(x - 1, y, z);
        else if (clickedFace === 2) addCube(x, y + 1, z);
        else if (clickedFace === 3) addCube(x, y - 1, z);
        else if (clickedFace === 4) addCube(x, y, z + 1);
        else if (clickedFace === 5) addCube(x, y, z - 1);
      }}
      ref={ref}
    >
      <boxGeometry attach="geometry" />
      <meshStandardMaterial
        color={isHovered ? "grey" : "white"}
        map={activeTexture}
        transparent={true}
        opacity={texture === "glass" ? 0.6 : 1}
        attach="material"
      />
    </mesh>
  );
};

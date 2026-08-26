"use client";

import { Physics } from "@react-three/cannon";
import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FPV } from "@/components/FPV";
import { Ground } from "@/components/Ground";

export default function BedwarsScene() {
  return (
    <>
      <Canvas>
        <Sky sunPosition={[100, 100, 20]} />
        <ambientLight intensity={0.5} />
        <FPV />
        <Physics>
          <Ground />
        </Physics>
      </Canvas>
      <div className="absolute centered" style={{ pointerEvents: "none" }}>
        <h1 style={{ color: "white", fontSize: "24px", textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
          Bedwars - Coming Soon
        </h1>
      </div>
    </>
  );
}

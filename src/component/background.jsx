import { useTexture } from "@react-three/drei";

export default function Bg() {
     const texture = useTexture("/images/background.jpg");
   
     return (
       <mesh position={[0, 1.5, -4]} scale={[1.2, 1.2, 1.2]}>
         <planeBufferGeometry />
         <meshBasicMaterial map={texture} />
       </mesh>
     );
   }
import React, { useEffect, useState, useMemo } from 'react';
import { useGLTF, useTexture, useFBX, useAnimations } from "@react-three/drei";
import { LineBasicMaterial, MeshPhysicalMaterial, Vector2 } from 'three';
import { LinearEncoding, sRGBEncoding } from 'three/src/constants';
import { MeshStandardMaterial } from "three";
import { useFrame } from '@react-three/fiber';
import createAnimation from '../converter';
import makeSpeech from './makeSpeech'; // Function to call Flask endpoint
import blinkData from '../blendDataBlink.json';
import * as THREE from 'three';
const _ = require("lodash");

export default function Avatar({ avatar_url, speak, setSpeak, text, setAudioSource, playing }) {
    let gltf = useGLTF(avatar_url);
    let morphTargetDictionaryBody = null;
    let morphTargetDictionaryLowerTeeth = null;

    const [
        bodyTexture,
        eyesTexture,
        teethTexture,
        bodySpecularTexture,
        bodyRoughnessTexture,
        bodyNormalTexture,
        teethNormalTexture,
        hairTexture,
        tshirtDiffuseTexture,
        tshirtNormalTexture,
        tshirtRoughnessTexture,
        hairAlphaTexture,
        hairNormalTexture,
        hairRoughnessTexture,
    ] = useTexture([
        "/images/body.webp",
        "/images/eyes.webp",
        "/images/teeth_diffuse.webp",
        "/images/body_specular.webp",
        "/images/body_roughness.webp",
        "/images/body_normal.webp",
        "/images/teeth_normal.webp",
        "/images/h_color.webp",
        "/images/tshirt_diffuse.webp",
        "/images/tshirt_normal.webp",
        "/images/tshirt_roughness.webp",
        "/images/h_alpha.webp",
        "/images/h_normal.webp",
        "/images/h_roughness.webp",
    ]);

    // Configure textures
    _.each([
        bodyTexture,
        eyesTexture,
        teethTexture,
        teethNormalTexture,
        bodySpecularTexture,
        bodyRoughnessTexture,
        bodyNormalTexture,
        tshirtDiffuseTexture,
        tshirtNormalTexture,
        tshirtRoughnessTexture,
        hairAlphaTexture,
        hairNormalTexture,
        hairRoughnessTexture,
    ], t => {
        t.encoding = sRGBEncoding;
        t.flipY = false;
    });

    bodyNormalTexture.encoding = LinearEncoding;
    tshirtNormalTexture.encoding = LinearEncoding;
    teethNormalTexture.encoding = LinearEncoding;
    hairNormalTexture.encoding = LinearEncoding;

    // Traverse GLTF scene and configure materials
    gltf.scene.traverse(node => {
        if (node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
            node.castShadow = true;
            node.receiveShadow = true;
            node.frustumCulled = false;

            if (node.name.includes("Body")) {
                node.material = new MeshPhysicalMaterial();
                node.material.map = bodyTexture;
                node.material.roughness = 1.7;
                node.material.roughnessMap = bodyRoughnessTexture;
                node.material.normalMap = bodyNormalTexture;
                node.material.normalScale = new Vector2(0.6, 0.6);
                morphTargetDictionaryBody = node.morphTargetDictionary;
                console.log("Morph Target Dictionary (Body):", morphTargetDictionaryBody); // Debugging
                node.material.envMapIntensity = 0.8;
            }

            if (node.name.includes("TeethLower")) {
                morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
                console.log("Morph Target Dictionary (TeethLower):", morphTargetDictionaryLowerTeeth); // Debugging
            }

            if (node.name.includes("Eyes")) {
                node.material = new MeshStandardMaterial();
                node.material.map = eyesTexture;
                node.material.roughness = 0.1;
                node.material.envMapIntensity = 0.5;
            }

            if (node.name.includes("Brows")) {
                node.material = new LineBasicMaterial({ color: 0x000000 });
                node.material.linewidth = 1;
                node.material.opacity = 0.5;
                node.material.transparent = true;
                node.visible = false;
            }

            if (node.name.includes("Teeth")) {
                node.material = new MeshStandardMaterial();
                node.material.roughness = 0.1;
                node.material.map = teethTexture;
                node.material.normalMap = teethNormalTexture;
                node.material.envMapIntensity = 0.7;
            }

            if (node.name.includes("Hair")) {
                node.material = new MeshStandardMaterial();
                node.material.map = hairTexture;
                node.material.alphaMap = hairAlphaTexture;
                node.material.normalMap = hairNormalTexture;
                node.material.roughnessMap = hairRoughnessTexture;
                node.material.transparent = true;
                node.material.depthWrite = false;
                node.material.side = 2;
                node.material.color.setHex(0x000000);
                node.material.envMapIntensity = 0.3;
            }

            if (node.name.includes("TSHIRT")) {
                node.material = new MeshStandardMaterial();
                node.material.map = tshirtDiffuseTexture;
                node.material.roughnessMap = tshirtRoughnessTexture;
                node.material.normalMap = tshirtNormalTexture;
                node.material.color.setHex(0xffffff);
                node.material.envMapIntensity = 0.5;
            }
        }
    });

    const [clips, setClips] = useState([]);
    const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), []);

    // Handle speech synthesis and animation creation
    useEffect(() => {
        if (!speak) return;

        makeSpeech(text)
            .then(({ response, audio, visemes }) => {
                console.log("Received visemes from Flask:", visemes); // Debugging

                const audioSrc = `data:audio/wav;base64,${audio}`;
                setAudioSource(audioSrc);

                const newClips = [
                    createAnimation(visemes, morphTargetDictionaryBody, 'HG_Body'),
                    createAnimation(visemes, morphTargetDictionaryLowerTeeth, 'HG_TeethLower'),
                ];

                if (newClips.every(clip => clip)) {
                    setClips(newClips);
                } else {
                    console.error("Failed to create valid animation clips.");
                }
            })
            .catch(err => {
                console.error("Error during speech synthesis:", err);
                setSpeak(false);
            });
    }, [speak]);

    // Play idle and blink animations
    const idleFbx = useFBX('/idle.fbx');
    const { clips: idleClips } = useAnimations(idleFbx.animations);

    useEffect(() => {
        const idleClipAction = mixer.clipAction(idleClips[0]);
        idleClipAction.play();

        const blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
        const blinkAction = mixer.clipAction(blinkClip);
        blinkAction.play();
    }, []);

    // Play viseme-based animations
    useEffect(() => {
        if (!playing) return;

        console.log("Playing animation clips:", clips); // Debugging

        clips.forEach(clip => {
            const clipAction = mixer.clipAction(clip);
            if (clipAction) {
                clipAction.setLoop(THREE.LoopOnce);
                clipAction.play();
            } else {
                console.error("Failed to play animation clip:", clip);
            }
        });
    }, [playing]);

    // Update the mixer
    useFrame((_, delta) => {
        mixer.update(delta);
    });

    return (
        <group name="avatar">
            <primitive object={gltf.scene} dispose={null} />
        </group>
    );
}

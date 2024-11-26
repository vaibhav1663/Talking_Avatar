// Avatar.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useGLTF, useTexture, useFBX, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, MeshPhysicalMaterial, LineBasicMaterial, Vector2, LinearEncoding, sRGBEncoding } from 'three';
import * as THREE from 'three';
import makeSpeech from './makeSpeech';
import _ from 'lodash';
import createAnimation from '../converter';
import blinkData from '../blendDataBlink.json';

const host = 'http://127.0.0.1:5000';

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
      // teethSpecularTexture,
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
      // "/images/teeth_specular.webp",
      "/images/h_color.webp",
      "/images/tshirt_diffuse.webp",
      "/images/tshirt_normal.webp",
      "/images/tshirt_roughness.webp",
      "/images/h_alpha.webp",
      "/images/h_normal.webp",
      "/images/h_roughness.webp",
    ]);
  
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
      hairRoughnessTexture
    ], t => {
      t.encoding = sRGBEncoding;
      t.flipY = false;
    });
  
    bodyNormalTexture.encoding = LinearEncoding;
    tshirtNormalTexture.encoding = LinearEncoding;
    teethNormalTexture.encoding = LinearEncoding;
    hairNormalTexture.encoding = LinearEncoding;
  
  
    gltf.scene.traverse(node => {
  
  
      if (node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
  
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;
  
  
        if (node.name.includes("Body")) {
  
          node.castShadow = true;
          node.receiveShadow = true;
  
          node.material = new MeshPhysicalMaterial();
          node.material.map = bodyTexture;
          // node.material.shininess = 60;
          node.material.roughness = 1.7;
  
          // node.material.specularMap = bodySpecularTexture;
          node.material.roughnessMap = bodyRoughnessTexture;
          node.material.normalMap = bodyNormalTexture;
          node.material.normalScale = new Vector2(0.6, 0.6);
  
          morphTargetDictionaryBody = node.morphTargetDictionary;
  
          node.material.envMapIntensity = 0.8;
          // node.material.visible = false;
  
        }
  
        if (node.name.includes("Eyes")) {
          node.material = new MeshStandardMaterial();
          node.material.map = eyesTexture;
          // node.material.shininess = 100;
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
  
          node.receiveShadow = true;
          node.castShadow = true;
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
  
        if (node.name.includes("TeethLower")) {
          morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
        }
  
      }
  
    });
  
    const [clips, setClips] = useState([]);
  
    const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), []);
  
    useEffect(() => {
  
      if (speak === false)
        return;
  
      makeSpeech(text)
        .then(response => {
  
          let { blendData, filename } = response.data;
          console.log(filename);
          let newClips = [
            createAnimation(blendData, morphTargetDictionaryBody, 'HG_Body'),
            createAnimation(blendData, morphTargetDictionaryLowerTeeth, 'HG_TeethLower')];
  
          filename = host + filename;
  
          setClips(newClips);
          setAudioSource(filename);
  
        })
        .catch(err => {
          console.error(err);
          setSpeak(false);
  
        })
  
    }, [morphTargetDictionaryBody, morphTargetDictionaryLowerTeeth, setAudioSource, setSpeak, speak, text]);
  
    let idleFbx = useFBX('/idle.fbx');
    let { clips: idleClips } = useAnimations(idleFbx.animations);
  
    idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
      return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2");
    });
  
    idleClips[0].tracks = _.map(idleClips[0].tracks, track => {
  
      if (track.name.includes("Head")) {
        track.name = "head.quaternion";
      }
  
      if (track.name.includes("Neck")) {
        track.name = "neck.quaternion";
      }
  
      if (track.name.includes("Spine")) {
        track.name = "spine2.quaternion";
      }
  
      return track;
  
    });
  
    useEffect(() => {
  
      let idleClipAction = mixer.clipAction(idleClips[0]);
      idleClipAction.play();
  
      let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
      let blinkAction = mixer.clipAction(blinkClip);
      blinkAction.play();
  
  
    }, []);
  
    // Play animation clips when available
    useEffect(() => {
  
      if (playing === false)
        return;
  
      _.each(clips, clip => {
        let clipAction = mixer.clipAction(clip);
        clipAction.setLoop(THREE.LoopOnce);
        clipAction.play();
  
      });
  
    }, [clips, mixer, playing]);
  
  
    useFrame((state, delta) => {
      mixer.update(delta);
    });
  
    return (
      <group name="avatar">
        <primitive object={gltf.scene} dispose={null} />
      </group>
    );
  }
  
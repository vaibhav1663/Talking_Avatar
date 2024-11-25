import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader, Environment, OrthographicCamera } from "@react-three/drei";
import ReactAudioPlayer from "react-audio-player";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Avatar from "./component/Avatar";
import Bg from "./component/background";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import makeSpeech from "./component/makeSpeech"; // Updated function for Flask integration

import "./App.css";

const STYLES = {
  area: { position: "absolute", bottom: "0", left: "0", zIndex: 500 },
  speak: {
    padding: "5px",
    display: "block",
    color: "#FFFFFF",
    background: "#222222",
    border: "None",
  },
  label: { color: "#777777", fontSize: "0.5em" },
};

function App() {
  const [chats, setChats] = useState([
    { msg: "Hi there! How can I assist you today?", who: "bot", exct: "0" },
  ]);
  const [text, setText] = useState("Hello I am Joi, your 3D virtual assistant.");
  const [msg, setMsg] = useState("");
  const [exct, setExct] = useState("");
  const [load, setLoad] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visits, setVisits] = useState("--");

  const [speak, setSpeak] = useState(false);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);

  const audioPlayer = useRef();
  const { transcript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const getResponse = async (msg) => {
    if (msg === "") {
      toast.error("Prompt can't be empty.");
      return;
    }
    if (load || speak) {
      toast.error("Already generating response!");
      return;
    }

    setChats((chats) => [...chats, { msg: msg, who: "me" }]);
    setMsg("");
    setLoad(true);

    try {
      const start = new Date(); // Start timing the request
      const { response, audio, visemes } = await makeSpeech(msg);
      const timeTaken = (new Date() - start) / 1000; // Time taken for the request

      setText(response); // Set the AI-generated text
      setSpeak(true); // Trigger the avatar to speak
      setAudioSource(`data:audio/wav;base64,${audio}`); // Set the audio source
      setExct(timeTaken); // Update execution time for display

      setChats((chats) => [
        ...chats,
        { msg: response, who: "bot", exct: timeTaken },
      ]);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setLoad(false);
    }
  };

  const startListening = () => {
    if (browserSupportsSpeechRecognition) {
      SpeechRecognition.startListening();
    } else {
      toast.error("Voice recognition not supported by browser.");
    }
  };

  const stopListening = () => {
    getResponse(msg);
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    setMsg(transcript);
  }, [transcript]);

  const playerEnded = () => {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  };

  const playerReady = () => {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);
    setChats((chats) => [...chats, { msg: text, who: "bot", exct: exct }]);
  };

  useEffect(() => {
    document.querySelector(".chat-box").scrollTop =
      document.querySelector(".chat-box").scrollHeight;
  }, [chats]);

  return (
    <div className="full">
      <ToastContainer
        position="top-left"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div style={STYLES.area}>
        <button style={STYLES.speak}>
          {speak || load ? "Running..." : "Type message."}
        </button>
      </div>
      <div
        className="about"
        onClick={() => {
          setShowModal(!showModal);
        }}
      >
        <img src="./images/icons/menu.png" alt="menu"></img>
      </div>
      <div className="modal" style={{ display: showModal ? "flex" : "none" }}>
        <h1>Prompt 3D</h1>
        <p style={{ marginTop: "10px" }}>
          A ThreeJS-powered virtual human that uses chatGPT and Azure APIs to
          do some face talking
        </p>
        <a
          style={{ padding: "10px" }}
          className="repo"
          href="https://github.com/vaibhav1663/promt3d"
          target="_blank"
          rel="noreferrer"
        >
          Github
        </a>
        <p>Made with ❤️ by</p>
        <a
          href="https://vaibhav1663.github.io/"
          target="_blank"
          rel="noreferrer"
          style={{ marginBlock: "5px" }}
        >
          Vaibhav Khating
        </a>
        <p>
          Visitor's count 👀 :{" "}
          <span style={{ color: "#35a4f3" }}>{visits}</span>
        </p>
      </div>
      <div className="chat-div">
        <div className="chat-box">
          {chats.map((chat, index) => (
            <p key={index} className={chat.who}>
              {chat.msg}
              {chat.who === "bot" && (
                <div className="time">{"generated in " + chat.exct + "s"}</div>
              )}
            </p>
          ))}

          {(load || speak) && !playing && (
            <p
              style={{ padding: "5px", display: "flex", alignItems: "center" }}
            >
              <lottie-player
                src="https://lottie.host/8891318b-7fd9-471d-a9f4-e1358fd65cd6/EQt3MHyLWk.json"
                style={{ width: "50px", height: "50px" }}
                loop
                autoplay
                speed="1.4"
                direction="1"
                mode="normal"
              ></lottie-player>
            </p>
          )}
        </div>
        <div className="msg-box">
          <button
            className="msgbtn"
            id="mic"
            onTouchStart={startListening}
            onMouseDown={startListening}
            onTouchEnd={stopListening}
            onMouseUp={stopListening}
          >
            <img src="./images/icons/mic.png" alt="mic" unselectable="on"></img>
          </button>
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                getResponse(msg);
              }
            }}
            placeholder="Say Hello!"
          ></input>
          <button
            className="msgbtn"
            id="send"
            onClick={() => {
              getResponse(msg);
            }}
          >
            <img src="./images/icons/send.png" alt="send"></img>
          </button>
        </div>
      </div>
      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      <Canvas
        dpr={2}
        onCreated={(ctx) => {
          ctx.gl.physicallyCorrectLights = true;
        }}
      >
        <OrthographicCamera makeDefault zoom={1400} position={[0, 1.65, 1]} />
        <Suspense fallback={null}>
          <Environment
            background={false}
            files="/images/photo_studio_loft_hall_1k.hdr"
          />
        </Suspense>
        <Suspense fallback={null}>
          <Bg />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar
            avatar_url="/model.glb"
            speak={speak}
            setSpeak={setSpeak}
            text={text}
            setAudioSource={setAudioSource}
            playing={playing}
          />
        </Suspense>
      </Canvas>
      <Loader dataInterpolation={(p) => `Loading... please wait`} />
    </div>
  );
}

export default App;



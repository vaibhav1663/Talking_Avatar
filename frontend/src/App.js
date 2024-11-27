import React, { useEffect } from "react";
import Chat from "./component/Chat";
import "./App.css";
import LanguageSelector from "./component/LanguageSelector";
import useLanguageStore from "./component/store/useLanguageStore";
import useLoaderStore from "./component/store/useLoaderStore"; // Import Zustand loader store
import { Experience } from "./component/Experience";
import Loader from "./component/Loader";

function App() {
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const { isLoading, setLoading } = useLoaderStore(); // Zustand loading state

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <>
      {isLoading && <Loader />} {/* Display Loader if loading */}
      <div className={`App ${isLoading ? "hidden" : ""}`}> {/* Hide content while loading */}
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
        />
        <Experience />
        <Chat />
      </div>
    </>
  );
}

export default App;





import Chat from "./component/Chat";
import "./App.css";
import LanguageSelector from "./component/LanguageSelector";
import useLanguageStore from "./component/store/useLanguageStore";
 // Import Zustand store
import { Experience } from "./component/Experience";

function App() {
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  return (
    <div className="App">
       <LanguageSelector
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
      <Experience/>
      {/* Ensure Chat is rendered here */}
      <Chat />
    </div>
  );
}

export default App;


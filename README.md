# Patient Assistant Avatar for Doctor Samir Abbas Hospital

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)  
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/username/repository/actions)  
[![Contributors](https://img.shields.io/badge/contributors-1-blue)](#contributors)  
[![React](https://img.shields.io/badge/frontend-React-blue)](https://reactjs.org/)  
[![Flask](https://img.shields.io/badge/backend-Flask-orange)](https://flask.palletsprojects.com/)  
[![LangChain](https://img.shields.io/badge/AI-LangChain-yellow)](https://www.langchain.com/)

## **Overview**
The Patient Assistant Avatar for Doctor Samir Abbas Hospital is an AI-powered, 3D interactive virtual assistant designed to provide medical assistance through a seamless blend of frontend and backend technologies. The system leverages cutting-edge 3D modeling, conversational AI, and speech synthesis to deliver an engaging and responsive user experience.  

**Frontend Highlights:**  
- Built using **React.js**, **Three.js**, and **React Three Fiber**.  
- Features an expressive avatar capable of lip-syncing with audio responses.  
- Includes a dynamic chat interface with a language selector and speech input widget.  

**Backend Highlights:**  
- Built with **Flask**, **LangChain**, **OpenAI**, **Qdrant**, and **Microsoft Cognitive Services Speech SDK**.  
- Provides text and audio responses powered by a Retrieval-Augmented Generation (RAG) model.  
- Supports avatar lip-syncing via blendshape animations for realistic interactions.

---

## **Table of Contents**
1. [Features](#features)  
2. [Installation](#installation)  
3. [Usage](#usage)  
4. [Project Structure](#project-structure)  
5. [Environment Variables](#environment-variables)  
6. [Contributions](#contributions)  
7. [Future Work](#future-work)  
8. [Developer](#developer)  

---

## **Features**
### **Frontend**  
- **Interactive Avatar**: A 3D assistant rendered using Three.js and React Three Fiber.  
- **Chat System**: A modern interface for user interaction, styled with CSS for responsiveness.  
- **Language Selector**: Allows users to choose their preferred language.  
- **Speech-to-Text Support**: Real-time integration of speech input for seamless communication.  

### **Backend**  
- **RAG Model**: Retrieves and generates accurate responses from a medical database using LangChain and Qdrant.  
- **Audio Responses**: Generates speech using Microsoft Cognitive Services Speech SDK.  
- **Blendshape Animation Data**: Provides facial animations to synchronize the avatar's lips with speech.

---

## **Installation**
### **Frontend Setup**
1. Clone the repository:  
   ```bash
   git clone https://github.com/Doctor-Samir-Abbas-Hospital/Talking_Avatar.git
   cd repository/frontend
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```
3. Start the development server:  
   ```bash
   npm start
   ```

### **Backend Setup**
1. Navigate to the backend directory:  
   ```bash
   cd repository/backend
   ```
2. Create and activate a virtual environment:  
   ```bash
   python -m venv venv
   source venv/bin/activate  # For Linux/Mac
   venv\Scripts\activate     # For Windows
   ```
3. Install dependencies:  
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the environment variables in the `.env` file:
   ```
   QDRANT_HOST=<your_qdrant_host>
   QDRANT_API_KEY=<your_qdrant_api_key>
   OPENAI_API_KEY=<your_openai_api_key>
   QDRANT_COLLECTION_NAME=<your_qdrant_collection_name>
   SPEECH_KEY=<your_speech_key>
   SPEECH_REGION=<your_speech_region>
   ```
5. Run the Flask app:  
   ```bash
   python app.py
   ```

---

## **Usage**
1. Start both the frontend and backend servers.
2. Access the application on `http://localhost:3000` for the frontend interface.
3. Interact with the chat widget, send text queries, or use the speech input for voice interactions.
4. Observe avatar responses, lip-sync animations, and audio playback.

---

## **Project Structure**
### **Frontend**
```
src/
├── components/
│   ├── Avatar.jsx
│   ├── Chat.jsx
│   ├── Chat.css
│   ├── Background.jsx
│   ├── ChatInputWidget.jsx
│   ├── ChatInputWidget.css
│   ├── LanguageSelector.jsx
│   ├── LanguageSelector.css
│   ├── Experience.jsx
|   ├── Loader.jsx
|   ├── Loader.css
│   ├── makeSpeech.jsx
│   └── store/
│       ├── useLanguageStore.js
|       ├── useLoaderStore.js
│       └── useSpeechStore.js
├── App.js
└── App.css
```

### **Backend**
```
backend/
├── app.py
├── Template/
│   ├── blendshape_names.py
│   └── promptAI.py
├── requirements.txt
└── .env
```

---

## **Environment Variables**
The backend requires specific environment variables for integration:  
- **QDRANT_HOST**: URL of the Qdrant server.  
- **QDRANT_API_KEY**: API key for accessing Qdrant.  
- **OPENAI_API_KEY**: API key for OpenAI models.  
- **QDRANT_COLLECTION_NAME**: Name of the Qdrant collection.  
- **SPEECH_KEY**: Key for Microsoft Cognitive Services Speech SDK.  
- **SPEECH_REGION**: Region for the Microsoft Cognitive Services Speech SDK.

---

## **Contributions**
We invite developers, AI enthusiasts, and 3D modeling experts to contribute to this project.  

### **Focus Area**
- **Backend-Frontend Integration**: Seamlessly integrate the backend-generated audio and blendshape data with the frontend avatar. The goal is to achieve perfect synchronization between audio playback and lip movements.  
- **Optimization**: Enhance the performance and scalability of the avatar for real-world use.  

### **How to Contribute**
1. Fork the repository.  
2. Create a new branch:  
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push to your branch.  
4. Submit a pull request with a detailed description of your contribution.

---

## **Future Work**
- Improve avatar realism with advanced facial animations.  
- Integrate multilingual support across both backend and frontend.  
- Add a user authentication system for personalized interactions.  
- Deploy the system on a scalable cloud infrastructure.  

---

## **Developer**
**Mohammed Bahageel**  
Artificial Intelligence Developer based in Saudi Arabia.  

For inquiries or collaboration, please contact via:  
- **Email**: [Email](mailto:m.bahageel88@gmail.com)  
- **GitHub**: [github](https://github.com/Datascientist88)


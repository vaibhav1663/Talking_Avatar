from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.vectorstores.qdrant import Qdrant
import qdrant_client
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from Template.promptAI import AI_prompt
import azure.cognitiveservices.speech as speechsdk
import base64
import asyncio
import os
import orjson

# Load environment variables
load_dotenv()

# Initialize Flask App
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # Allow CORS for specific origin

# Azure Speech SDK Configuration
speech_key = os.getenv("SPEECH_KEY")
service_region = os.getenv("SPEECH_REGION")

# Qdrant Vector Store Configuration
collection_name = os.getenv("QDRANT_COLLECTION_NAME")

# Global chat history
chat_history = []

# Initialize vector store
def get_vector_store():
    client = qdrant_client.QdrantClient(
        url=os.getenv("QDRANT_HOST"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )
    embeddings = OpenAIEmbeddings()
    vector_store = Qdrant(
        client=client,
        collection_name=collection_name,
        embeddings=embeddings,
    )
    return vector_store

vector_store = get_vector_store()

# Preinitialize components for performance optimization
llm = ChatOpenAI()
retriever = vector_store.as_retriever()

# Prebuild retriever chain
retriever_prompt = ChatPromptTemplate.from_messages([
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    ("user", "Generate a search query based on the conversation."),
])
retriever_chain = create_history_aware_retriever(llm, retriever, retriever_prompt)

# Prebuild conversational RAG chain
conversational_prompt = ChatPromptTemplate.from_messages([
    ("system", AI_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
])
stuff_documents_chain = create_stuff_documents_chain(llm, conversational_prompt)
conversation_rag_chain = create_retrieval_chain(retriever_chain, stuff_documents_chain)

# Initialize Azure Speech Synthesizer
speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
speech_config.speech_synthesis_voice_name = "en-US-AndrewMultilingualNeural"  # Set default voice
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)


# TTS function to synthesize response and generate viseme data
def synthesize_response(text):
    visemes = []

    def viseme_callback(evt):
        visemes.append([evt.audio_offset / 10000, evt.viseme_id])

    # Attach viseme callback
    synthesizer.viseme_received.connect(viseme_callback)

    # Synthesize text to speech
    result = synthesizer.speak_text_async(text).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # Get audio data and encode it in base64
        audio_data = base64.b64encode(result.audio_data).decode("utf-8")
        return {
            "audio": audio_data,
            "visemes": visemes,
        }
    else:
        return {"error": "Synthesis failed"}


# Efficient JSON response helper
def jsonify_fast(data):
    return app.response_class(response=orjson.dumps(data), mimetype="application/json")


# RAG endpoint
@app.route('/generate', methods=['POST'])
async def generate():
    user_input = request.json.get('input')  # Ensure key matches React component

    # Update chat history
    chat_history.append(HumanMessage(content=user_input))

    # Use the prebuilt conversational RAG chain
    response = await asyncio.to_thread(conversation_rag_chain.invoke, {
        "chat_history": chat_history,
        "input": user_input,
    })

    response_content = response.get("answer", "")
    chat_history.append(AIMessage(content=response_content))

    # Generate audio and viseme data for the response
    audio_response = await asyncio.to_thread(synthesize_response, response_content)

    # Return response as JSON
    return jsonify_fast({
        "response": response_content,
        "audio": audio_response.get("audio"),
        "visemes": audio_response.get("visemes"),
    })


# Run Flask App
if __name__ == '__main__':
    app.run(debug=True, threaded=True)

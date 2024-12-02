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
from azure.cognitiveservices.speech import  SpeechConfig, SpeechSynthesizer, AudioConfig, SpeechSynthesisOutputFormat
import base64
import os
import orjson
import json
from Template.blendshape_names import blendshape_names

# Load environment variables
load_dotenv()

# Initialize Flask App
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Azure Speech SDK Configuration
speech_key = os.getenv("SPEECH_KEY")
service_region = os.getenv("SPEECH_REGION")

# Qdrant Vector Store Configuration
collection_name = os.getenv("QDRANT_COLLECTION_NAME")

# Global chat history
chat_history = []

# Function to initialize vector store
def get_vector_store():
    try:
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
        print("Successfully connected to Qdrant vector store.")
        return vector_store
    except Exception as e:
        print(f"Error initializing vector store: {e}")
        raise

# Initialize vector store
vector_store = get_vector_store()

# Function to create the context retriever chain
def get_context_retriever_chain(vector_store=vector_store):
    try:
        llm = ChatOpenAI()
        retriever = vector_store.as_retriever()
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            ("user", "Generate a search query based on the conversation."),
        ])
        retriever_chain = create_history_aware_retriever(llm, retriever, prompt)
        print("Context retriever chain created successfully.")
        return retriever_chain
    except Exception as e:
        print(f"Error creating context retriever chain: {e}")
        raise

# Function to create the conversational RAG chain
def get_conversational_rag_chain(retriever_chain):
    try:
        llm = ChatOpenAI()
        prompt = ChatPromptTemplate.from_messages([
            ("system", AI_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
        ])
        stuff_documents_chain = create_stuff_documents_chain(llm, prompt)
        print("Conversational RAG chain created successfully.")
        return create_retrieval_chain(retriever_chain, stuff_documents_chain)
    except Exception as e:
        print(f"Error creating conversational RAG chain: {e}")
        raise

# Initialize Azure Speech Synthesizer
speech_config = SpeechConfig(subscription=speech_key, region=service_region)
speech_config.speech_synthesis_voice_name = "en-US-JennyMultilingualNeural"
speech_config.set_speech_synthesis_output_format(SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3)

synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=None)

# TTS function to synthesize response and generate viseme + blendshape data
def synthesize_response(text):
    if not text or not isinstance(text, str):
        print("Invalid text passed to synthesize_response.")
        return {"audio": None, "blendshapes": []}

    blendshapes = []
    time_step = 1 / 60  # 60 FPS
    time_stamp = 0

    ssml_template = '''
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
        xmlns:mstts="http://www.w3.org/2001/mstts"
        xml:lang="en-US">
        <voice name="{voice_name}">
            <mstts:viseme type="FacialExpression"/>
            {text}
        </voice>
    </speak>
    '''
    ssml = ssml_template.format(voice_name=speech_config.speech_synthesis_voice_name, text=text)
    print(f"Generated SSML: {ssml}")  # Log SSML for debugging

    def viseme_callback(event):
        nonlocal time_stamp
        animation = json.loads(event.animation)
        for blend_array in animation.get("BlendShapes", []):
            blend = {blendshape_names[i]: blend_array[i] for i in range(len(blendshape_names))}
            blendshapes.append({"time": time_stamp, "blendshapes": blend})
            time_stamp += time_step

    synthesizer.viseme_received.connect(viseme_callback)
    result = synthesizer.speak_ssml_async(ssml).get()

    if result.reason == result.reason.SynthesizingAudioCompleted: 
        audio_data = base64.b64encode(result.audio_data).decode("utf-8")
        print(time_stamp)
        audio_duration_seconds = result.audio_duration.total_seconds()
        print(f"Audio length: {audio_duration_seconds} seconds")
        return {
            "audio": audio_data,
            "blendshapes": blendshapes,
        }
    else:
        print(f"Speech synthesis failed: {result.reason}")
        return {"audio": None, "blendshapes": []}

# Efficient JSON response helper
def jsonify_fast(data):
    return app.response_class(response=orjson.dumps(data), mimetype="application/json")

# RAG endpoint
@app.route('/generate', methods=['POST'])
async def generate():
    user_input = request.json.get('input')

    global chat_history
    if chat_history is None:
        chat_history = []

    chat_history.append(HumanMessage(content=user_input))

    try:
        # Dynamically initialize vector store
        vector_store = get_vector_store()

        # Generate context retriever chain
        retriever_chain = get_context_retriever_chain(vector_store)

        # Generate conversational RAG chain
        conversation_rag_chain = get_conversational_rag_chain(retriever_chain)

        # Generate response
        response = conversation_rag_chain.invoke({
            "chat_history": chat_history,
            "input": user_input,
        })

        response_content = response.get("answer", "")
        chat_history.append(AIMessage(content=response_content))

        # Generate audio and blendshape data for the response
        audio_response = synthesize_response(response_content)

        return jsonify_fast({
            "text": response_content,
            "audio": audio_response.get("audio"),
            "blendshapes": audio_response.get("blendshapes"),
        })

    except Exception as e:
        print(f"Error during processing: {e}")
        return jsonify_fast({"error": "An error occurred while generating the response."}), 500

# Global error handler
@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Unhandled exception: {e}")
    return jsonify_fast({"error": "Internal server error"}), 500

# Run Flask App
if __name__ == '__main__':
    app.run(debug=True)







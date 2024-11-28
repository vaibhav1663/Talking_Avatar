from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.vectorstores.qdrant import Qdrant
import qdrant_client
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import (
    create_history_aware_retriever,
    create_retrieval_chain,
)
from langchain.chains.combine_documents import create_stuff_documents_chain
from Template.promptAI import AI_prompt
import azure.cognitiveservices.speech as speechsdk
import base64
import asyncio
import os
import orjson
import json
from Template.blendshape_names import blendshape_names  # Import blendshape names from Python file

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
llm = ChatOpenAI(model='gpt-4o')
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
speech_config.speech_synthesis_voice_name = "en-US-EmmaMultilingualNeural"
speech_config.set_speech_synthesis_output_format(
    speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
)

synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)

# TTS function to synthesize response and generate viseme + blendshape data
def synthesize_response(text):
    visemes = []
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
    ssml = ssml_template.format(
        voice_name=speech_config.speech_synthesis_voice_name,
        text=text
    )

    def viseme_callback(evt):
        nonlocal time_stamp
        try:
            animation_data = json.loads(evt.animation)
            for blend_array in animation_data.get("BlendShapes", []):
                blend = {blendshape_names[i]: blend_array[i] for i in range(len(blendshape_names))}
                blendshapes.append({"time": time_stamp, "blendshapes": blend})
                time_stamp += time_step
        except Exception as e:
            print(f"Error in viseme_callback: {e}")

    synthesizer.viseme_received.connect(viseme_callback)
    result = synthesizer.speak_ssml_async(ssml).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        audio_data = base64.b64encode(result.audio_data).decode("utf-8")
        return {"audio": audio_data, "blendshapes": blendshapes}
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
    chat_history.append(HumanMessage(content=user_input))
    response = await asyncio.to_thread(conversation_rag_chain.invoke, {
        "chat_history": chat_history,
        "input": user_input,
    })
    response_content = response.get("answer", "")
    chat_history.append(AIMessage(content=response_content))
    audio_response = await asyncio.to_thread(synthesize_response, response_content)
    return jsonify_fast({
        "text": response_content,
        "audio": audio_response.get("audio"),
        "blendshapes": audio_response.get("blendshapes"),
    })

# Run Flask App
if __name__ == '__main__':
    app.run(debug=True, threaded=True)






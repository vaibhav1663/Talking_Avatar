import axios from "axios";

const host = "http://127.0.0.1:5000"; // Base URL for Flask backend

/**
 * Fetches audio, visemes, and AI response from the Flask backend.
 * @param {string} text - The input text to synthesize.
 * @returns {Promise<{response: string, audio: string, visemes: Array}>} - The AI response, base64-encoded audio, and viseme data.
 */
const makeSpeech = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Input text is required and must be a string.");
    }

    console.log("Sending text to Flask:", text);

    // Send POST request to Flask endpoint
    const response = await axios.post(`${host}/generate`, { input: text });

    if (response?.data) {
      const { response: aiResponse, audio, visemes } = response.data;

      // Debug logs for received data
      console.log("Received AI Response:", aiResponse);
      console.log("Received Audio (base64):", audio ? "[Audio Data Present]" : "No audio");
      console.log("Received Visemes:", visemes);

      if (!aiResponse || !audio || !visemes) {
        throw new Error("Incomplete data received from the backend.");
      }

      return { response: aiResponse, audio, visemes };
    } else {
      throw new Error("No data received from the Flask backend.");
    }
  } catch (error) {
    console.error("Error in makeSpeech:", error.message);
    throw error; // Rethrow the error to handle in the calling component
  }
};

export default makeSpeech;


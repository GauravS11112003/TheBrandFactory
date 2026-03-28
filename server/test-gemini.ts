import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyCjkDiMQuqFixqHU3DqNRL46eq52_eBsyk";
const genAI = new GoogleGenerativeAI(key);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
run();

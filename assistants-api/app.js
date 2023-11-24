import * as dotenv from "dotenv";
import { OpenAI } from "openai";
import fs from "fs";


dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Upload files
const file = await openai.files.create({
    file: fs.createReadStream("NDIS Pricing Arrangements and Price Limits 2023-24 v1.1.pdf"),
    purpose: "assistants",
});



const assistant = await openai.beta.assistants.create({
    name: "Decode NDIS",
    instructions: "You are an assistant that will accurate match item or activity descriptions for NDIS participants to the most applicable NDIS codes. Along with this you will provide the price caps, and other relevant information from the context including any outlying rules that may be important for the participant.",
    tools: [{
        type: "retrieval",
    }],
    model: "gpt-4-1106-preview",
    file_ids: [file.id]
})

import React, { useState } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";



function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const llm = new ChatOpenAI({ openAIApiKey });

  const codeTemplate = 'Match the most applicable NDIS code based on this activity or item description: {itemDesc}';
  const prompt = PromptTemplate.fromTemplate(codeTemplate)

  console.log(prompt)

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    // TODO: Add ChatGPT API Integration here
    // For now, we'll just display the input text
    setDecodedText(inputText);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Decode NDIS</h1>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          placeholder="Enter or paste the invoice text here"
        />
        <button onClick={handleSubmit}>Decode</button>
        <p>Decoded NDIS Code:</p>
        <p>{decodedText}</p>
      </header>
    </div>
  );
}

export default App;


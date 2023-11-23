import React, { useState, useEffect } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";

// import { CSVLoader } from "langchain/document_loaders/fs/csv";


function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const llm = new ChatOpenAI({ openAIApiKey });

  const codeTemplate = 'Match the most applicable NDIS code based on this activity or item description: {itemDesc}';
  const codePrompt = PromptTemplate.fromTemplate(codeTemplate)

  const codeChain = codePrompt.pipe(llm)

 

  useEffect(() => {
    // load data from csv file
    // const loader = new CSVLoader("./ndis-src-docs/NDIS-Catalogue.csv");
    // loader.load().then((data) => {
    //   console.log(data);
    // });
  }
  , []);



  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      console.log('Testing API call');
      const response = await codeChain.invoke({ itemDesc: inputText });
      console.log(response.content)
      setDecodedText(response.content);
    } catch (error) {
      // Handle errors from the API call
      console.error('Error calling API:', error);
    }
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


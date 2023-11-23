import React, { useState, useEffect } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const embeddings = new OpenAIEmbeddings({ openAIApiKey });
  const sbApiKey = process.env.REACT_APP_SUPABASE_API_KEY;
  const sbUrl = process.env.REACT_APP_SUPABASE_URL;
  const client = createClient(sbUrl, sbApiKey);

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });

  const retriever = vectorStore.asRetriever();


  const llm = new ChatOpenAI({ openAIApiKey });

  const codeTemplate = 'Match the most applicable NDIS code based on this activity or item description: {itemDesc}';
  const codePrompt = PromptTemplate.fromTemplate(codeTemplate);

  const answerTemplate = `You are a reasonably serious assistant bot given an item or activity description and asked to find the most applicable NDIS code. 
  Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I'm unable to find a suitable NDIS code for this item or activity. 
  Please visit the NDIS website for more information or contact us at help@decodendis.com"
  context: {context}
  question: {question}
  answer:
  `;

  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

  const combineDocuments = (docs) => {
    return docs.map((doc) => doc.pageContent).join("\n\n");
  }

  const parser = new StringOutputParser();

  const codeChain = codePrompt.pipe(llm).pipe(parser).pipe(retriever).pipe(combineDocuments);


  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      console.log('Testing API call');
      const response = await codeChain.invoke({ itemDesc: inputText });
      console.log(response)
      // setDecodedText(response);

      // const response2 = await retriever.invoke('What code to use for community access on a weekday?');
      // console.log(response2)
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


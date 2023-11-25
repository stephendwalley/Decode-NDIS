import React, { useState } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

import { SupabaseHybridSearch } from "langchain/retrievers/supabase";

function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;


  const embeddings = new OpenAIEmbeddings({ openAIApiKey });
  const sbApiKey = process.env.REACT_APP_SUPABASE_API_KEY;
  const sbUrl = process.env.REACT_APP_SUPABASE_URL;
  const client = createClient(sbUrl, sbApiKey);


  const retriever = new SupabaseHybridSearch(embeddings, {
    client,
    similarityK: 20,
    keywordK: 6,
    tableName: "documents",
    similarityQueryName: "match_documents",
    keywordQueryName: "kw_match_documents",
  });

  const llm = new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4"
  });

  const answerTemplate = `Given an item or activity description find the most suitable NDIS code. 
  Find the answer based on the context provided. Only select items from Support Category Number "5" or "1". If there are none available say there are none in this category.
  Unless specified, assume the activity is 1 on 1 hourly on a weekday with normal intensity. 
  Respond in the form: Item Code:\n Description: \nPrice Cap\n: Rules\n In the case of multiple options, provide the other options with the same format. Order the options in terms of which is most likely to be the correct option.
  context: {context}
  question: {question}
  answer:
  `;

  const combineDocuments = (docs) => {
    return docs.map((doc) => {
      const {
        'Detailed Description': _,
        'Support Item Name': __,
        'Registration Group Name': ___,
        'NT': ____,
        'SA': _____,
        'WA': ______,
        'NSW': _______,
        'QLD': ________,
        'TAS': _________,
        'ACT': __________,
        'Detailed Item Description': ___________,
        ...restOfMetadata
      } = doc.metadata;
      const formattedMetadata = Object.entries(restOfMetadata).map(([key, value]) => `${key}: ${value}`).join('\n');
      return `${doc.pageContent}\n\n\n${formattedMetadata}`;
    }).join("\n\n");
  }

  const parser2 = new StringOutputParser();

  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

  const retrieverChain = RunnableSequence.from([
    prevResult => `${prevResult.original_input.itemDesc}`,
    retriever,
    combineDocuments,
    (docs) => {
      console.log(docs);
      return docs;
    }
  ]);

  const answerChain = answerPrompt.pipe(llm).pipe(parser2)


  const chain = RunnableSequence.from([
    {
      original_input: new RunnablePassthrough()
    },
    {
      context: retrieverChain,
      question: ({ original_input }) => original_input.itemDesc
    },
    answerChain
  ])

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      console.log('Testing API call');
      const response = await chain.invoke({ itemDesc: inputText });
      console.log(response)
      setDecodedText(response);
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


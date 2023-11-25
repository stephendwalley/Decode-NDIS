import React, { useState, useEffect } from 'react';
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
  const [chain, setChain] = useState(null);

  useEffect(() => {
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
    Find the answer based on the context provided. Only select items that are from either of the Support Category Number "4", "1", "2", "3". They don't have to be from all, just must be from one of the options given.
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

    setChain(chain);
  }, []);



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
    <div className="h-full bg-gray-100 bg-cover flex flex-col items-center justify-center">
      <h1 className="font-sans text-6xl font-extrabold text-teal-600 text-center">Decode NDIS</h1>
      <textarea
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter or paste the invoice text here"
        className="h-64 w-1/2 p-4 my-4 bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm resize-none mx-auto block text-center text-gray-500 font-semibold placeholder-gray-500 placeholder-opacity-50 focus:placeholder-opacity-75 focus:placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-teal-500"
      />
      <button
        onClick={handleSubmit}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mx-auto block text-center w-1/2 my-4 font-semibold focus:ring-opacity-50 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out hover:bg-teal-700 hover:shadow-lg"
      >Decode</button>
      <p
        className="text-center text-gray-500 text-sm"
      >Decoded NDIS Code:</p>
      <p
        className="text-center text-gray-500 text-md font-semibold my-4 w-1/2 mx-auto"
      >{decodedText}</p>
    </div>
  );
}

export default App;


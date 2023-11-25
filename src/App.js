import React, { useState, useEffect } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import OpenAI from "openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

import { SupabaseHybridSearch } from "langchain/retrievers/supabase";

import logo from './Decode_NDIS.png';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [chain, setChain] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

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
    Respond in the form: Item Code:\n Description: \nPrice Cap\n Rules\n In the case of multiple options, provide the other options with the same format. Order the options in terms of which is most likely to be the correct option.
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



  // Modify the submit handler to send the file or text to the OpenAI API
  const handleSubmit = async () => {
    if (uploadedFile) {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result.split(',')[1]; // Remove the data URL prefix

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };

        const payload = {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract the invoice items and their descriptions along with the price charged, quantity and total for each line item.' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        };

        try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });
          const openaiResponse = response.data.choices[0].message.content;
          console.log(openaiResponse);
          const chainResponse = await chain.invoke({ itemDesc: openaiResponse });
          console.log(chainResponse);
          setDecodedText(chainResponse);
        } catch (error) {
          console.error(error);
        }
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      try {
        console.log('Testing API call');
        const response = await chain.invoke({ itemDesc: inputText });
        console.log(response)
        setDecodedText(response);
      } catch (error) {
        // Handle errors from the API call
        console.error('Error calling API:', error);
      }
    }
  };

  const handleFileUpload = (e) => {
    setUploadedFile(e.target.files[0]);
  };

  return (
    <div className="h-full bg-gray-100 bg-cover flex flex-col items-center justify-center">
      {/* <h1 className="font-sans text-6xl font-extrabold text-teal-600 text-center pt-5">Decode NDIS</h1> */}
      <img src={logo} className="h-32" alt="Tailwind Play" />
      <div
        className={`h-16 w-1/2 p-4 my-4 bg-white rounded focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-md resize-none mx-auto block text-center text-gray-500 font-semibold placeholder-gray-500 placeholder-opacity-50 focus:placeholder-opacity-75 focus:placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-teal-500 ${uploadedFile ? 'border-none shadow-none bg-opacity-50' : 'border border-gray-300 shadow-sm'}`}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded" className="h-full w-full object-cover" />
            <p className="text-center">{uploadedFile.name}</p>
          </>
        ) : (
          <button
            onClick={() => document.getElementById('file-upload').click()}
            className="w-full h-full text-center font-semibold"
          >
            {uploadedFile ? <><strong>Upload successful:</strong> {uploadedFile.name}</> : 'Click to upload your invoice'}
          </button>
        )}
        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          style={{ display: 'none' }} // Hide the file input element
        />
      </div>
      <textarea
        value={inputText}
        onChange={handleInputChange}
        placeholder="Or, enter invoice text here"
        className="h-1/6 w-1/2 p-4 my-4 bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-md resize-none mx-auto block text-center text-gray-500 font-semibold placeholder-gray-500 placeholder-opacity-50 focus:placeholder-opacity-75 focus:placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-teal-500"
      />

      <button
        onClick={handleSubmit}
        className="flex justify-center items-center px-6 py-3 border border-transparent text-center rounded-md shadow-sm text-white bg-customColor hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mx-auto block w-1/2 my-4 font-semibold focus:ring-opacity-50 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out hover:bg-teal-700 hover:shadow-lg text-lg"
      >Decode</button>
      <p
        className="text-center text-gray-500 text-lg font-bold my-4 w-1/2 mx-auto"
      >Decoded NDIS Code:</p>
      <div className="max-h-64 overflow-auto scrollbar scrollbar-thumb-gray-500 scrollbar-thumb-rounded scrollbar-track-gray-200 pb-5 mx-auto w-1/2  mb-1">
        <p className="text-center text-gray-500 text-md font-semibold my-4 w-full">
          {decodedText.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line.startsWith('Item Code:') ? <strong>{line}</strong> : line}
              <br />
            </React.Fragment>
          ))}
        </p>
      </div>
      <p className="text-center text-gray-500 text-sm font-normal w-1/2 mx-auto pt-5 fixed inset-x-0 bottom-2">
        The information supplied is taken directly from the Support Catalogue and NDIS Pricing Arrangements and Price Limits provided by the NDIS. Decode NDIS take no responsibility or liability for its accuracy.
      </p>
    </div>
  );
}

export default App;


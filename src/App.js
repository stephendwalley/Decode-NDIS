import React, { useState, useEffect } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

import { SupabaseHybridSearch } from "langchain/retrievers/supabase";

import Modal from 'react-modal';

import logo from './Decode_NDIS.png';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState([]);
  const [chain, setChain] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const imageUrl = null;

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(Array.from({ length: 15 }, (_, i) => (i + 1).toString()));

  const [selectedItem, setSelectedItem] = useState(null);


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

    const answerTemplate = `Given an item or activity description find the most suitable NDIS code or codes.
    Find the answer based on the context provided.
    Unless specified, assume the activity is 1 on 1 hourly on a weekday with normal intensity. 
    Respond in the form: Option # Item Code:\n Description: \nPrice Cap: $x \n Rules: \n\n In the case of multiple options, provide the other options with the same format. Order the options in terms of which is most likely to be the correct option. Do not provide other details or formatting.
    context: {context}
    question: {question}
    answer:
    `;

    const combineDocuments = (docs) => {
      return docs
        // .filter(doc => selectedCategories.map(String).includes(doc.metadata['Support Category Number']))
        .map((doc) => {
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
        support_category_number: () => selectedCategories.join(','),
        question: ({ original_input }) => original_input.itemDesc,

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
                { type: 'text', text: 'Extract the invoice items and their descriptions along with the price charged, quantity and total for each line item. Seperate each line item with a new line. If only one line item, just give that line item and provide no further information. In the form: Item #/n Description: /n Quantity: /n Unit Price: /n Line Total: /n' },
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

          const items = openaiResponse.split('\n\n');
          console.log(items)



          let combinedResponse = '';
          let combinedDecodedText = [];

          for (let item of items) {
            const chainResponse = await chain.invoke({ itemDesc: item });

            const chainResponseSplit = chainResponse.split('\n\n');

            // Extract information from gpt and retrieval response and store in an object
            const chainResponseItemObjects = chainResponseSplit.map(split => {
              const lines = split.split('\n');
              const itemCodeMatch = lines[0].match(/Item Code: (\S+)/);
              const itemCode = itemCodeMatch ? itemCodeMatch[1] : null;
              const description = lines[1].replace('Description: ', '');
              const priceCap = parseFloat(lines[2].replace(/[^0-9.]/g, ''));

              // Create an object for the current item
              return { itemCode, description, priceCap };
            });

            console.log(chainResponseItemObjects);

            // Extrac information from image response
            const linesProv = item.split('\n');
            const descriptionProv = linesProv[1].replace(/Description: /, '');
            const quantity = parseFloat(linesProv[2].replace(/[^0-9.]/g, ''));
            const unitPrice = parseFloat(linesProv[3].replace(/[^0-9.]/g, ''));
            const amount = parseFloat(linesProv[4].replace(/[^0-9.]/g, ''));

            const informationProvObject = { descriptionProv, quantity, unitPrice, amount };

            // Combine the two objects
            const combinedResponseObject = { ...chainResponseItemObjects[0], ...informationProvObject, alternativeChoices: chainResponseItemObjects.slice(1) };
            console.log(combinedResponseObject);

            combinedDecodedText.push(combinedResponseObject);
          }

          // setDecodedText(combinedResponse);
          setDecodedText(combinedDecodedText);
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

  const handleCategoryChange = (event) => {
    const { value, checked } = event.target;
    setSelectedCategories(prevState => checked ? [...prevState, value] : prevState.filter(category => category !== value));
  };


  const handleItemClick = (item) => {
    // If the clicked item is already selected, hide its alternative codes
    if (selectedItem === item) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };



  Modal.setAppElement('#root');

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
      <button onClick={() => setModalIsOpen(true)} className="underline text-gray-500 hover:text-gray-800 mx-auto block w-1/2 my-4 font-semibold">Select your plan categories (optional)</button>

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={{ content: { width: '30%', margin: '0 auto', position: 'absolute', top: '30%', bottom: '30%' }, overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)' } }}>
        <button onClick={() => setModalIsOpen(false)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600 hover:text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <form>
          <h2 className="text-center text-gray-700 font-semibold mb-4 text-xl">Select the available plan categories</h2>
          {Array.from({ length: 15 }, (_, i) => i + 1).map(number => (
            <div key={number} className="flex items-center space-x-4">
              <input type="checkbox" id={`category-${number}`} value={number} onChange={handleCategoryChange} checked={selectedCategories.includes(number.toString())} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4" />
              <label htmlFor={`category-${number}`} className="font-medium text-gray-700">Category {number}</label>
            </div>
          ))}
        </form>
      </Modal>
      <button
        onClick={handleSubmit}
        className="flex justify-center items-center px-6 py-3 border border-transparent text-center rounded-md shadow-sm text-white bg-customColor hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mx-auto block w-1/2 my-4 font-semibold focus:ring-opacity-50 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out hover:bg-teal-700 hover:shadow-lg text-lg"
      >Decode</button>
      <div className="max-h-64 overflow-auto scrollbar scrollbar-thumb-gray-500 scrollbar-thumb-rounded scrollbar-track-gray-200 pb-5 mx-auto w-1/2 mb-1 pt-3">
        {decodedText.map((item, index) => (
          <div key={index}>
            <p className="text-lg font-bold text-gray-500"><strong>Item Code:</strong> {item.itemCode}</p>
            <p className="text-lg text-gray-500"><strong>Description:</strong> {item.descriptionProv}</p> 
            <p className="text-lg text-gray-500"><strong>Unit Price:</strong> ${item.unitPrice}</p>
            <p className="text-lg text-gray-500"><strong>Price Cap:</strong> ${item.priceCap}</p>
            <p className="text-lg text-gray-500"><strong>Quantity:</strong> {item.quantity}</p>
            <p className="text-lg text-gray-500"><strong>Amount:</strong> ${item.amount}</p>
            {item.alternativeChoices && item.alternativeChoices.length > 0 && (
              <button
                className="underline text-gray-500 hover:text-gray-800 mx-auto block w-1/2 my-4 font-semibold"
                onClick={() => handleItemClick(item)}>
                {selectedItem === item ? 'Hide' : 'Show'} Alternative Codes
              </button>
            )}
            <br />
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="max-h-64 overflow-auto scrollbar scrollbar-thumb-gray-500 scrollbar-thumb-rounded scrollbar-track-gray-200 pb-5 mx-auto w-1/2 mb-1 pt-3">
          <h2 className="text-lg font-bold text-gray-500">Alternative Choices</h2>
          {selectedItem.alternativeChoices.map((choice, index) => (
            <div key={index}>
              <p className="text-lg font-bold text-gray-500"><strong>Item Code:</strong> {choice.itemCode}</p>
              <p className="text-lg text-gray-500"><strong>Description:</strong> {choice.description}</p>
              <p className="text-lg text-gray-500"><strong>Price Cap:</strong> ${choice.priceCap}</p>
              <br />
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-gray-500 text-sm font-normal w-1/2 mx-auto pt-5 fixed inset-x-0 bottom-2">
        The information supplied is taken directly from the Support Catalogue and NDIS Pricing Arrangements and Price Limits provided by the NDIS. Decode NDIS take no responsibility or liability for its accuracy.
      </p>
    </div>
  );
}

export default App;


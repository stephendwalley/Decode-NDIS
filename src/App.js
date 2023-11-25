import React, { useState } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore, SupabaseFilterRPCCall } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"
import { SupabaseTranslator } from "langchain/retrievers/self_query/supabase";

import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { OpenAI } from "langchain/llms/openai";

function App() {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;


  const attributeInfo = [
    {
      name: "Code",
      description: "The code of the item",
      type: "text",
    },
    {
      name: "Support Item Name",
      description: "The name of the item",
      type: "text",
    },
    {
      name: "Registration Group Name",
      description: "The registration group name",
      type: "text",
    },
    {
      name: "Support Category Number",
      description: "The support category number",
      type: "text",
    },
    {
      name: "Support Category Name",
      description: "The support category name",
      type: "text",
    },
    {
      name: "Unit",
      description: "The unit",
      type: "text",
    },
    {
      name: "Quote",
      description: "The quote",
      type: "text",
    },
    {
      name: "ACT",
      description: "The ACT price cap",
      type: "text",
    },
    {
      name: "NSW",
      description: "The NSW price cap",
      type: "text",
    },
    {
      name: "NT",
      description: "The NT price cap",
      type: "text",
    },
    {
      name: "QLD",
      description: "The QLD price cap",
      type: "text",
    },
    {
      name: "SA",
      description: "The SA price cap",
      type: "text",
    },
    {
      name: "TAS",
      description: "The TAS price cap",
      type: "text",
    },
    {
      name: "VIC",
      description: "The VIC price cap",
      type: "text",
    },
    {
      name: "WA",
      description: "The WA price cap",
      type: "text",
    },
    {
      name: "Remote",
      description: "The remote price cap",
      type: "text",
    },
    {
      name: "Very Remote",
      description: "The very remote price cap",
      type: "text",
    },
    {
      name: "Non-Face-to-Face Support Provision",
      description: "The non-face-to-face support provision allowance",
      type: "text",
    },
    {
      name: "Provider Travel",
      description: "The provider travel allowance",
      type: "text",
    },
    {
      name: "Short Notice Cancellations.",
      description: "The short notice cancellations allowance",
      type: "text",
    },
    {
      name: "NDIA Requested Reports",
      description: "The NDIA requested reports allowance",
      type: "text",
    },
    {
      name: "Irregular SIL Supports",
      description: "The irregular SIL supports allowance",
      type: "text",
    },
    {
      name: "Type",
      description: "The type of item",
      type: "text",
    },
    {
      name: "Detailed Item Description",
      description: "The detailed item description",
      type: "text",
    },
  ];


  const embeddings = new OpenAIEmbeddings({ openAIApiKey });
  const sbApiKey = process.env.REACT_APP_SUPABASE_API_KEY;
  const sbUrl = process.env.REACT_APP_SUPABASE_URL;
  const client = createClient(sbUrl, sbApiKey);
  // const llm = new OpenAI();

  // const vectorStore = new SupabaseVectorStore(embeddings, {
  //   client,
  //   tableName: "documents",
  //   queryName: "match_documents",
  // });

  // const getRelevantDocuments = async (docs) => {
  //   const vectorStore = await SupabaseVectorStore.fromDocuments(docs, embeddings, {
  //     client,
  //     tableName: "documents",
  //     queryName: "match_documents",
  //   });

  //   const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
  //     llm,
  //     vectorStore,
  //     attributeInfo,
  //     structuredQueryTranslator: new SupabaseTranslator(),
  //   });

  //   const query1 = await selfQueryRetriever.getRelevantDocuments(
  //     "Which movies are less than 90 minutes?"
  //   );
  //   console.log(query1);
  // };

  // const retriever = vectorStore.asRetriever();

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

  // const combineDocuments = (docs) => {
  //   return docs.map((doc) => doc.pageContent).join("\n\n");
  // }
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
  // const customQuestion = "Given an item description and the assumption that the activity is 1 on 1 hourly on a weekday with normal intensity unless otherwise specified, match the item description to the most suitable NDIS code. Additionally, find the price caps associated with that specific NDIS code."

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
      // getRelevantDocuments();
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


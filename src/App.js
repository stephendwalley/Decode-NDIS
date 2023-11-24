import React, { useState } from 'react';
import './App.css';

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";


import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { StringOutputParser } from "langchain/schema/output_parser";

import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

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


  const llm = new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4"
  });

  // const standaloneQuestionTemplate = 'Convert to a standalone question, What NDIS code matches the activity or item from Item Description: {itemDesc} standalone_question:';
  // const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

  const answerTemplate = `Given an item or activity description find the most suitable NDIS code. 
  Find the answer based on the context provided.
  Respond with the item code which best matches. Unless specified, assume the activity is 1 on 1 hourly on weekday with normal intensity. 
  Respond in the form: Item Code:\n Description: \nPrice Cap\n: Rules\n In the case of multiple options, provide the other options with the same format. Order the options in terms of which is most likely to be the correct option.
  context: {context}
  question: {question}
  answer:
  `;

  const combineDocuments = (docs) => {
    return docs.map((doc) => doc.pageContent).join("\n\n");
  }

  const parser = new StringOutputParser();
  const parser2 = new StringOutputParser();

  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

  // const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(parser);

  // const retrieverChain = RunnableSequence.from([
  //   prevResult => prevResult.standalone_question,
  //   retriever,
  //   combineDocuments
  // ]);

  const customQuestion = "Given an item description and the assumption that the activity is 1 on 1 hourly on a weekday with normal intensity unless otherwise specified, match the item description to the most suitable NDIS code. Additionally, find the price caps associated with that specific NDIS code."

  const retrieverChain = RunnableSequence.from([
    prevResult => `${customQuestion} ${prevResult.original_input.itemDesc}`,
    retriever,
    combineDocuments
  ]);

  const answerChain = answerPrompt.pipe(llm).pipe(parser2)


  // const chain = RunnableSequence.from([
  //   {
  //     standalone_question: standaloneQuestionChain,
  //     original_input: new RunnablePassthrough()
  //   },
  //   {
  //     context: retrieverChain,
  //     question: ({ original_input }) => original_input.question
  //   },
  //   answerChain
  // ])

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


import { CSVLoader } from "langchain/document_loaders/fs/csv";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import 'dotenv/config'

try {
    const loader = new CSVLoader("ndis-src-docs/NDIS-Catalogue.csv");

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter();

    const output = await splitter.splitDocuments(docs);

    //console.log(output);

    const sbApiKey = process.env.SUPABASE_API_KEY;
    const sbUrl = process.env.SUPABASE_URL;
    const openAIApiKey = process.env.OPENAI_API_KEY;

    const client = createClient(sbUrl, sbApiKey);

    await SupabaseVectorStore.fromDocuments(
        output,
        new OpenAIEmbeddings({ openAIApiKey }),
        {
            client,
            tableName: "documents",
        }
    );

} catch (e) {
    console.log(e);
}


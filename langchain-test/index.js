import { CSVLoader } from "langchain/document_loaders/fs/csv";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

try {
    const loader = new CSVLoader("ndis-src-docs/NDIS-Catalogue.csv");

    const docs = await loader.load();
    
    const splitter = new RecursiveCharacterTextSplitter();
    
    const output = await splitter.splitDocuments(docs);

    console.log(output);

    const sbApiKey = process.env.SUPABASE_API_KEY;
    const sbUrl = process.env.SUPABASE_URL;
    const openAIApiKey = process.env.OPENAI_API_KEY;

    
    
} catch (e) {
    console.log(e);
}


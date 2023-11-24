import { CSVLoader } from "langchain/document_loaders/fs/csv";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import 'dotenv/config'

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// Loads pdf and CSV file
// try {
//     const loader = new DirectoryLoader(
//         "ndis-src-docs",
//         {
//             ".pdf": (path) => new PDFLoader(path),
//             ".csv": (path) => new CSVLoader(path),
//         }
//     );
//     const docs = await loader.load();
//     // console.log({ docs });
//     const splitter = new RecursiveCharacterTextSplitter();

//     const output = await splitter.splitDocuments(docs);

//     //console.log(output);

//     const sbApiKey = process.env.SUPABASE_API_KEY;
//     const sbUrl = process.env.SUPABASE_URL;
//     const openAIApiKey = process.env.OPENAI_API_KEY;

//     const client = createClient(sbUrl, sbApiKey);

//     await SupabaseVectorStore.fromDocuments(
//         output,
//         new OpenAIEmbeddings({
//             openAIApiKey,
//         }),
//         {
//             client,
//             tableName: "documents",
//         }
//     );

// } catch (e) {
//     console.log(e);
// }



// // CSV loader
// try {
//     const loader = new CSVLoader("ndis-src-docs/NDIS-Catalogue.csv");

//     const docs = await loader.load();

//     const splitter = new RecursiveCharacterTextSplitter();

//     const output = await splitter.splitDocuments(docs);

//     //console.log(output);

//     const sbApiKey = process.env.SUPABASE_API_KEY;
//     const sbUrl = process.env.SUPABASE_URL;
//     const openAIApiKey = process.env.OPENAI_API_KEY;

//     const client = createClient(sbUrl, sbApiKey);

//     await SupabaseVectorStore.fromDocuments(
//         output,
//         new OpenAIEmbeddings({ openAIApiKey }),
//         {
//             client,
//             tableName: "documents",
//         }
//     );

//     // Upload second document set

// } catch (e) {
//     console.log(e);
// }

// PDF loader
try {
    const loader = new CSVLoader("ndis-src-docs/output_sheet.csv");

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

    // Upload second document set

} catch (e) {
    console.log(e);
}


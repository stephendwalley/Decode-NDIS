import { CSVLoader } from "langchain/document_loaders/fs/csv";

import { RecursiveCharacterTextSplitter, CharacterTextSplitter } from "langchain/text_splitter";


import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import 'dotenv/config'

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import { Document } from "langchain/document";
import fs from 'fs';
import csv from 'csv-parser';


// PDF loader
try {
    // Define the columns we want to embed vs which ones we want in metadata
    const columns_to_embed = ["Support Item Name", "Registration Group Name", "Detailed Item Description"];
    const columns_to_metadata = ["Code", "Support Item Name", "Registration Group Name", "Support Category Number", "Support Category Name", "Unit", "Quote", "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA", "Remote", "Very Remote", "Non-Face-to-Face Support Provision", "Provider Travel", "Short Notice Cancellations.", "NDIA Requested Reports", "Irregular SIL Supports", "Type", "Detailed Item Description"];

    // const loader = new CSVLoader({
    //     filePath: "ndis-src-docs/output_sheet.csv",
    //     pageContentColumns: columns_to_embed,
    //     metadataColumns: columns_to_metadata
    // });

    // const docs = await loader.load();

    // console.log(docs[0]);

    const docs = [];

    fs.createReadStream('ndis-src-docs/output_sheet.csv')
        .pipe(csv())
        .on('data', (row) => {
            const to_metadata = {};
            const values_to_embed = {};

            // Include the columns specified in columns_to_embed in values_to_embed
            for (const column of columns_to_embed) {
                if (row.hasOwnProperty(column)) {
                    values_to_embed[column] = row[column];
                }
            }

            // Include the columns specified in columns_to_metadata in to_metadata
            for (const column of columns_to_metadata) {
                if (row.hasOwnProperty(column)) {
                    to_metadata[column] = row[column];
                }
            }

            // Join the values_to_embed into a single string
            const to_embed = Object.entries(values_to_embed)
                .map(([key, value]) => `${key.trim()}: ${value.trim()}`)
                .join('\n');

            // Create a new Document and append it to docs
            const newDoc = new Document({ pageContent: to_embed, metadata: to_metadata });
            docs.push(newDoc);
        })
        .on('end', () => {
            console.log(docs[0].metadata["Code"]);
            console.log(docs[0].pageContent);
        });

    // create new docs with the page content as the text and extract the metadata from the columns for metadata for each row
    // const new_docs = [];
    // for (const doc of docs) {
    //     // console.log(doc)
    //     const new_doc = new Document({ pageContent: doc.pageContent, metadata: { Code: doc.pageContent.Code } });
    //     console.log(new_doc.pageContent)
    // }


    // const splitter = new RecursiveCharacterTextSplitter();

    // const output = await splitter.splitDocuments(docs);

    // //console.log(output);

    // const sbApiKey = process.env.SUPABASE_API_KEY;
    // const sbUrl = process.env.SUPABASE_URL;
    // const openAIApiKey = process.env.OPENAI_API_KEY;

    // const client = createClient(sbUrl, sbApiKey);

    // await SupabaseVectorStore.fromDocuments(
    //     output,
    //     new OpenAIEmbeddings({ openAIApiKey }),
    //     {
    //         client,
    //         tableName: "documents",
    //     }
    // );

    // Upload second document set

} catch (e) {
    console.log(e);
}


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

// // PDF loader
// try {
//     const loader = new CSVLoader("ndis-src-docs/output_sheet.csv");

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


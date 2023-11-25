import { CSVLoader } from "langchain/document_loaders/fs/csv";

import { RecursiveCharacterTextSplitter, CharacterTextSplitter } from "langchain/text_splitter";


import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { AttributeInfo } from "langchain/schema/query_constructor";
import { Document } from "langchain/document";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { FunctionalTranslator } from "langchain/retrievers/self_query/functional";
import { SupabaseTranslator } from "langchain/retrievers/self_query/supabase";

import 'dotenv/config';

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

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
            (async () => {
                // console.log(docs[0].metadata["Code"]);
                // console.log(docs[0].pageContent);
                // const splitter = new RecursiveCharacterTextSplitter();
                // const documents = await splitter.splitDocuments(docs);
                // console.log(documents)
                const sbApiKey = process.env.SUPABASE_PRIVATE_KEY;
                const sbUrl = process.env.SUPABASE_URL;
                const openAIApiKey = process.env.OPENAI_API_KEY;

                const client = createClient(sbUrl, sbApiKey);

                await SupabaseVectorStore.fromDocuments(
                    docs,
                    new OpenAIEmbeddings({ openAIApiKey }),
                    {
                        client,
                        tableName: "documents",
                    }
                );
            })();
        });



    // Split the document using Character splitting.



    //     /**
    //     * Next, we define the attributes we want to be able to query on.
    //     * in this case, we want to be able to query on the genre, year, director, rating, and length of the movie.
    //     * We also provide a description of each attribute and the type of the attribute.
    //     * This is used to generate the query prompts.
    //     */
    //     const attributeInfo = [
    //         {
    //             name: "Code",
    //             description: "The code of the item",
    //             type: "text",
    //         },
    //         {
    //             name: "Support Item Name",
    //             description: "The name of the item",
    //             type: "text",
    //         },
    //         {
    //             name: "Registration Group Name",
    //             description: "The registration group name",
    //             type: "text",
    //         },
    //         {
    //             name: "Support Category Number",
    //             description: "The support category number",
    //             type: "text",
    //         },
    //         {
    //             name: "Support Category Name",
    //             description: "The support category name",
    //             type: "text",
    //         },
    //         {
    //             name: "Unit",
    //             description: "The unit",
    //             type: "text",
    //         },
    //         {
    //             name: "Quote",
    //             description: "The quote",
    //             type: "text",
    //         },
    //         {
    //             name: "ACT",
    //             description: "The ACT price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "NSW",
    //             description: "The NSW price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "NT",
    //             description: "The NT price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "QLD",
    //             description: "The QLD price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "SA",
    //             description: "The SA price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "TAS",
    //             description: "The TAS price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "VIC",
    //             description: "The VIC price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "WA",
    //             description: "The WA price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "Remote",
    //             description: "The remote price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "Very Remote",
    //             description: "The very remote price cap",
    //             type: "text",
    //         },
    //         {
    //             name: "Non-Face-to-Face Support Provision",
    //             description: "The non-face-to-face support provision allowance",
    //             type: "text",
    //         },
    //         {
    //             name: "Provider Travel",
    //             description: "The provider travel allowance",
    //             type: "text",
    //         },
    //         {
    //             name: "Short Notice Cancellations.",
    //             description: "The short notice cancellations allowance",
    //             type: "text",
    //         },
    //         {
    //             name: "NDIA Requested Reports",
    //             description: "The NDIA requested reports allowance",
    //             type: "text",
    //         },
    //         {
    //             name: "Irregular SIL Supports",
    //             description: "The irregular SIL supports allowance",
    //             type: "text",
    //         },
    //         {
    //             name: "Type",
    //             description: "The type of item",
    //             type: "text",
    //         },
    //         {
    //             name: "Detailed Item Description",
    //             description: "The detailed item description",
    //             type: "text",
    //         },
    //     ];


    //     /**
    //  * Next, we instantiate a vector store. This is where we store the embeddings of the documents.
    //  */
    //     if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PRIVATE_KEY) {
    //         throw new Error(
    //             "Supabase URL or private key not set. Please set it in the .env file"
    //         );
    //     }

    //     const embeddings = new OpenAIEmbeddings();
    //     const documentContents = "Data for each NDIS code";
    //     const llm = new OpenAI();
    //     const client = createClient(
    //         process.env.SUPABASE_URL,
    //         process.env.SUPABASE_PRIVATE_KEY
    //     );
    //     const vectorStore = await SupabaseVectorStore.fromDocuments(docs, embeddings, {
    //         client,
    //         tableName: "documents",
    //     });
    //     const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
    //         llm,
    //         vectorStore,
    //         documentContents,
    //         attributeInfo,
    //         structuredQueryTranslator: new SupabaseTranslator(),
    //     });


    // const query1 = await selfQueryRetriever.getRelevantDocuments(
    //     "What is the price cap for daily community access on a weekday in VIC?"
    // );

    // console.log(query1)

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


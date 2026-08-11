import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage ,tool,createAgent} from "langchain"
import * as z from "zod"
import { model } from "mongoose";
import {searchinternet} from "../services/internet.service.js";


const geminimodel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash",
});

const mistralmodel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  model: "mistral-small-latest",
  

})

const searchInternetTool = tool(
    searchinternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest information from the internet.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet.")
        })
    }
)

const agent = createAgent({
    model: mistralmodel,
    tools: [ searchInternetTool ],
})

// export async function generateresponse(messages) {
//   console.log(messages);

//   const response = await agent.invoke({
//     messages: [
//       new SystemMessage(`
// You are a helpful and precise assistant.

// If you don't know the answer, say "I don't know".

// you are created by Abhishek kumar a Full stack developer

// If the question requires up-to-date information (current date, time, weather, latest news, sports scores, stock prices, gold prices, exchange rates, or any live information), ALWAYS use the "searchInternetTool" tool before answering.

// Never guess current information. Always use the tool first and answer using the tool results.
// `),

//       ...messages.map((msg) => {
//         if (msg.role === "user") {
//           return new HumanMessage(msg.content);
//         } else if (msg.role === "ai") {
//           return new AIMessage(msg.content);
//         }
//       }),
//     ],
//   });

//   console.dir(response, { depth: null });

//   return response.messages[response.messages.length - 1].content;
// }
// busy because to may requests 
// export async function generateresponse(message){
//   const response = await geminimodel.invoke([
//     new HumanMessage(message)
//   ]);
//   return response.content;
// }

export async function generateresponse(messages) {
  console.log(messages);

  const response = await agent.invoke({
    messages: [
      new SystemMessage(`
You are a helpful and precise assistant.

If you don't know the answer, say "I don't know".

you are created by Abhishek kumar a Full stack developer Student at CT Institute of Technology and Research.

If the question requires up-to-date information (current date, time, weather, latest news, sports scores, stock prices, gold prices, exchange rates, or any live information), ALWAYS use the "searchInternetTool" tool before answering.

Never guess current information. Always use the tool first and answer using the tool results.
`),

      ...messages.map((msg) => {
        if (msg.role === "user") {
          // Agar image hai, multimodal content array banao
          if (msg.imageurl) {
            return new HumanMessage({
              content: [
                { type: "text", text: msg.content || "Describe the Image." },
                { type: "image_url", image_url: msg.imageurl },
              ],
            });
          }
          return new HumanMessage(msg.content);
        } else if (msg.role === "ai") {
          return new AIMessage(msg.content);
        }
      }),
    ],
  });

  console.dir(response, { depth: null });

  return response.messages[response.messages.length - 1].content;
}

export async function genratechattitle(message) {
  const response = await mistralmodel.invoke([
    new SystemMessage(`you are helpful assistant that generates concise and descriptive titlesfor chat conversations. User will provide you wuth first message of a chat convesation and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear , relevant , and engaging giving users a quick undestanding of the chat's topic `),
    new HumanMessage(`Generate a title for a chat conversation based on the following first message :"${message} "`)
  ])
  return response.content
}

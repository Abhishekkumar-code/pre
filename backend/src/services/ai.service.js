import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain"
import * as z from "zod"
import { searchinternet } from "../services/internet.service.js";
import { sendEmail } from "./mail.service.js";
import { queryVectorStore } from "./vectorstore.services.js";

const geminimodel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash",
  timeout: 60000,
});

const mistralmodel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  model: "mistral-large-latest",
  timeout: 60000,
})

const sendemail = tool(
  sendEmail, {
    name: "sendEmail",
    description: "use these tool to send the email to someone ",
    schema: z.object({
      to: z.string().email().describe("recipient's email address"),
      subject: z.string().describe("subject of the email"),
      html: z.string().describe("HTML content of the email"),
      text: z.string().describe("plain text content of the email")
    })
  }
)

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

function createSearchDocumentTool(chatId) {
  return tool(
    async ({ query }) => {
      const results = await queryVectorStore(chatId, query, 4);
      if (!results.length) {
        return "No relevant information found in the uploaded document.";
      }
      return results.map(r => `[${r.source}] ${r.text}`).join("\n\n");
    },
    {
      name: "searchDocument",
      description:
        "Use this tool to search inside the PDF document(s) the user uploaded in this chat, whenever the question could relate to that document's content.",
      schema: z.object({
        query: z.string().describe("The search query to look up in the uploaded document."),
      }),
    }
  );
}

const agentCache = new Map();

function getAgentForChat(chatId) {
  const key = chatId?.toString() || "no-chat";
  if (agentCache.has(key)) return agentCache.get(key);

  const tools = [searchInternetTool, sendemail];
  if (chatId) tools.push(createSearchDocumentTool(chatId));

  const agent = createAgent({ model: mistralmodel, tools });
  agentCache.set(key, agent);
  return agent;
}

export function invalidateAgentCache(chatId) {
  agentCache.delete(chatId?.toString());
}

export async function generateresponse(messages, chatId) {
  console.log(messages);

  const agent = getAgentForChat(chatId);

  const response = await agent.invoke({
    messages: [
      new SystemMessage(`
You are a helpful and precise assistant.

If you don't know the answer, say "I don't know".

you are created by Abhishek kumar a Full stack developer Student at CT Institute of Technology and Research.

IF anyone ask to send and email or email send to sendemail tool activate and send the email to the recipient.

If the question requires up-to-date information (current date, time, weather, latest news, sports scores, stock prices, gold prices, exchange rates, or any live information), ALWAYS use the "searchInternetTool" tool before answering.

If the user's question could relate to a document they uploaded in this chat, ALWAYS use the "searchDocument" tool first to check for relevant content before answering.

Never guess current information. Always use the tool first and answer using the tool results.
`),

      ...messages.map((msg) => {
        if (msg.role === "user") {
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
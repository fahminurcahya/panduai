import { INSERT_MESSAGE } from "@/graphql/mutations/mutations";
import {
  GET_CHATBOT_BY_ID,
  GET_MESSAGE_BY_CHAT_SESSION_ID,
} from "@/graphql/queries/queries";
import { serverClient } from "@/lib/server/serverClient";
import {
  GetChatbotByIdResponse,
  MessagesByChatSessionIdResponse,
} from "@/types/type";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { chat_session_id, chatbot_id, content, name } = await req.json();
  console.log(
    `Receive message from chat session ${chat_session_id} : ${content} (chatbot: ${chatbot_id})`
  );
  try {
    // Step 1: fetch chatbot characteristics
    const { data } = await serverClient.query<GetChatbotByIdResponse>({
      query: GET_CHATBOT_BY_ID,
      variables: { id: chatbot_id },
    });

    const chatbot = data.chatbots;

    if (!chatbot) {
      return NextResponse.json(
        {
          error: "Chatbot not found",
        },
        {
          status: 404,
        }
      );
    }

    // step 2: fetch previeous message
    const { data: messagesData } =
      await serverClient.query<MessagesByChatSessionIdResponse>({
        query: GET_MESSAGE_BY_CHAT_SESSION_ID,
        variables: { chat_session_id },
        fetchPolicy: "no-cache",
      });

    const previeousMessages = messagesData.chat_sessions.message;

    const formattedPreviousMessages: ChatCompletionMessageParam[] =
      previeousMessages.map((message) => ({
        role: message.sender === "ai" ? "system" : "user",
        name: message.sender === "ai" ? "system" : name,
        content: message.content,
      }));

    // combine characteritics into a system prompt
    const systemPrompt = chatbot.chatbot_characteristics
      .map((c) => c.content)
      .join(" + ");

    console.log(systemPrompt);

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        name: "system",
        content: `You are a helpul assistant talking to ${name}. If a generic question is asked witch is not relevant or in the same scope or domain as the points
                in mentioned in the key information section, kindly inform the user theyre only allowed to search for the specified content. use Emoji's where possible. 
                Here is some key information that you need to be aware of, these are elements you may be asked about: ${systemPrompt}`,
      },
      ...formattedPreviousMessages,
      {
        role: "user",
        name: name,
        content: content,
      },
    ];

    // step 3 : send the message to OpenAI's completions API
    const openaiResponse = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
    });

    const aiResponse = openaiResponse?.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 500 }
      );
    }

    // step 4: save the user's message in the database
    await serverClient.mutate({
      mutation: INSERT_MESSAGE,
      variables: { chat_session_id, content, sender: "user" },
    });

    // step 5: Save the AI's response in the database
    const aiMessageResult = await serverClient.mutate({
      mutation: INSERT_MESSAGE,
      variables: { chat_session_id, content: aiResponse, sender: "ai" },
    });

    return NextResponse.json({
      id: aiMessageResult.data.insertMessages.id,
      content: aiResponse,
    });
  } catch (error) {
    console.error("Error sending message: ", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

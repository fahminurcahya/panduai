import client from "@/graphql/apolloClient";
import {
  INSERT_CHAT_SESSION,
  INSERT_GUEST,
  INSERT_MESSAGE,
} from "@/graphql/mutations/mutations";
import { gql } from "@apollo/client";

export async function startNewChat(
  guestName: string,
  guestEmail: string,
  chatbotId: number
) {
  try {
    const guestResult = await client.mutate({
      mutation: INSERT_GUEST,
      variables: { name: guestName, email: guestEmail },
    });
    const guestId = guestResult.data.insertGuests.id;

    // Initialize a new chat session
    const chatSessionResult = await client.mutate({
      mutation: INSERT_CHAT_SESSION,
      variables: { chatbot_id: chatbotId, guest_id: guestId },
    });
    const chatSessionId = chatSessionResult.data.insertChat_session.id;

    // 3.Insert initial message
    await client.mutate({
      mutation: INSERT_MESSAGE,
      variables: {
        chat_session_id: chatSessionId,
        sender: "ai",
        // change this for the dynamic message we want to send in backend
        content: `Welcome ${guestName}!\n How can I assist you today?`,
      },
    });

    return chatSessionId;
  } catch (error) {
    console.error("Error starting new chat session", error);
  }
}

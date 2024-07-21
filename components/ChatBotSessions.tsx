"use client";

import { Chatbot } from "@/types/type";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import Avatar from "./Avatar";
import Link from "next/link";
import ReactTimeago from "react-timeago";

const ChatBotSessions = ({ chatbots }: { chatbots: Chatbot[] }) => {
  const [sortedChatbots, setSortedChatbots] = useState<Chatbot[]>(chatbots);
  useEffect(() => {
    const sortedArray = [...chatbots].sort(
      (a, b) => b.chat_sessions.length - a.chat_sessions.length
    );
    setSortedChatbots(sortedArray);
  }, [chatbots]);
  return (
    <div className="bg-white">
      <Accordion type="single" collapsible>
        {sortedChatbots.map((chatbot) => {
          const hasSessions = chatbot.chat_sessions.length > 0;
          return (
            <AccordionItem
              key={chatbot.id}
              value={`item-${chatbot.id}`}
              className="px-10 py-5"
            >
              {hasSessions ? (
                <>
                  <AccordionTrigger>
                    <div className="flex text-left items-center w-full">
                      <Avatar seed={chatbot.name} className="size-10 mr-4" />
                      <div>
                        <p>{chatbot.name}</p>
                        <p className="pr-4 font-bold text-right">
                          {chatbot.chat_sessions.length} sessions
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {chatbot.chat_sessions.map((session) => (
                      <Link
                        href={`/review-sessions/${session.id}`}
                        key={session.id}
                        className="relative p-10 bg-[#2991EE] text-white rounded-md block"
                      >
                        <p className="text-lg font-bold">
                          {session.guest?.name || "Anonymous"}
                        </p>
                        <p className="text-lg font-bold">
                          {session.guest?.email || "No Email Provided"}
                        </p>
                        <p className="absolute top-5 right-5 text-sm">
                          <ReactTimeago date={new Date(session.created_at)} />
                        </p>
                      </Link>
                    ))}
                  </AccordionContent>
                </>
              ) : (
                <p>{chatbot.name} (No Session)</p>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default ChatBotSessions;

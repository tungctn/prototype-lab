"use client";

import type { ReactNode } from "react";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { StreamingText } from "@/components/ai/streaming-text";
import { TextResponse } from "@/components/ai/text-response";
import { ThinkingReasoning } from "@/components/ai/thinking-reasoning";

type ChatTurnProps = {
  role: "user" | "assistant" | "system";
  title?: string;
  content?: string;
  streaming?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
  avatar?: ReactNode;
  thinkingLines?: string[];
  variant?: "default" | "chatgpt";
};

export function ChatTurn({
  role,
  title,
  content = "",
  streaming = false,
  footer,
  children,
  avatar,
  thinkingLines,
  variant = "default",
}: ChatTurnProps) {
  const isUser = role === "user";
  const showBubble = content.length > 0 || streaming;
  const isChatGpt = variant === "chatgpt";

  if (isChatGpt && !isUser) {
    return (
      <Message align="start">
        <MessageContent className="mx-auto w-full max-w-[75ch] gap-3">
          {showBubble ? (
            <TextResponse className="wrap-break-word">
              {streaming && !content ? (
                <ThinkingReasoning thoughts={thinkingLines} thinking />
              ) : (
                <StreamingText text={content} streaming={streaming} />
              )}
            </TextResponse>
          ) : null}
          {children}
          {footer ? <MessageFooter className="px-0">{footer}</MessageFooter> : null}
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message align={isUser ? "end" : "start"}>
      {!isUser && avatar ? <MessageAvatar>{avatar}</MessageAvatar> : null}
      <MessageContent>
        {!isChatGpt && title ? <MessageHeader>{title}</MessageHeader> : null}
        {showBubble ? (
          <Bubble
            align={isUser ? "end" : "start"}
            variant={isChatGpt && isUser ? "muted" : isUser ? "secondary" : "outline"}
          >
            <BubbleContent
              className={
                isChatGpt && isUser
                  ? "rounded-[1.35rem] border-0 bg-[oklch(0.94_0.006_255)] px-4 py-2.5 leading-6 text-foreground"
                  : undefined
              }
            >
              {streaming && !content ? (
                <ThinkingReasoning thoughts={thinkingLines} thinking />
              ) : (
                <TextResponse>
                  <StreamingText text={content} streaming={streaming} />
                </TextResponse>
              )}
            </BubbleContent>
          </Bubble>
        ) : null}
        {children}
        {footer ? <MessageFooter>{footer}</MessageFooter> : null}
      </MessageContent>
    </Message>
  );
}

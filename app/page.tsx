"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import Link from "next/link";

// ===== Schema =====
const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

// 🔹 Helper to build the welcome message
const makeWelcomeMessage = (): UIMessage => ({
  id: `welcome-${Date.now()}`,
  role: "assistant",
  parts: [
    {
      type: "text",
      text: WELCOME_MESSAGE,
    },
  ],
});

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const { messages, sendMessage, status, stop, setMessages } = useChat();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show welcome message once per load
  useEffect(() => {
    if (isClient && !welcomeMessageShownRef.current) {
      setMessages([makeWelcomeMessage()]);
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, setMessages]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prev) => ({
      ...prev,
      [key]: duration,
    }));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    setMessages([makeWelcomeMessage()]);
    setDurations({});
    toast.success("New analysis started");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#FAF7F2] text-[#0F1111] font-sans">
      {/* AWS-style floating panel */}
      <main className="w-full flex justify-center px-3">
        <div className="w-full max-w-md rounded-3xl shadow-xl overflow-hidden bg-white border border-gray-200">
          {/* Gradient header like AWS widget */}
          <div className="bg-gradient-to-r from-[#4C6FFF] to-[#8A2EFF] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-white/40">
                  <AvatarImage src="/sellersight-logo.png" />
                  <AvatarFallback>SS</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Ask SellerSight</span>
                  <span className="text-[11px] opacity-90">
                    Get data-backed insights from Amazon reviews.
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-xs text-white"
                type="button"
                onClick={clearChat}
                title="Start new analysis"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Input bar INSIDE header, like AWS screenshot */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-4"
              id="chat-form"
            >
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="sr-only">Message</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Ask a question about your ASIN or category…"
                          className="h-10 w-full rounded-full border border-white/60 bg-white text-xs text-[#0F1111] pl-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
                          disabled={status === "streaming"}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                        {(status === "ready" || status === "error") && (
                          <Button
                            type="submit"
                            disabled={!field.value.trim()}
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8 rounded-full bg-[#232F3E] hover:bg-[#111827] text-white shadow"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        )}
                        {(status === "streaming" || status === "submitted") && (
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => stop()}
                            className="absolute right-1 top-1 h-8 w-8 rounded-full bg-white/80 text-[#0F1111]"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>

          {/* Body: messages + subtle loader + footer */}
          <div className="flex flex-col bg-white">
            {/* Suggested quick-start buttons (optional, AWS-like) */}
            <div className="px-5 pt-4 pb-2 space-y-2 text-xs text-[#374151] border-b border-gray-100">
              <p className="font-medium text-[11px] uppercase tracking-wide text-[#6B7280]">
                Want help getting started?
              </p>
              <div className="flex flex-col gap-2">
                <QuickStartButton
                  label="Analyze my product's reviews"
                  prompt="Help me analyze reviews for my Amazon product and show top complaints and strengths."
                  onClick={(text) => form.setValue("message", text)}
                />
                <QuickStartButton
                  label="Compare with a competitor ASIN"
                  prompt="Compare my ASIN to a close competitor based on Amazon reviews and highlight gaps."
                  onClick={(text) => form.setValue("message", text)}
                />
                <QuickStartButton
                  label="Find key issues hurting my rating"
                  prompt="From recent reviews, identify the top issues hurting my star rating and how to fix them."
                  onClick={(text) => form.setValue("message", text)}
                />
              </div>
            </div>

            {/* Messages area */}
            <div className="max-h-[430px] overflow-y-auto px-5 py-4">
              {isClient ? (
                <>
                  <MessageWall
                    messages={messages}
                    status={status}
                    durations={durations}
                    onDurationChange={handleDurationChange}
                  />
                  {status === "submitted" && (
                    <div className="flex justify-start max-w-3xl w-full mt-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center w-full py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Tiny footer like AWS widget */}
            <div className="border-t border-gray-100 px-5 py-3 text-[11px] text-gray-500 flex justify-between items-center">
              <span>© {new Date().getFullYear()} {OWNER_NAME}</span>
              <span className="space-x-1">
                <Link href="/terms" className="underline">
                  Terms
                </Link>
                <span>·</span>
                <Link href="https://ringel.ai" className="underline">
                  Powered by Ringel.AI
                </Link>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Small helper for the quick-start buttons
function QuickStartButton({
  label,
  prompt,
  onClick,
}: {
  label: string;
  prompt: string;
  onClick: (prompt: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="w-full rounded-xl border border-[#D1D5DB] bg-gradient-to-r from-[#E5F0FF] to-[#F5E8FF] px-3 py-2 text-left text-[11px] font-medium text-[#111827] hover:border-[#A5B4FC] hover:shadow-sm transition"
    >
      {label}
    </button>
  );
}

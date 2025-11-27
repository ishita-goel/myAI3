"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square, MessageCircle } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
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
  parts: [{ type: "text", text: WELCOME_MESSAGE }],
});

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

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
    setDurations((prev) => ({ ...prev, [key]: duration }));
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
    // FULL-SCREEN APP: sidebar + main chat pane
    <div className="flex h-screen bg-[#FAF7F2] text-[#0F1111] font-sans">
      {/* ============= LEFT SIDEBAR (GPT-style) ============= */}
      <aside className="hidden md:flex w-64 flex-col bg-[#111827] text-white">
        {/* Brand header */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-white/10">
            <AvatarImage src="/sellersight-logo.png" />
            <AvatarFallback>SS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              SellerSight
            </span>
            <span className="text-[11px] text-white/70">
              Amazon Review Intelligence
            </span>
          </div>
        </div>

        {/* New analysis button */}
        <div className="px-4 pt-4">
          <Button
            onClick={clearChat}
            className="w-full justify-start gap-2 rounded-full bg-white text-[#111827] hover:bg-gray-100 text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            New analysis
          </Button>
        </div>

        {/* “History” section – one current session for now */}
        <div className="px-4 pt-6 flex-1 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-wide text-white/60 mb-2">
            Recent sessions
          </p>
          <button
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-white/10 hover:bg-white/15 text-white"
          >
            <MessageCircle className="h-3 w-3 opacity-80" />
            <span className="truncate">Current analysis</span>
          </button>
          <p className="mt-4 text-[11px] text-white/50">
            (Multi-session history can be added later — this is the active workspace.)
          </p>
        </div>

        {/* Sidebar footer */}
        <div className="px-4 py-3 text-[11px] text-white/50 border-t border-white/10">
          © {new Date().getFullYear()} {OWNER_NAME}
        </div>
      </aside>

      {/* ============= MAIN CHAT PANEL ============= */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top gradient header across main area */}
        <header className="bg-gradient-to-r from-[#4C6FFF] to-[#8A2EFF] text-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {/* mobile logo when sidebar hidden */}
              <div className="md:hidden">
                <Avatar className="h-8 w-8 border border-white/40">
                  <AvatarImage src="/sellersight-logo.png" />
                  <AvatarFallback>SS</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {AI_NAME} · Review Intelligence Agent
                </span>
                <span className="text-[11px] opacity-90">
                  Analyze ASINs, competitors, and review patterns with one AI workspace.
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Quick-start suggestions (like GPT’s prompt cards) */}
        <section className="border-b border-gray-200 bg-[#F9FAFB]">
          <div className="mx-auto w-full max-w-6xl px-6 pt-4 pb-3 text-xs text-[#374151]">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">
              Want help getting started?
            </p>
            <div className="flex flex-wrap gap-2">
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
        </section>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-4">
            {isClient ? (
              <>
                <MessageWall
                  messages={messages}
                  status={status}
                  durations={durations}
                  onDurationChange={handleDurationChange}
                />
                {status === "submitted" && (
                  <div className="mt-2 flex w-full max-w-3xl justify-start">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex w-full justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </main>

        {/* INPUT BAR at the very bottom */}
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-3">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              id="chat-form"
              className="w-full"
            >
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="sr-only">Message</FieldLabel>
                      <div className="relative flex items-center">
                        <Input
                          {...field}
                          placeholder="Ask SellerSight anything about your ASINs, reviews, or competitors…"
                          className="h-12 w-full rounded-full border border-gray-300 bg-white pl-4 pr-12 text-sm text-[#0F1111] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C6FFF]"
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
                            className="absolute right-1 h-9 w-9 rounded-full bg-[#232F3E] text-white shadow hover:bg-[#111827]"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        )}
                        {(status === "streaming" || status === "submitted") && (
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => stop()}
                            className="absolute right-1 h-9 w-9 rounded-full bg-gray-200 text-[#0F1111]"
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
        </section>

        {/* Footer (subtle, like product footer) */}
        <footer className="border-t border-gray-100 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 text-[11px] text-gray-500">
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
        </footer>
      </div>
    </div>
  );
}

// Quick-start pill button
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
      className="rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-[11px] font-medium text-[#111827] hover:border-[#A5B4FC] hover:bg-[#EEF2FF] transition"
    >
      {label}
    </button>
  );
}

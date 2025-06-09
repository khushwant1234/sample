"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Menu } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import type { Message } from "@/lib/types/database";

// Function to format text with basic markdown-like formatting
function formatMessageContent(content: string): string {
  let formatted = content;

  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Split into lines and process
  const lines = formatted.split("\n");
  let inList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("* ")) {
      // Bullet point
      if (!inList) {
        processedLines.push('<ul class="mb-2 ps-3">');
        inList = true;
      }
      processedLines.push(
        `<li class="mb-1">${trimmedLine.substring(2).trim()}</li>`
      );
    } else {
      // Regular line
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }

      if (trimmedLine === "") {
        // Empty line - add spacing
        processedLines.push("<br>");
      } else {
        // Regular paragraph
        processedLines.push(`<p class="mb-2">${trimmedLine}</p>`);
      }
    }
  }

  // Close any open list
  if (inList) {
    processedLines.push("</ul>");
  }

  return processedLines.join("");
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function ChatInterface({
  conversationId,
  onConversationCreated,
  onToggleSidebar,
  sidebarOpen,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"flash" | "pro">("flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const data = await trpc.chat.getMessages.query({ conversationId });
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      if (!conversationId) {
        // Create new conversation with first message
        const result =
          await trpc.chat.createConversationWithFirstMessage.mutate({
            title: generateConversationTitle(messageContent),
            content: messageContent,
            role: "user",
          });
        onConversationCreated?.(result.conversation.id);
        setMessages([result.message]);

        // Generate AI response with conversation context (empty for first message)
        const aiResponse = await trpc.ai.generateResponse.mutate({
          message: messageContent,
          model: selectedModel,
          conversationHistory: [],
        });

        const assistantMessage = await trpc.chat.addMessage.mutate({
          conversationId: result.conversation.id,
          content: aiResponse.text,
          role: "assistant",
          imageUrl: aiResponse.imageUrl,
        });

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Add message to existing conversation
        const userMessage = await trpc.chat.addMessage.mutate({
          conversationId,
          content: messageContent,
          role: "user",
        });
        setMessages((prev) => [...prev, userMessage]);

        // Generate AI response with conversation context
        const conversationHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        const aiResponse = await trpc.ai.generateResponse.mutate({
          message: messageContent,
          model: selectedModel,
          conversationHistory,
        });

        const assistantMessage = await trpc.chat.addMessage.mutate({
          conversationId,
          content: aiResponse.text,
          role: "assistant",
          imageUrl: aiResponse.imageUrl,
        });

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  if (!conversationId) {
    return (
      <div className="d-flex flex-column h-100">
        {/* Mobile Header */}
        <div
          className="d-lg-none border-bottom border-secondary px-3 py-2"
          style={{ backgroundColor: "#171717" }}
        >
          <div className="d-flex align-items-center">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="btn btn-sm me-3 p-2"
                style={{
                  background: "none",
                  border: "1px solid #303030",
                  color: "#999",
                  borderRadius: "6px",
                }}
                aria-label="Toggle sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            <h6 className="mb-0 text-white">Neural Chat AI</h6>
          </div>
        </div>
        {/* Welcome Screen */}
        <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
          <div className="text-center w-100" style={{ maxWidth: "500px" }}>
            <div className="mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#303030",
                }}
              >
                <Bot size={40} color="#ffffff" />
              </div>
              <h2 className="mb-3">Neural Chat AI</h2>
              <p className="text-muted">
                Powered by Google Gemini AI. Choose between Flash (fast) or Pro
                (smart) models for text, plus actual image generation with
                Gemini 2.0 Flash.
              </p>
            </div>

            <div className="d-flex flex-column gap-2 text-start">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle me-2"
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#28a745",
                  }}
                ></div>
                <small className="text-muted">
                  ⚡ Flash: Fast responses, high efficiency
                </small>
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle me-2"
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#6f42c1",
                  }}
                ></div>
                <small className="text-muted">
                  🧠 Pro: More capable, detailed analysis
                </small>
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle me-2"
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#007bff",
                  }}
                ></div>
                <small className="text-muted">
                  🖼️ 2.0 Flash: Actual image generation
                </small>
              </div>
            </div>
          </div>{" "}
        </div>{" "}
        {/* Input Area */}
        <div
          className="p-2 p-md-3 border-top flex-shrink-0"
          style={{ borderTopColor: "#303030" }}
        >
          <div className="mb-2 d-flex justify-content-center">
            <div className="btn-group btn-group-sm" role="group">
              <input
                type="radio"
                className="btn-check"
                name="model"
                id="flash"
                checked={selectedModel === "flash"}
                onChange={() => setSelectedModel("flash")}
              />
              <label className="btn btn-outline-light btn-sm" htmlFor="flash">
                ⚡ Flash
              </label>

              <input
                type="radio"
                className="btn-check"
                name="model"
                id="pro"
                checked={selectedModel === "pro"}
                onChange={() => setSelectedModel("pro")}
              />
              <label className="btn btn-outline-light btn-sm" htmlFor="pro">
                🧠 Pro
              </label>
            </div>
          </div>

          <form onSubmit={handleSendMessage}>
            <div className="input-group">
              <textarea
                className="form-control"
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything or try 'generate image of...' to create actual images!"
                style={{ resize: "none" }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="btn btn-primary"
              >
                <Send size={18} />
              </button>
            </div>{" "}
          </form>

          <div className="text-center mt-1">
            <small className="text-muted">
              Neural Chat AI may generate incorrect information.
            </small>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="d-flex flex-column h-100">
      {/* Mobile Header */}
      <div
        className="d-lg-none border-bottom border-secondary px-3 py-2"
        style={{ backgroundColor: "#171717" }}
      >
        <div className="d-flex align-items-center">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="btn btn-sm me-3 p-2"
              style={{
                background: "none",
                border: "1px solid #303030",
                color: "#999",
                borderRadius: "6px",
              }}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <h6 className="mb-0 text-white">Neural Chat AI</h6>
        </div>
      </div>
      {/* Messages Area */}{" "}
      <div
        ref={messagesContainerRef}
        className="flex-grow-1 p-3 chat-messages"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: "calc(100vh - 120px)", // Reserve space for input area
          minHeight: 0, // Allow flexbox shrinking
        }}
      >
        <div className="container-fluid">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`row mb-3 ${
                message.role === "user"
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              {" "}
              <div className="col-12 col-md-10 col-lg-8">
                <div
                  className={`d-flex message-bubble ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                      message.role === "user" ? "ms-2" : "me-2"
                    }`}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor:
                        message.role === "user" ? "#303030" : "#212121",
                    }}
                  >
                    {message.role === "user" ? (
                      <User size={18} color="#ffffff" />
                    ) : (
                      <Bot size={18} color="#ffffff" />
                    )}
                  </div>

                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor:
                        message.role === "user" ? "#303030" : "#212121",
                      color: "#ffffff",
                    }}
                  >
                    {" "}
                    {message.image_url && (
                      <div className="mb-2">
                        <img
                          src={message.image_url}
                          alt="Generated image"
                          className="img-fluid rounded"
                          style={{
                            maxHeight: "300px",
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            display: "block",
                          }}
                          onLoad={() => {
                            // Delay scroll to ensure layout is complete
                            setTimeout(() => {
                              if (messagesContainerRef.current) {
                                const container = messagesContainerRef.current;
                                container.scrollTo({
                                  top: container.scrollHeight,
                                  behavior: "smooth",
                                });
                              }
                            }, 100);
                          }}
                          onError={(e) => {
                            console.error("Error loading image:", e);
                          }}
                        />{" "}
                      </div>
                    )}
                    <div
                      className="mb-1 message-content"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content),
                      }}
                    />
                    <small className="text-muted">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="row mb-3 justify-content-start">
              <div className="col-md-8">
                <div className="d-flex">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#212121",
                    }}
                  >
                    <Bot size={18} color="#ffffff" />
                  </div>

                  <div
                    className="p-3 rounded"
                    style={{ backgroundColor: "#212121", color: "#ffffff" }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>{" "}
      </div>
      {/* Input Area */}
      <div className="p-2 border-top flex-shrink-0">
        <form onSubmit={handleSendMessage}>
          <div className="input-group">
            <textarea
              className="form-control"
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              style={{ resize: "none" }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="btn btn-primary"
            >
              <Send size={18} />
            </button>
          </div>
        </form>

        <div className="text-center mt-1">
          <small className="text-muted">
            AI may generate incorrect info •{" "}
            {selectedModel === "flash" ? "Flash" : "Pro"} model
          </small>
        </div>
      </div>
    </div>
  );
}

// Generate a smart title from the first message
function generateConversationTitle(message: string): string {
  const cleanMessage = message.trim();

  if (cleanMessage.length <= 50) {
    return cleanMessage;
  }

  const sentences = cleanMessage.split(/[.!?]+/);
  if (sentences[0] && sentences[0].trim().length <= 50) {
    return sentences[0].trim();
  }

  const words = cleanMessage.split(" ");
  if (words.length <= 8) {
    return cleanMessage;
  }

  return words.slice(0, 8).join(" ") + "...";
}

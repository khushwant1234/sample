"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  LogOut,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/components/AuthProvider";
import type { Conversation } from "@/lib/types/database";

interface SidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  refreshTrigger?: number;
  onCloseSidebar?: () => void;
}

export function Sidebar({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
  onCloseSidebar,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      await trpc.chat.deleteEmptyConversations.mutate();
      const data = await trpc.chat.getConversations.query();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const conversation = await trpc.chat.createConversation.mutate({
        title: "New Chat",
      });
      setConversations((prev) => [conversation, ...prev]);
      onSelectConversation(conversation.id);
      onNewConversation();
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await trpc.chat.deleteConversation.mutate({ id });
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (selectedConversationId === id) {
        onNewConversation();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleEditStart = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleEditSave = async (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      try {
        await trpc.chat.updateConversationTitle.mutate({
          id: id,
          title: editTitle.trim() || "Untitled",
        });
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === id
              ? { ...conv, title: editTitle.trim() || "Untitled" }
              : conv
          )
        );
        setEditingId(null);
      } catch (error) {
        console.error("Error updating conversation:", error);
      }
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  };
  return (
    <div
      className="d-flex flex-column h-100"
      style={{ backgroundColor: "#171717" }}
    >
      {/* Header */}
      <div className="p-3 border-bottom border-secondary">
        {" "}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 text-white">CHATGPT</h5>
          {/* Mobile close button */}
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="btn btn-sm d-lg-none p-1"
              style={{
                background: "none",
                border: "1px solid #303030",
                color: "#999",
                borderRadius: "6px",
              }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={handleNewConversation}
          className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
          style={{ fontSize: "0.9rem" }}
        >
          <Plus size={16} className="me-2" />
          New Chat
        </button>
      </div>
      {/* Conversations List */}
      <div className="flex-grow-1 overflow-auto p-2">
        <div className="list-group list-group-flush">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`list-group-item list-group-item-action d-flex align-items-center cursor-pointer ${
                selectedConversationId === conversation.id ? "active" : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
              style={{ cursor: "pointer", minWidth: 0 }}
            >
              <div
                className="d-flex align-items-center flex-grow-1"
                style={{ minWidth: 0 }}
              >
                <MessageSquare size={16} className="me-2 flex-shrink-0" />
                {editingId === conversation.id ? (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleEditSave(conversation.id, e)}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-truncate"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {conversation.title}
                  </span>
                )}
              </div>
              <div className="d-flex flex-shrink-0 ms-2">
                <button
                  onClick={(e) =>
                    handleEditStart(conversation.id, conversation.title, e)
                  }
                  className="btn btn-sm me-1"
                  style={{ background: "none", border: "none", color: "#999" }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  className="btn btn-sm"
                  style={{ background: "none", border: "none", color: "#999" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>{" "}
      {/* User Profile Section */}
      <div className="user-profile-section p-3">
        <div className="d-flex align-items-center gap-3">
          <div className="flex-shrink-0">
            {" "}
            {user?.picture ? (
              <Image
                src={user.picture}
                alt={user.name || "User"}
                width={44}
                height={44}
                className="user-avatar rounded-circle"
                style={{
                  objectFit: "cover",
                  border: "2px solid #303030",
                }}
              />
            ) : (
              <div
                className="user-avatar rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "#303030",
                  color: "#ffffff",
                  border: "2px solid #404040",
                }}
              >
                <User size={22} />
              </div>
            )}
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="user-name text-truncate mb-1">
              {user?.name || "User"}
            </div>
            <div className="user-email text-truncate">{user?.email}</div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={logout}
              className="logout-btn btn btn-sm d-flex align-items-center justify-content-center"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

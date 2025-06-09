"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  const { user, isLoading, login } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setSidebarOpen(false); // Close sidebar on mobile after new conversation
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 px-3">
        <div className="text-center w-100" style={{ maxWidth: "400px" }}>
          <div
            className="card"
            style={{ backgroundColor: "#212121", border: "1px solid #303030" }}
          >
            <div className="card-body p-4">
              <h2 className="card-title mb-3">Welcome to Neural Chat AI</h2>
              <p className="card-text text-muted mb-4">
                Sign in to access your personal AI chat assistant powered by
                Google Gemini.
              </p>
              <button onClick={login} className="btn btn-primary btn-lg w-100">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none ${
          sidebarOpen ? "d-block" : "d-none"
        }`}
        style={{ zIndex: 1040 }}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="d-flex vh-100 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`sidebar-mobile d-lg-block ${sidebarOpen ? "show" : ""}`}
          style={{
            backgroundColor: "#171717",
            borderRight: "1px solid #303030",
            zIndex: 1050,
          }}
        >
          <Sidebar
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            refreshTrigger={refreshTrigger}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div
          className="flex-grow-1 d-flex flex-column min-w-0"
          style={{ marginLeft: "0" }}
        >
          <ChatInterface
            conversationId={selectedConversationId}
            onConversationCreated={handleConversationCreated}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>
      </div>
    </>
  );
}

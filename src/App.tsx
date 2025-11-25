import { useEffect, useCallback, useRef, useState } from "react";
import { useMachine } from "@xstate/react";
import { editorMachine } from "./machines/editorMachine";
import { Sidebar, Editor, ControlBar, StatusMessage } from "./components";
import { useDocuments } from "./contexts";
import { type WritingTone, type ModifyAction } from "./lib/ai";
import type { AiAction } from "./components/Editor/Editor";
import { LandingPage } from "./pages";
import "./App.css";

// Check if user is logged in
const getStoredUser = (): { email: string; name: string } | null => {
  try {
    const stored = localStorage.getItem("chronicle_current_user");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

// Load sidebar state from localStorage
const loadSidebarState = (): boolean => {
  try {
    const stored = localStorage.getItem("chronicle_sidebar_collapsed");
    return stored === "true";
  } catch {
    return false;
  }
};

// Load tone from localStorage
const loadTone = (): WritingTone => {
  try {
    const stored = localStorage.getItem("chronicle_tone");
    if (stored) return stored as WritingTone;
  } catch {}
  return "professional";
};

function App() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(
    getStoredUser
  );
  const [showEditor, setShowEditor] = useState(false);

  const handleLogin = (loggedInUser: { email: string; name: string }) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("chronicle_current_user");
    setUser(null);
    setShowEditor(false);
  };

  // Show editor if logged in AND user explicitly entered editor
  if (user && showEditor) {
    return (
      <EditorApp
        user={user}
        onLogout={handleLogout}
        onExit={() => setShowEditor(false)}
      />
    );
  }

  // Show landing page otherwise (logged out OR logged in but on landing page)
  return (
    <LandingPage
      onLogin={handleLogin}
      user={user}
      onEnterEditor={() => setShowEditor(true)}
      onLogout={handleLogout}
    />
  );
}

// Separate component for the editor to avoid hook issues
function EditorApp({
  user,
  onLogout,
  onExit,
}: {
  user: { email: string; name: string };
  onLogout: () => void;
  onExit?: () => void;
}) {
  const [state, send] = useMachine(editorMachine);
  const { activeDocument, updateDocument } = useDocuments();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarState);
  const [tone, setTone] = useState<WritingTone>(loadTone);

  // Persist sidebar state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("chronicle_sidebar_collapsed", String(newState));
      return newState;
    });
  }, []);

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<number | null>(null);

  // Get current content from active document
  const currentContent = activeDocument?.content || "";
  // Use empty string if title is empty, don't fallback to "Untitled" for the input value
  const documentTitle = activeDocument?.title ?? "";

  // Auto-save content with debounce
  const handleEditorUpdate = useCallback(
    (text: string) => {
      if (!activeDocument) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save (300ms)
      saveTimeoutRef.current = window.setTimeout(() => {
        updateDocument(activeDocument.id, { content: text });
      }, 300);
    },
    [activeDocument, updateDocument]
  );

  // Save title immediately on change
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (!activeDocument) return;
      updateDocument(activeDocument.id, { title: newTitle });
    },
    [activeDocument, updateDocument]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerate = useCallback(
    (action?: AiAction, selectedText?: string) => {
      if (action && selectedText) {
        // Use the action-based generation (from slash menu AI commands)
        send({
          type: "GENERATE_WITH_ACTION",
          selectedText,
          action: action as ModifyAction,
        });
      } else {
        // Default continuation behavior
        send({ type: "GENERATE", currentText: currentContent, tone });
      }
    },
    [send, currentContent, tone]
  );

  const handleStop = () => send({ type: "STOP" });

  const handleToneChange = useCallback((newTone: WritingTone) => {
    setTone(newTone);
    localStorage.setItem("chronicle_tone", newTone);
  }, []);

  const handleAccept = useCallback(() => {
    send({ type: "ACCEPT" });
  }, [send]);

  const handleReject = useCallback(() => {
    send({ type: "REJECT" });
  }, [send]);

  const handleModify = useCallback(
    (action: AiAction) => {
      send({ type: "MODIFY", action: action as ModifyAction });
    },
    [send]
  );

  const isStreaming = state.matches("streaming");
  const isModifying = state.matches("modifying");
  const hasPendingSuggestion = state.matches("pending");
  const hasError = state.matches("idle") && state.context.error;

  // Calculate word count
  const wordCount = currentContent.trim()
    ? currentContent.trim().split(/\s+/).length
    : 0;
  const charCount = currentContent.length;
  const canGenerate = currentContent.length >= 1;

  // Reading time estimate (average 200 words per minute)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        user={user}
        onLogout={onLogout}
        onLogoClick={onExit}
      />

      <main className="editor-main">
        {/* Sidebar Toggle Button (visible when collapsed) */}
        {sidebarCollapsed && (
          <button
            className="sidebar-expand-btn"
            onClick={toggleSidebar}
            title="Expand sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6h12M4 10h12M4 14h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        {/* Document Header */}
        <header className="document-header">
          <div className="document-info">
            <input
              type="text"
              className="document-title-input"
              value={documentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
            />
            <div className="document-meta">
              <span className="meta-item">{wordCount} words</span>
              <span className="meta-divider">·</span>
              <span className="meta-item">{charCount} characters</span>
              <span className="meta-divider">·</span>
              <span className="meta-item">{readingTime} min read</span>
            </div>
          </div>
          <div className="document-actions">
            {(isStreaming || isModifying) && (
              <span className="streaming-indicator">
                <span className="streaming-dot"></span>
                {isModifying ? "AI is modifying..." : "AI is writing..."}
              </span>
            )}
            {hasPendingSuggestion && (
              <span className="pending-indicator">
                Hover over italic text to accept/reject
              </span>
            )}
          </div>
        </header>

        {/* Main Writing Area */}
        <div className="writing-area">
          <div className="editor-wrapper">
            <Editor
              key={activeDocument?.id}
              initialContent={currentContent}
              onUpdate={handleEditorUpdate}
              apiText={state.context.generatedText}
              onGenerate={handleGenerate}
              isStreaming={isStreaming || isModifying}
              hasPendingSuggestion={hasPendingSuggestion}
              onAccept={handleAccept}
              onReject={handleReject}
              onModify={handleModify}
            />
          </div>
        </div>

        {/* Bottom Toolbar */}
        <footer className="editor-footer">
          <div className="footer-content">
            {hasError && (
              <StatusMessage
                type="error"
                message={state.context.error || "An error occurred"}
              />
            )}
            <ControlBar
              isStreaming={isStreaming}
              canGenerate={canGenerate}
              onGenerate={handleGenerate}
              onStop={handleStop}
              wordCount={wordCount}
              tone={tone}
              onToneChange={handleToneChange}
            />
          </div>
          <div className="footer-hint">
            <kbd>/</kbd> for AI commands
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

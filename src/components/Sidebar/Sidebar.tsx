import React from "react";
import "./Sidebar.css";
import { ThemeToggle } from "../Layout";
import { useDocuments } from "../../contexts";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user?: { email: string; name: string };
  onLogout?: () => void;
  onLogoClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  user,
  onLogout,
  onLogoClick,
}) => {
  const {
    documents,
    activeDocId,
    createDocument,
    setActiveDocument,
    deleteDocument,
  } = useDocuments();

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleNewDocument = () => {
    createDocument();
  };

  const handleSelectDocument = (docId: string) => {
    setActiveDocument(docId);
  };

  const handleDeleteDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (documents.length > 1) {
      deleteDocument(docId);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={onLogoClick}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="sidebar-logo-text">Chronicle</span>
        </div>
        <div className="sidebar-header-actions">
          <ThemeToggle />
          <button
            className="sidebar-collapse-btn"
            onClick={onToggle}
            title="Collapse sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 4L6 9l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="new-doc-btn" onClick={handleNewDocument}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Document
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Documents ({documents.length})</div>
        <nav className="sidebar-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`sidebar-item ${
                doc.id === activeDocId ? "active" : ""
              }`}
              onClick={() => handleSelectDocument(doc.id)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="doc-icon"
              >
                <path
                  d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 8h6M5 11h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="doc-info">
                <span className="doc-title">{doc.title || "Untitled"}</span>
                <span className="doc-date">{formatDate(doc.updatedAt)}</span>
              </div>
              {documents.length > 1 && (
                <button
                  className="doc-delete"
                  onClick={(e) => handleDeleteDocument(e, doc.id)}
                  title="Delete document"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button className="user-logout" onClick={onLogout} title="Log out">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        <span>Chronicle v1.0</span>
        <span className="footer-divider">·</span>
        <span>Auto-saved</span>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Document type
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Storage keys
const STORAGE_KEYS = {
  DOCUMENTS: "chronicle_documents",
  ACTIVE_DOC: "chronicle_active_doc",
} as const;

// Context type
interface DocumentContextType {
  documents: Document[];
  activeDocument: Document | null;
  activeDocId: string | null;
  createDocument: () => Document;
  updateDocument: (
    id: string,
    updates: Partial<Pick<Document, "title" | "content">>
  ) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  getDocument: (id: string) => Document | undefined;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

// Generate unique ID
const generateId = () =>
  `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Load from localStorage
const loadDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load documents from localStorage:", e);
  }
  return [];
};

const loadActiveDocId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_DOC);
  } catch (e) {
    console.error("Failed to load active doc from localStorage:", e);
  }
  return null;
};

// Save to localStorage
const saveDocuments = (docs: Document[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error("Failed to save documents to localStorage:", e);
  }
};

const saveActiveDocId = (id: string | null) => {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DOC);
    }
  } catch (e) {
    console.error("Failed to save active doc to localStorage:", e);
  }
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [documents, setDocuments] = useState<Document[]>(() => loadDocuments());
  const [activeDocId, setActiveDocId] = useState<string | null>(() =>
    loadActiveDocId()
  );

  // Persist documents to localStorage whenever they change
  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  // Persist active document ID
  useEffect(() => {
    saveActiveDocId(activeDocId);
  }, [activeDocId]);

  // Get active document object
  const activeDocument = documents.find((d) => d.id === activeDocId) || null;

  // Create a new document
  const createDocument = useCallback((): Document => {
    const now = Date.now();
    const newDoc: Document = {
      id: generateId(),
      title: "Untitled",
      content: "",
      createdAt: now,
      updatedAt: now,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    return newDoc;
  }, []);

  // Update a document
  const updateDocument = useCallback(
    (id: string, updates: Partial<Pick<Document, "title" | "content">>) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, ...updates, updatedAt: Date.now() } : doc
        )
      );
    },
    []
  );

  // Delete a document
  const deleteDocument = useCallback(
    (id: string) => {
      setDocuments((prev) => {
        const newDocs = prev.filter((doc) => doc.id !== id);
        // If we deleted the active doc, switch to another
        if (activeDocId === id) {
          const nextDoc = newDocs[0];
          setActiveDocId(nextDoc?.id || null);
        }
        return newDocs;
      });
    },
    [activeDocId]
  );

  // Set active document
  const setActiveDocument = useCallback((id: string) => {
    setActiveDocId(id);
  }, []);

  // Get a document by ID
  const getDocument = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents]
  );

  // Initialize with a default document if none exist
  useEffect(() => {
    if (documents.length === 0) {
      createDocument();
    } else if (!activeDocId || !documents.find((d) => d.id === activeDocId)) {
      // If no active doc or active doc doesn't exist, set to first document
      setActiveDocId(documents[0].id);
    }
  }, []);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDocument,
        activeDocId,
        createDocument,
        updateDocument,
        deleteDocument,
        setActiveDocument,
        getDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
};

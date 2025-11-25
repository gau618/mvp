import React, { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import {
  splitListItem,
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import {
  slashCommandPlugin,
  closeSlashMenu,
  type SlashMenuState,
} from "../../lib/slash-command";
import { buildInputRules } from "../../lib/inputRules";
import { schema, type BlockType } from "../../lib/editor-config";
import {
  insertBlock,
  toggleTaskItem,
  toggleToggleItem,
  keyboardShortcuts,
} from "../../lib/block-commands";
import { SlashMenu } from "./SlashMenu";
import "prosemirror-view/style/prosemirror.css";
import "./EditorStyles.css";
import "./SlashMenu.css";

export type AiAction =
  | "shorten"
  | "expand"
  | "rephrase"
  | "formal"
  | "casual"
  | "summarize"
  | "improve"
  | "brainstorm";

interface EditorProps {
  onUpdate: (docText: string) => void;
  apiText?: string | null;
  onGenerate: (action?: AiAction, selectedText?: string) => void;
  initialContent?: string;
  isStreaming?: boolean;
  hasPendingSuggestion?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onModify?: (action: AiAction) => void;
}

export const Editor: React.FC<EditorProps> = ({
  onUpdate,
  apiText,
  onGenerate,
  initialContent = "",
  isStreaming = false,
  hasPendingSuggestion = false,
  onAccept,
  onReject,
  onModify,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastInsertedLengthRef = useRef(0);
  const aiTextStartPosRef = useRef<number | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  // Selection toolbar state (for AI actions on selected text)
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionToolbarPos, setSelectionToolbarPos] = useState({
    top: 0,
    left: 0,
  });
  const [selectedText, setSelectedText] = useState("");
  const selectionRangeRef = useRef<{ from: number; to: number } | null>(null);
  const isReplacingSelectionRef = useRef(false);
  const originalTextRef = useRef<string>("");

  // Slash menu state
  const [slashMenuState, setSlashMenuState] = useState<SlashMenuState | null>(
    null
  );
  const [slashMenuPosition, setSlashMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  // Store initial content in a ref so it doesn't cause re-initialization
  const initialContentRef = useRef(initialContent);

  // Show skeleton when streaming starts, hide when first text arrives
  useEffect(() => {
    if (isStreaming && !apiText) {
      setShowSkeleton(true);
    } else if (apiText && apiText.length > 0) {
      setShowSkeleton(false);
    } else if (!isStreaming) {
      setShowSkeleton(false);
    }
  }, [isStreaming, apiText]);

  // Handle slash menu state changes
  const handleSlashMenuStateChange = useCallback(
    (state: SlashMenuState | null) => {
      setSlashMenuState(state);

      if (state?.active && viewRef.current) {
        const view = viewRef.current;
        const coords = view.coordsAtPos(state.from);
        const editorRect = editorRef.current?.getBoundingClientRect();

        if (coords && editorRect) {
          setSlashMenuPosition({
            top: coords.bottom - editorRect.top + 4,
            left: coords.left - editorRect.left,
          });
        }
      }
    },
    []
  );

  // Handle block type selection from slash menu
  const handleBlockSelect = useCallback(
    (blockType: BlockType) => {
      if (!viewRef.current) return;

      const view = viewRef.current;

      // Close the slash menu and delete the slash command text
      closeSlashMenu(view, true);

      // Handle AI-specific actions
      if (blockType.id.startsWith("ai_")) {
        const { from, to, empty } = view.state.selection;
        let selectedText = "";

        if (!empty) {
          selectedText = view.state.doc.textBetween(from, to);
        } else {
          // Get text from current block or document
          const { $from } = view.state.selection;
          const parent = $from.parent;
          selectedText = parent.textContent || view.state.doc.textContent;
        }

        // Map AI block types to actions
        const aiActionMap: Record<string, AiAction> = {
          ai_continue: "expand",
          ai_summarize: "summarize",
          ai_expand: "expand",
          ai_improve: "improve",
          ai_brainstorm: "brainstorm",
        };

        const action = aiActionMap[blockType.id];
        if (action) {
          onGenerate(action, selectedText);
        } else {
          onGenerate();
        }

        view.focus();
        return;
      }

      // Insert the selected block
      insertBlock(view, blockType);

      // Focus the editor
      view.focus();
    },
    [onGenerate]
  );

  // Handle click on task checkboxes and toggle icons
  const handleEditorClick = useCallback((e: MouseEvent) => {
    if (!viewRef.current) return;

    const target = e.target as HTMLElement;

    // Handle task checkbox click
    if (
      target.classList.contains("task-checkbox") ||
      target.classList.contains("task-checkbox-wrapper")
    ) {
      e.preventDefault();
      const taskItem = target.closest('[data-type="task-item"]');
      if (taskItem) {
        const pos = viewRef.current.posAtDOM(taskItem, 0);
        if (pos !== null) {
          toggleTaskItem(viewRef.current, pos - 1);
        }
      }
    }

    // Handle toggle icon click
    if (target.classList.contains("toggle-icon")) {
      e.preventDefault();
      const toggleItem = target.closest('[data-type="toggle-item"]');
      if (toggleItem) {
        const pos = viewRef.current.posAtDOM(toggleItem, 0);
        if (pos !== null) {
          toggleToggleItem(viewRef.current, pos - 1);
        }
      }
    }
  }, []);

  // Initialize ProseMirror only once per mount
  useEffect(() => {
    if (!editorRef.current) return;

    // Create initial document content from the ref (captured at mount time)
    const content = initialContentRef.current;
    const doc = content
      ? schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text(content)]),
        ])
      : undefined;

    const state = EditorState.create({
      schema,
      doc,
      plugins: [
        history(),
        keymap({
          "Mod-z": undo,
          "Mod-Shift-z": redo,
          "Mod-y": redo,
          ...keyboardShortcuts,
        }),
        // List-specific keybindings - Enter to split, Tab to indent, Shift-Tab to outdent
        keymap({
          Enter: splitListItem(schema.nodes.list_item),
          Tab: sinkListItem(schema.nodes.list_item),
          "Shift-Tab": liftListItem(schema.nodes.list_item),
        }),
        // Task list keybindings
        keymap({
          Enter: splitListItem(schema.nodes.task_item),
          Tab: sinkListItem(schema.nodes.task_item),
          "Shift-Tab": liftListItem(schema.nodes.task_item),
        }),
        // Toggle list keybindings
        keymap({
          Enter: splitListItem(schema.nodes.toggle_item),
          Tab: sinkListItem(schema.nodes.toggle_item),
          "Shift-Tab": liftListItem(schema.nodes.toggle_item),
        }),
        keymap(baseKeymap),
        slashCommandPlugin(onGenerate, handleSlashMenuStateChange),
        buildInputRules(),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (transaction.docChanged) {
          const textContent = newState.doc.textContent;
          onUpdate(textContent);
        }

        // Check for text selection to show AI toolbar
        const { from, to, empty } = newState.selection;
        if (!empty && to - from > 3) {
          // Only show for selections > 3 chars
          const text = newState.doc.textBetween(from, to);
          setSelectedText(text);

          // Get coordinates for toolbar position
          const coords = view.coordsAtPos(from);
          const editorRect = editorRef.current?.getBoundingClientRect();
          if (coords && editorRect) {
            setSelectionToolbarPos({
              top: coords.top - editorRect.top - 45,
              left: coords.left - editorRect.left,
            });
            setShowSelectionToolbar(true);
          }
        } else {
          setShowSelectionToolbar(false);
          setSelectedText("");
        }
      },
    });

    // Make the editable DOM focusable and accessible
    try {
      view.dom.setAttribute("tabindex", "0");
      view.dom.setAttribute("spellcheck", "true");
      (view.dom as HTMLElement).style.caretColor = "var(--notion-accent)";
    } catch (e) {
      // ignore
    }

    // Add click handler for interactive elements
    view.dom.addEventListener("click", handleEditorClick);

    // Focus the editor when mounted
    setTimeout(() => {
      try {
        view.focus();
      } catch (e) {
        /* ignore */
      }
    }, 50);

    viewRef.current = view;

    return () => {
      view.dom.removeEventListener("click", handleEditorClick);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle streaming AI text - insert at cursor position with highlight mark
  useEffect(() => {
    if (!apiText || !viewRef.current) {
      if (!apiText) {
        lastInsertedLengthRef.current = 0;
        // Don't reset aiTextStartPosRef here - we need it for modifying
      }
      return;
    }

    const view = viewRef.current;

    if (apiText.length > lastInsertedLengthRef.current) {
      let newChunk = apiText.slice(lastInsertedLengthRef.current);
      newChunk = newChunk.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ");

      if (newChunk) {
        // Insert at cursor position or end of document
        const insertPos =
          aiTextStartPosRef.current !== null
            ? aiTextStartPosRef.current + lastInsertedLengthRef.current
            : view.state.selection.from;

        // Track where AI text starts (only on first chunk)
        if (aiTextStartPosRef.current === null) {
          aiTextStartPosRef.current = insertPos;
        }

        // Insert text with italic mark (to indicate AI-generated)
        const emMark = schema.marks.em.create();
        const tr = view.state.tr.insert(
          insertPos +
            lastInsertedLengthRef.current -
            (lastInsertedLengthRef.current > 0
              ? lastInsertedLengthRef.current
              : 0),
          schema.text(newChunk, [emMark])
        );
        tr.scrollIntoView();
        view.dispatch(tr);
      }

      lastInsertedLengthRef.current = apiText.length;
    }
  }, [apiText]);

  // Handle accept - remove italic styling
  const handleAccept = () => {
    if (viewRef.current && aiTextStartPosRef.current !== null) {
      const view = viewRef.current;
      const startPos = aiTextStartPosRef.current;
      const endPos = view.state.doc.content.size - 1;

      // Remove em mark from the AI-generated text
      const tr = view.state.tr.removeMark(startPos, endPos, schema.marks.em);
      view.dispatch(tr);
    }

    // Reset all refs
    aiTextStartPosRef.current = null;
    isReplacingSelectionRef.current = false;
    originalTextRef.current = "";
    selectionRangeRef.current = null;

    setShowToolbar(false);
    onAccept?.();
  };

  // Handle reject - remove AI text from editor (and restore original if replacing)
  const handleReject = () => {
    if (viewRef.current && aiTextStartPosRef.current !== null) {
      const view = viewRef.current;
      const startPos = aiTextStartPosRef.current;
      const endPos = view.state.doc.content.size - 1;

      // Delete the AI-generated text
      let tr = view.state.tr.delete(startPos, endPos);

      // If we were replacing selected text, restore the original
      if (isReplacingSelectionRef.current && originalTextRef.current) {
        tr = tr.insert(startPos, schema.text(originalTextRef.current));
      }

      view.dispatch(tr);
    }

    // Reset all refs
    aiTextStartPosRef.current = null;
    lastInsertedLengthRef.current = 0;
    isReplacingSelectionRef.current = false;
    originalTextRef.current = "";
    selectionRangeRef.current = null;

    setShowToolbar(false);
    onReject?.();
  };

  // Handle modify - delete existing AI text and prepare for new text
  const handleModify = (action: AiAction) => {
    if (viewRef.current && aiTextStartPosRef.current !== null) {
      const view = viewRef.current;
      const startPos = aiTextStartPosRef.current;
      const endPos = view.state.doc.content.size - 1;

      // Delete the AI-generated text
      const tr = view.state.tr.delete(startPos, endPos);
      view.dispatch(tr);

      // Reset for new streaming but keep the start position
      lastInsertedLengthRef.current = 0;
      // aiTextStartPosRef stays at the same position for new AI text
    }
    setShowToolbar(false);
    onModify?.(action);
  };

  // Handle AI action on selected text
  const handleSelectionAiAction = useCallback(
    (action: AiAction) => {
      if (selectedText && viewRef.current) {
        const view = viewRef.current;
        const { from, to } = view.state.selection;

        // Store selection range and original text for restore on reject
        selectionRangeRef.current = { from, to };
        isReplacingSelectionRef.current = true;
        originalTextRef.current = selectedText;

        // Delete the selected text first
        const tr = view.state.tr.delete(from, to);
        // Set cursor at deletion point
        tr.setSelection(TextSelection.create(tr.doc, from));
        view.dispatch(tr);

        // Set AI text start position to where we deleted
        aiTextStartPosRef.current = from;
        lastInsertedLengthRef.current = 0;

        setShowSelectionToolbar(false);
        onGenerate(action, selectedText);
      }
    },
    [selectedText, onGenerate]
  );

  // Calculate toolbar position at end of AI text
  const updateToolbarPosition = () => {
    if (!viewRef.current || aiTextStartPosRef.current === null) return;

    const view = viewRef.current;
    const endPos = view.state.doc.content.size - 1;

    // Get coordinates at the end of the document (where AI text ends)
    const coords = view.coordsAtPos(endPos);
    const rect = editorRef.current?.getBoundingClientRect();

    if (coords && rect) {
      setToolbarPos({
        top: coords.top - rect.top - 40,
        left: coords.left - rect.left,
      });
    }
  };

  // Check if mouse is over AI text area
  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !hasPendingSuggestion ||
      !viewRef.current ||
      aiTextStartPosRef.current === null
    ) {
      setShowToolbar(false);
      return;
    }

    const view = viewRef.current;
    const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });

    if (pos && pos.pos >= aiTextStartPosRef.current) {
      updateToolbarPosition();
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleMouseLeave = () => {
    // Delay hiding to allow clicking on toolbar
    setTimeout(() => {
      if (!document.querySelector(".ai-hover-toolbar:hover")) {
        setShowToolbar(false);
      }
    }, 100);
  };

  return (
    <div className="editor-wrapper-inner">
      <div
        className={`editor-container ${isStreaming ? "is-streaming" : ""} ${
          hasPendingSuggestion ? "has-suggestion" : ""
        }`}
        ref={editorRef}
        onClick={() => viewRef.current?.focus()}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {showSkeleton && (
        <div className="ai-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      )}

      {/* Slash Command Menu */}
      <SlashMenu
        isOpen={slashMenuState?.active ?? false}
        position={slashMenuPosition}
        query={slashMenuState?.query ?? ""}
        onSelect={handleBlockSelect}
        onClose={() => {
          if (viewRef.current) {
            closeSlashMenu(viewRef.current, false);
          }
        }}
      />

      {/* Hover Toolbar for AI suggestions */}
      {showToolbar && hasPendingSuggestion && (
        <div
          className="ai-hover-toolbar"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseLeave={() => setShowToolbar(false)}
        >
          <button
            className="ai-toolbar-btn accept"
            onClick={handleAccept}
            title="Accept"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11.5 4L5.5 10L2.5 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="ai-toolbar-btn reject"
            onClick={handleReject}
            title="Reject"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="ai-toolbar-divider"></div>
          <button
            className="ai-toolbar-btn"
            onClick={() => handleModify("shorten")}
            title="Shorten"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 7H3M7 3L3 7L7 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="ai-toolbar-btn"
            onClick={() => handleModify("expand")}
            title="Expand"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7H11M7 3L11 7L7 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="ai-toolbar-btn"
            onClick={() => handleModify("rephrase")}
            title="Rephrase"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 10V8C2 5.79 3.79 4 6 4H12M12 4L9 1M12 4L9 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Selection Toolbar for AI actions on selected text */}
      {showSelectionToolbar &&
        !isStreaming &&
        !hasPendingSuggestion &&
        selectedText && (
          <div
            className="selection-ai-toolbar"
            style={{
              top: selectionToolbarPos.top,
              left: selectionToolbarPos.left,
            }}
          >
            <span className="selection-toolbar-label">✨ AI</span>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleSelectionAiAction("summarize")}
              title="Summarize selected text"
            >
              📝 Summarize
            </button>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleSelectionAiAction("expand")}
              title="Expand selected text"
            >
              📖 Expand
            </button>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleSelectionAiAction("improve")}
              title="Improve selected text"
            >
              ✏️ Improve
            </button>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleSelectionAiAction("rephrase")}
              title="Rephrase selected text"
            >
              🔄 Rephrase
            </button>
          </div>
        )}
    </div>
  );
};

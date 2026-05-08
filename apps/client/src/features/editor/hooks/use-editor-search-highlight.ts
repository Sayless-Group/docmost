import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Editor } from "@tiptap/react";

export function useEditorSearchHighlight(editor: Editor | null) {
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight");

  useEffect(() => {
    if (!editor || !highlight) return;

    // Defer so the dialog's location-change closeDialog runs before we open
    const timer = setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("openFindDialogFromEditor", {
          detail: { query: highlight },
        }),
      );

      // After the dialog's setSearchTerm effect populates results, scroll to first match
      setTimeout(() => {
        const el = document.querySelector(".search-result-current");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }, 50);

    return () => clearTimeout(timer);
  }, [editor, highlight]);
}

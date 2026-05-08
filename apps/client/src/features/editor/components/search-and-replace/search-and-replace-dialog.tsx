import {
  ActionIcon,
  Button,
  Dialog,
  Flex,
  Input,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconLetterCase,
  IconReplace,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useEditor } from "@tiptap/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { searchAndReplaceStateAtom } from "@/features/editor/components/search-and-replace/atoms/search-and-replace-state-atom.ts";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { getHotkeyHandler, useToggle } from "@mantine/hooks";
import { useLocation } from "react-router-dom";
import classes from "./search-replace.module.css";

interface PageFindDialogDialogProps {
  editor: ReturnType<typeof useEditor>;
  editable?: boolean;
}

function SearchAndReplaceDialog({ editor, editable = true }: PageFindDialogDialogProps) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [pageFindState, setPageFindState] = useAtom(searchAndReplaceStateAtom);
  const inputRef = useRef(null);

  const [replaceButton, replaceButtonToggle] = useToggle([
    { isReplaceShow: false, color: "gray" },
    { isReplaceShow: true, color: "blue" },
  ]);

  const [caseSensitive, caseSensitiveToggle] = useToggle([
    { isCaseSensitive: false, color: "gray" },
    { isCaseSensitive: true, color: "blue" },
  ]);

  const searchInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const replaceInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(event.target.value);
  };

  const closeDialog = () => {
    setSearchText("");
    setReplaceText("");
    setPageFindState({ isOpen: false });
    // Reset replace button state when closing
    if (replaceButton.isReplaceShow) {
      replaceButtonToggle();
    }
    // Clear search term in editor
    if (editor) {
      editor.commands.setSearchTerm("");
    }
  };

  const goToSelection = () => {
    if (!editor) return;

    const { results, resultIndex } = editor.storage.searchAndReplace;
    const position: Range = results[resultIndex];

    if (!position) return;

    const element = document.querySelector(".search-result-current");
    if (element)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const next = () => {
    editor.commands.nextSearchResult();
    goToSelection();
  };

  const previous = () => {
    editor.commands.previousSearchResult();
    goToSelection();
  };

  const replace = () => {
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
    goToSelection();
  };

  const replaceAll = () => {
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replaceAll();
  };

  useEffect(() => {
    editor.commands.setSearchTerm(searchText);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
  }, [searchText]);

  const handleOpenEvent = (e: CustomEvent<{ query?: string }>) => {
    setPageFindState({ isOpen: true });
    if (e.detail?.query) {
      setSearchText(e.detail.query);
    } else {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
      );
      if (selectedText !== "") {
        setSearchText(selectedText);
      }
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleCloseEvent = (e) => {
    closeDialog();
  };

  useEffect(() => {
    !pageFindState.isOpen && closeDialog();

    document.addEventListener("openFindDialogFromEditor", handleOpenEvent);
    document.addEventListener("closeFindDialogFromEditor", handleCloseEvent);

    return () => {
      document.removeEventListener("openFindDialogFromEditor", handleOpenEvent);
      document.removeEventListener(
        "closeFindDialogFromEditor",
        handleCloseEvent,
      );
    };
  }, [pageFindState.isOpen]);

  useEffect(() => {
    editor.commands.setCaseSensitive(caseSensitive.isCaseSensitive);
    editor.commands.resetIndex();
    goToSelection();
  }, [caseSensitive]);

  const resultsCount = useMemo(
    () =>
      searchText.trim() === ""
        ? ""
        : editor?.storage?.searchAndReplace?.results.length > 0
        ? editor?.storage?.searchAndReplace?.resultIndex +
          1 +
          "/" +
          editor?.storage?.searchAndReplace?.results.length
        : t("Not found"),
    [
      searchText,
      editor?.storage?.searchAndReplace?.resultIndex,
      editor?.storage?.searchAndReplace?.results.length,
    ],
  );

  const location = useLocation();
  // On every navigation (including initial mount): open with highlight or close
  useEffect(() => {
    const query = new URLSearchParams(location.search).get("highlight");
    if (query) {
      setPageFindState({ isOpen: true });
      setSearchText(query);

      // Retry until decorations appear (Yjs content may load after dialog mounts)
      let attempts = 0;
      const tryScroll = () => {
        const el = document.querySelector(".search-result-current");
        if (el) {
          // Place cursor at match so ProseMirror scrollIntoView tracks this position,
          // preventing any later transaction from jumping back to position 0 (top).
          const results = editor?.storage?.searchAndReplace?.results;
          if (results?.[0]) {
            editor.commands.setTextSelection({
              from: results[0].from,
              to: results[0].from,
            });
          }
          el.scrollIntoView({ block: "center" });
          return;
        }
        if (++attempts < 10) setTimeout(tryScroll, 200);
      };
      setTimeout(tryScroll, 100);
    } else {
      closeDialog();
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog
      className={classes.findDialog}
      opened={pageFindState.isOpen}

      size="lg"
      radius="md"
      w={"auto"}
      position={{ top: 90, right: 50 }}
      withBorder
      transitionProps={{ transition: "slide-down" }}
    >
      <Stack gap="xs">
        <Flex align="center" gap="xs">
          <Input
            ref={inputRef}
            placeholder={t("Find")}
            leftSection={<IconSearch size={16} />}
            rightSection={
              <Text size="xs" ta="right">
                {resultsCount}
              </Text>
            }
            rightSectionWidth="70"
            rightSectionPointerEvents="all"
            size="xs"
            w={220}
            onChange={searchInputEvent}
            value={searchText}
            autoFocus
            onKeyDown={getHotkeyHandler([
              ["Enter", next],
              ["shift+Enter", previous],
              ["alt+C", caseSensitiveToggle],
              //@ts-ignore
              ...(editable ? [["alt+R", replaceButtonToggle]] : []),
            ])}
          />

          <ActionIcon.Group>
            <Tooltip label={t("Previous match (Shift+Enter)")}>
              <ActionIcon variant="subtle" color="gray" onClick={previous}>
                <IconArrowNarrowUp
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("Next match (Enter)")}>
              <ActionIcon variant="subtle" color="gray" onClick={next}>
                <IconArrowNarrowDown
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("Match case (Alt+C)")}>
              <ActionIcon
                variant="subtle"
                color={caseSensitive.color}
                onClick={() => caseSensitiveToggle()}
              >
                <IconLetterCase
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            {editable && (
              <Tooltip label={t("Replace")}>
                <ActionIcon
                  variant="subtle"
                  color={replaceButton.color}
                  onClick={() => replaceButtonToggle()}
                >
                  <IconReplace
                    style={{ width: "70%", height: "70%" }}
                    stroke={1.5}
                  />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t("Close (Escape)")}>
              <ActionIcon variant="subtle" color="gray" onClick={closeDialog}>
                <IconX style={{ width: "70%", height: "70%" }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
        </Flex>
        {replaceButton.isReplaceShow && editable && (
          <Flex align="center" gap="xs">
            <Input
              placeholder={t("Replace")}
              leftSection={<IconReplace size={16} />}
              rightSection={<div></div>}
              rightSectionPointerEvents="all"
              size="xs"
              w={180}
              autoFocus
              onChange={replaceInputEvent}
              value={replaceText}
              onKeyDown={getHotkeyHandler([
                ["Enter", replace],
                ["ctrl+alt+Enter", replaceAll],
              ])}
            />
            <ActionIcon.Group>
              <Tooltip label={t("Replace (Enter)")}>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={replace}
                >
                  {t("Replace")}
                </Button>
              </Tooltip>
              <Tooltip label={t("Replace all (Ctrl+Alt+Enter)")}>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={replaceAll}
                >
                  {t("Replace all")}
                </Button>
              </Tooltip>
            </ActionIcon.Group>
          </Flex>
        )}
      </Stack>
    </Dialog>
  );
}

export default SearchAndReplaceDialog;

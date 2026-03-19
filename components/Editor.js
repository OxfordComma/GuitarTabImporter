import { useState, useEffect, useRef } from "react";
import { Textarea } from "@mantine/core";
import { getChordRowRegex } from "@/lib/tabhelper";

function isChordLine(line) {
	return getChordRowRegex().test(line)
}

export default function Editor({ initialText, onTextChange, fontSize=12, disabled=false }) {
	// console.log('editor tab:', tab)

	const [editorText, setEditorText] = useState(initialText);
	// History State
    const [history, setHistory] = useState([initialText]);
    const [pointer, setPointer] = useState(0);
    const textareaRef = useRef(null);

	useEffect(() => {
		setEditorText(initialText);
	}, [initialText]);

	// Update history when text changes (ignoring programmatic updates from undo/redo)
    const updateHistory = (newText) => {
        const newHistory = history.slice(0, pointer + 1);
        setHistory([...newHistory, newText]);
        setPointer(newHistory.length);
    };

	const undo = () => {
        if (pointer > 0) {
            const previousIndex = pointer - 1;
            const previousText = history[previousIndex];
            setPointer(previousIndex);
            setEditorText(previousText);
            onTextChange(previousText);
        }
    };

    const redo = () => {
        if (pointer < history.length - 1) {
            const nextIndex = pointer + 1;
            const nextText = history[nextIndex];
            setPointer(nextIndex);
            setEditorText(nextText);
            onTextChange(nextText);
        }
    };

	const handleKeyDown = (event) => {
        if (disabled) return;

        // --- Manual Undo/Redo (Ctrl/Cmd + Z / Y) ---
        const isMod = event.ctrlKey || event.metaKey;
        if (isMod && event.key === 'z') {
            event.preventDefault();
            if (event.shiftKey) redo(); else undo();
            return;
        }
        if (isMod && event.key === 'y') {
            event.preventDefault();
            redo();
            return;
        }

        if (event.key === "Enter") {
			const textarea = event.currentTarget;
			const selectionStart = textarea.selectionStart;

			const textBefore = editorText.substring(0, selectionStart);
			const textAfter = editorText.substring(selectionStart);

			const linesBefore = textBefore.split("\n");
			const currentLine = linesBefore[linesBefore.length - 1];
			const previousLine = linesBefore[linesBefore.length - 2];

			// Check if we are in a Lyric Line with Chords above
			if (previousLine !== undefined && isChordLine(previousLine) && !isChordLine(currentLine)) {
				event.preventDefault();

				// 1. Where are we horizontally? (The Column)
				const col = currentLine.length;

				// 2. Split the Chord Line at that same column
				const chordsLeft = previousLine.substring(0, col);
				const chordsRight = previousLine.substring(col);

				// 3. Split the Lyric Line (we already have currentLine for left, textAfter for right)
				// But we need to find where the Lyric line actually ends in the full text
				const endOfCurrentLyricLine = selectionStart + (textAfter.split('\n')[0].length);
				const remainingText = editorText.substring(endOfCurrentLyricLine);
				const lyricsRight = textAfter.split('\n')[0];

				// 4. Reconstruct the text
				// [Everything before the block] 
				// + [Chords Left] + \n + [Lyrics Left] 
				// + \n\n (The Gap)
				// + [Chords Right] + \n + [Lyrics Right]
				// + [Everything else]
				
				const beforeBlock = editorText.substring(0, selectionStart - col - 1 - previousLine.length);
				
				const newText = 
					beforeBlock + 
					chordsLeft.trimEnd() + "\n" + 
					currentLine + "\n" + 
					chordsRight + "\n" + 
					lyricsRight + 
					remainingText;

				setEditorText(newText);
				onTextChange(newText);
				updateHistory(newText);

				// 5. Position cursor at the start of the new lyric line
				// (Length of everything before the gap + the gap itself + the new chord line + newline)
				const newCursorPos = 
					beforeBlock.length + 
					chordsLeft.trimEnd().length + 1 + 
					currentLine.length + 1 + // +1 for the newline after lyrics
					chordsRight.length + 1;  // +1 for the newline after chords

				setTimeout(() => {
					textarea.setSelectionRange(newCursorPos, newCursorPos);
				}, 0);
			}
		}
    };

	return (<Textarea
		ref={textareaRef}
		variant='unstyled'
		ml={15} mr={15}
		w="100%"
		styles={{
			root: {
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			},
			wrapper: {
				flex: 1, // Forces the wrapper to take all available space
				display: 'flex',
			},
			input: {
				// flex: 1,
				fontFamily: 'var(--mantine-font-family-monospace)',
				fontSize: `${fontSize+4}px`,
				lineHeight: '1.25',
			},
		}}

		value={editorText}
		onKeyDown={handleKeyDown}
		onChange={(event) => {
			if (!disabled) {
				const val = event.currentTarget.value;
				setEditorText(val);
				onTextChange(val);
				updateHistory(val); // Push to history
			}
		}}
		style={{ caretColor: disabled ? 'transparent' : null}}
		spellCheck={false}

	>

	</Textarea>)
}

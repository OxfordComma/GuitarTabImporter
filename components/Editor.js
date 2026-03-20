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
    const [history, setHistory] = useState([{ text: initialText, cursor: 0 }]);
    const [pointer, setPointer] = useState(0);
    const textareaRef = useRef(null);

	useEffect(() => {
		setEditorText(initialText);
	}, [initialText]);

	// Update history when text changes (ignoring programmatic updates from undo/redo)
    const updateHistory = (newText, customCursor = null) => {
		// Grab the custom cursor if provided, otherwise grab the textarea's current cursor
		const cursorPos = customCursor !== null ? customCursor : (textareaRef.current?.selectionStart || 0);
		
		const newHistory = history.slice(0, pointer + 1);
		setHistory([...newHistory, { text: newText, cursor: cursorPos }]);
		setPointer(newHistory.length);
	};

	const debounceTimer = useRef(null);

	const updateHistoryDebounced = (newText) => {
		// Clear any existing timer
		if (debounceTimer.current) clearTimeout(debounceTimer.current);

		// Set a new timer
		debounceTimer.current = setTimeout(() => {
			const cursorPos = textareaRef.current?.selectionStart || 0;
			const newHistory = history.slice(0, pointer + 1);
			
			setHistory([...newHistory, { text: newText, cursor: cursorPos }]);
			setPointer(newHistory.length);
		}, 500); // 500ms is usually the "sweet spot"
	};

	const undo = () => {
		if (pointer > 0) {
			const previousIndex = pointer - 1;
			const previousState = history[previousIndex]; // Now an object
			
			setPointer(previousIndex);
			setEditorText(previousState.text);
			onTextChange(previousState.text);

			// Restore cursor position after the text renders
			setTimeout(() => {
				textareaRef.current?.setSelectionRange(previousState.cursor, previousState.cursor);
			}, 0);
		}
	};

	const redo = () => {
		if (pointer < history.length - 1) {
			const nextIndex = pointer + 1;
			const nextState = history[nextIndex]; // Now an object
			
			setPointer(nextIndex);
			setEditorText(nextState.text);
			onTextChange(nextState.text);

			// Restore cursor position after the text renders
			setTimeout(() => {
				textareaRef.current?.setSelectionRange(nextState.cursor, nextState.cursor);
			}, 0);
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

				// 5. Position cursor at the start of the new lyric line
				// (Length of everything before the gap + the gap itself + the new chord line + newline)
				const newCursorPos = 
					beforeBlock.length + 
					chordsLeft.trimEnd().length + 1 + 
					currentLine.length + 1 + // +1 for the newline after lyrics
					chordsRight.length + 1;  // +1 for the newline after chords
				
				updateHistory(newText, newCursorPos);

				setTimeout(() => {
					textarea.setSelectionRange(newCursorPos, newCursorPos);
				}, 0);
			}
		}

		if (event.key === "Backspace") {
			const textarea = event.currentTarget;
			const selectionStart = textarea.selectionStart;

			// Only trigger if no text is highlighted and we are at the exact start of a line
			if (selectionStart !== textarea.selectionEnd) return;
			const textBefore = editorText.substring(0, selectionStart);
			if (!textBefore.endsWith('\n') && selectionStart !== 0) return; 

			const lines = editorText.split("\n");
			// Find our current line index based on how many newlines are before the cursor
			const currIdx = (textBefore.match(/\n/g) || []).length;

			if (lines[currIdx].trim() === "") return;

			let chordAIdx = -1, lyricAIdx = -1, chordBIdx = -1, lyricBIdx = -1;
			let cursorOnLyric = false;

			// Scenario 1: Backspacing at the start of a Lyric line
			if (currIdx >= 1 && !isChordLine(lines[currIdx]) && isChordLine(lines[currIdx - 1])) {
				cursorOnLyric = true;
				lyricBIdx = currIdx;
				chordBIdx = currIdx - 1;

				// Scan upwards past any empty lines to find the previous couplet (Couplet A)
				let i = currIdx - 2;
				while (i >= 0 && lines[i].trim() === "") i--;
				if (i >= 1 && !isChordLine(lines[i]) && isChordLine(lines[i - 1])) {
					lyricAIdx = i;
					chordAIdx = i - 1;
				}
			}
			// Scenario 2: Backspacing at the start of a Chord line
			else if (isChordLine(lines[currIdx]) && currIdx + 1 < lines.length && !isChordLine(lines[currIdx + 1])) {
				cursorOnLyric = false;
				chordBIdx = currIdx;
				lyricBIdx = currIdx + 1;

				// Scan upwards past any empty lines to find the previous couplet (Couplet A)
				let i = currIdx - 1;
				while (i >= 0 && lines[i].trim() === "") i--;
				if (i >= 1 && !isChordLine(lines[i]) && isChordLine(lines[i - 1])) {
					lyricAIdx = i;
					chordAIdx = i - 1;
				}
			}

			// If we successfully found two couplets to merge...
			if (chordAIdx !== -1 && lyricAIdx !== -1) {
				event.preventDefault();

				const chordA = lines[chordAIdx];
				const lyricA = lines[lyricAIdx];
				const chordB = lines[chordBIdx];
				const lyricB = lines[lyricBIdx];

				// 1. Calculate the padding offset based on the LONGEST line of Couplet A
				// This ensures the merged chords and lyrics stay perfectly aligned with each other
				const offset = Math.max(chordA.length, lyricA.length);
				
				// 2. Pad Couplet A with spaces so both lines end at the exact same horizontal point
				const mergedChord = chordA.padEnd(offset, " ") + " " + chordB.trimStart();
				const mergedLyric = lyricA.padEnd(offset, " ") + " " + lyricB.trimStart();

				// 3. Rebuild the document array
				const newLines = [];
				for (let j = 0; j < lines.length; j++) {
					if (j === chordAIdx) newLines.push(mergedChord);
					else if (j === lyricAIdx) newLines.push(mergedLyric);
					else if (j > lyricAIdx && j < chordBIdx) continue; // Erase gap between couplets
					else if (j === chordBIdx || j === lyricBIdx) continue; // Erase original Couplet B
					else newLines.push(lines[j]);
				}

				const newText = newLines.join("\n");
				setEditorText(newText);
				onTextChange(newText);

				// 4. Calculate exact cursor landing spot
				const linesBeforeTarget = newLines.slice(0, chordAIdx);
				const basePos = linesBeforeTarget.length > 0 ? linesBeforeTarget.join("\n").length + 1 : 0;

				const newCursorPos = cursorOnLyric
					? basePos + mergedChord.length + 1 + offset + 1 // Land exactly on the lyric split
					: basePos + offset;                             // Land exactly on the chord split

				updateHistory(newText, newCursorPos);

				setTimeout(() => {
					textarea.setSelectionRange(newCursorPos, newCursorPos);
				}, 0);
			}
		}

		if (event.key === "Tab") {
			event.preventDefault(); // Prevent focus from leaving the textarea
			const textarea = event.currentTarget;
			const selectionStart = textarea.selectionStart;
			const selectionEnd = textarea.selectionEnd;
			const tabSize = 4;
			const spaces = " ".repeat(tabSize);

			// Insert spaces at the cursor (handles highlighted text replacement too)
			const newText = 
				editorText.substring(0, selectionStart) + 
				spaces + 
				editorText.substring(selectionEnd);

			const newCursorPos = selectionStart + tabSize;

			// Update UI
			setEditorText(newText);
			onTextChange(newText);

			// Push an immediate snapshot to history for a clean Undo
			updateHistory(newText, newCursorPos);

			// Reposition cursor
			setTimeout(() => {
				textarea.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);
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
				// updateHistory(val); // Push to history
				updateHistoryDebounced(val);
			}
		}}
		style={{ caretColor: disabled ? 'transparent' : null}}
		spellCheck={false}

	>

	</Textarea>)
}

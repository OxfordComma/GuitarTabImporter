import { useState, useEffect } from "react";
import { Textarea } from "@mantine/core";

export default function Editor({ initialText, onTextChange, disabled=false }) {
	// console.log('editor tab:', tab)

	const [editorText, setEditorText] = useState(initialText);

	useEffect(() => {
		setEditorText(initialText);
	}, [initialText]);

	return (<Textarea
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
				fontSize: '12px',
				lineHeight: '1.25',
			},
		}}

		value={editorText}
		onChange={(event) => {
			if (!disabled) {
				const val = event.currentTarget.value
				setEditorText(val)
				onTextChange(val)
			}
		}}
		style={{ caretColor: disabled ? 'transparent' : null}}
		spellCheck={false}

	>

	</Textarea>)
}

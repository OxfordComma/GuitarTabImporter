export function getChordRowRegex() {
	return /^ *?(([A-G/\\\(\) ]|NC)#?b?6?m?(sus|min|maj|add|x)?[0-9]*)+?$/g
}

export function getLineDelimiter() {
	return /\r|\r\n|\n/
}

export function formatRawTabs(rawTabs, chordsPerLine=2) {
	console.log('raw tabs:', { rawTabs })
	//Remove [ch][/ch] around chords
	rawTabs = rawTabs.replace(/(\[ch\]|\[\/ch\])/g, '');
	//Remove anything before an [Intro] tag
	rawTabs = rawTabs.replace(/[\s\S]*?(?=\n.*?\[intro\])/i, '');
	//Remove ellipses
	rawTabs = rawTabs.replace(/(\.\.\.|…)/g, ' ');
	//Remove [Intro], [Verse], etc
	// rawTabs = rawTabs.replace(/(\[(intro|verse[s]?( \d+)?|chorus|bridge|outro|hook|instrumental|interlude|pre-?chorus|break|refrain|solo)\ ?\d?\]\n?)/gi, '');
	rawTabs = rawTabs.replace(/\[.{3,20}\]/gi, '')
	// Remove periods, question marks, brackets, and commas
	rawTabs = rawTabs.replace(/(\?|!|\?|,|"|\.|:|\||\*)/g, '');
	// Remove this [tab] [/tab] thing that's coming up now
	rawTabs = rawTabs.replace(/\[\/?tab\]/g, '')
	// Remove any extra lines
	rawTabs = rawTabs.replace(/(\r|\n)[\r\n]*/g, '\n')
	// Remove special characters
	rawTabs = rawTabs.replace(/[\u200B-\u200D\uFEFF]/g, '');

	console.log('replaced chars in tabs:', {rawTabs})
	var rawTabRows = rawTabs.split(/\n/).filter(d => d != '')
	// Replace single spaces with newlines
	// rawTabsSplit = rawTabsSplit.map(r => r == ' ' ? '\n' : r)
	rawTabRows = rawTabRows.filter(i => !([' ', ''].includes(i.trim())))
	console.log('raw tabs rows:', [...rawTabRows])
	let newTabRows = [...rawTabRows]

	let chordRowRegex = getChordRowRegex()

	// Length - 1 so that we don't check after the last row

	for (var i = 0; i < newTabRows.length - 1; i++) {
		let previousRow = ''
		if (i > 0) previousRow = newTabRows[i-1]
		var currentRow = newTabRows[i]
		var nextRow = newTabRows[i+1]
		// Check for chords on the next line with spaces at the front
		// If this matches, we're in a chord row that needs to be moved
		if (currentRow.match(chordRowRegex) && !previousRow.match(chordRowRegex)) { //} && !currentRow.match(/[\(\)]/)  ) {

			var numSpaces = currentRow.search(/\S/)
			var lastSpaceInLyric = nextRow.substring(0, numSpaces).lastIndexOf(' ')

			if (numSpaces > 0) {

				console.log('moving lyrics with spaces in front', {
					previousRow, currentRow, nextRow, numSpaces, lastSpaceInLyric
				})

				var nextLineText = nextRow.substring(0, lastSpaceInLyric).toLowerCase()//.trim()
				
				// Break only on spaces
				// nextLineText = nextLineText.substring(0, nextLineText.lastIndexOf(' ') + 1)

				newTabRows[i] = newTabRows[i].substring(lastSpaceInLyric).trim()
				// if (previousRow.match(chordRowRegex)) 
					// newTabRows[i] += '\n'
				newTabRows[i-1] = newTabRows[i-1] + ' ' + nextLineText
				newTabRows[i+1] = newTabRows[i+1].substring(lastSpaceInLyric).trim()
			}

		}
	}
	newTabRows = newTabRows.filter(n => n != '')
	console.log('leading words moved:', [...newTabRows])

	// Check for two lyric rows not separated by chords
	for (var i = 0; i < newTabRows.length - 1; i++) {
		var currentRow = newTabRows[i]
		var nextRow = newTabRows[i+1]
		
		if (!currentRow.match(chordRowRegex) && !currentRow.match(/[\(\)]/) && !nextRow.match(chordRowRegex)  ) {
			console.log('lyric rows not separated by chords', {
				currentRow, nextRow, currentRowMatch: currentRow.match(chordRowRegex), nextRowMatch: nextRow.match(chordRowRegex)
			})
			console.log('current row', currentRow, currentRow.match(chordRowRegex))
			newTabRows[i] = `${currentRow} ${nextRow}`
			newTabRows[i+1] = ''
		}
	}
	newTabRows = newTabRows.filter(n => n != '')
	console.log('consolidated lyrics', [...newTabRows])

	// Find short chord groups to move
	for (var i = 0; i < newTabRows.length-3; i++) {
		let previousRow = ''
		if (i > 0) previousRow = newTabRows[i-1]
		var currentRow = newTabRows[i]
		var nextRow = newTabRows[i+1] ?? ''
		var thirdRow = newTabRows[i+2] ?? ''
		var fourthRow = newTabRows[i+3] ?? ''

		// // Need to check the chords/lyrics that will be moving up

		// if (thirdRow.match(chordRowRegex) && fourthRow.match(chordRowRegex)) {
		// 	continue
		// }

		let chords = currentRow.split(' ').filter(i => i != '')
		let chordCount = chords.length

		if (currentRow.match(chordRowRegex) && !currentRow.match(/[\(\)]/) && !nextRow.match(chordRowRegex) && !fourthRow.match(chordRowRegex) && chordCount < chordsPerLine) {
			let currentRowMatch = currentRow.match(chordRowRegex)
			let nextRowMatch = nextRow.match(chordRowRegex)
			
			console.log('moving short chord rows', {
				currentRow, currentRowMatch, nextRow, nextRowMatch, thirdRow, fourthRow, chordCount
			})

			// Move the next chord row up
			let repeatCount = nextRow.trim().length - currentRow.length + 1
			if (repeatCount < 0) 
				repeatCount = 0

			newTabRows[i] = currentRow + " ".repeat(repeatCount) + thirdRow
			// Move the next lyric row up
			newTabRows[i+1] = nextRow.trim() + ' ' + fourthRow.trim().toLowerCase()
			newTabRows[i+2] = ''
			newTabRows[i+3] = ''
		}

		if (!currentRow.match(chordRowRegex) && !currentRow.match(/[\(\)]/) )
			newTabRows[i] = newTabRows[i].toLowerCase()
	}

	newTabRows = newTabRows.filter(i => ![' ', ''].includes(i))

	console.log(newTabRows)
	return newTabRows.join('\n');

}

export function convertChordsIntoTabs(rawTabs) {
	var rawTabRows = rawTabs.split(/\n/).filter(d => d != '').map(d => d.trim())

	let chordListStrings = []
	// Create a chord list
	for (var i = 0; i < rawTabRows.length; i++) {
		var currentRow = rawTabRows[i]
		if (currentRow.match(/[Xx0-9]{6,12}/) ) {
			// console.log('parseChordLine', parseChordLine(currentRow))
			chordListStrings.push(currentRow)
		}

	}

	console.log('chord list strings', chordListStrings)
	if (chordListStrings.length > 0) {
		let newChordList = parseChordLines(chordListStrings)
		console.log(newChordList)
		rawTabRows = rawTabRows.filter(i => !chordListStrings.includes(i))
		rawTabRows = [...rawTabRows, ...newChordList.split('\n')]

	}
	return rawTabRows.join('\n');

}

export function showWarning(fontSize, len) {
	const coef = -59.9273 + (35.2909 * fontSize) - (2.36364 * (fontSize * fontSize) )
	// console.log('coef', len, coef)
	return (
    // -2.67273 + (22.3091 * fontSize) - (1.63636 * (fontSize * fontSize) )
    coef + 1
  ) < len
}


export function getChordList(text) {
    let chordRowRegex = getChordRowRegex()   
	let rows = text.split(/[\r\n]+/).filter(d => d != '')

	let allChords = []
    // console.log('rows', rows)
    rows = rows.filter(r => r.match(chordRowRegex)).map(r => {
      let chords = r.split(' ').filter(d => (d != '') && (d.match(/x/g) === null) )
    //   console.log('adding chords', r, chords)
      allChords.push(chords)
    })		
    let allChordsSorted = [...new Set(allChords.flat())]
    // console.log('allChordsSorted', allChordsSorted)
	return allChordsSorted
}

function parseChordLines(lines) {
  const chordLines = lines.map(line => line.replace(/–|-/, '').split(/\s+/));
  const maxChordLength = chordLines
  	.reduce((max, line) => Math.max(max, line[0].length), 0);
  const strings = Array.from({ length: 6 }, () => []);

  console.log({
  	chordLines,
  	maxChordLength,
  	strings
  })

  let chords = []

  chordLines.forEach(line => {
    let [chordName, frets] = line;
    console.log({
	  	chordName,
	  	frets,
	  })
    frets = frets.replace(/[\(\)]/, '');
    chords.push(chordName.padEnd(maxChordLength+1, ' '))
    for (let i = 0; i < 6; i++) {
      const fret = frets[i] || 'x';
      strings[i].push(fret.padEnd(maxChordLength, '-'));
    }
  });

  let result = strings.reverse().map((string, index) => {
    const stringName = ['e', 'B', 'G', 'D', 'A', 'E'][index];
    return `${stringName}|--${string.join('-')}--|`;
  }).join('\n');

  result = result + '\n   ' + chords.join('')

  return result;
}

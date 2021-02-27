const pupp = require( "puppeteer" );

async function getSong( url ) {
	const browser = await pupp.launch({
	  args: [
	    '--no-sandbox',
	    '--disable-setuid-sandbox',
	  ],
	});
	const page = await browser.newPage();

	await page.goto( url );

	let song = await page.evaluate( () => { 

			let tab_view = window.UGAPP.store.page.data.tab_view;
			let tab = window.UGAPP.store.page.data.tab;

			let tuning;
			let difficulty;

			if ( tab_view && tab_view.meta ) {
				tuning = tab_view.meta.tuning;
				difficulty = tab_view.meta.difficulty;
			}

			if  ( !tuning ) {
				tuning = [ "E", "A", "D", "G", "B", "E" ];
			} else {
				tuning = tuning.value.split( " " );
			}

			if ( !difficulty ) {
				difficulty = "unknown";
			}

			if ( !tab ) {
				return {};
			}

			return {
				artist: tab.artist_name,
				song_name: tab.song_name,
				tab_url: tab.tab_url,
				difficulty: difficulty,
				tuning: tuning,
				raw_tabs: tab_view.wiki_tab.content
			}
		} );
	return song

};

function formatRawTabs(rawTabs) {
	//Remove [ch][/ch] around chords
	rawTabs = rawTabs.replace(/(\[ch\]|\[\/ch\])/g, '');
	//Remove anything before an [Intro] tag
	rawTabs = rawTabs.replace(/[\s\S]*?(?=\n.*?\[intro\])/i, '');
	//Remove ellipses
	rawTabs = rawTabs.replace(/(\.\.\.|…)/g, ' ');
	//Remove [Intro], [Verse], etc
	rawTabs = rawTabs.replace(/(\[(intro|verse[s]?|chorus|bridge|outro|hook|instrumental|interlude|pre-?chorus)\ ?\d?\]\n?)/gi, '');
	// Remove periods, question marks, and commas
	rawTabs = rawTabs.replace(/(\?|,|\.|:|\||\*)/g, '');
	// Remove this [tab] [/tab] thing that's coming up now
	rawTabs = rawTabs.replace(/\[\/?tab\]/g, '')
	// Remove any extra lines
	rawTabs = rawTabs.replace(/\r?\n( *\r?\n)?/g, '\r\n')

	var rawTabsSplit = rawTabs.split(/\r\n/).filter(d => d != '')
	console.log(rawTabsSplit)
	// Length - 1 so that we don't check after the last row
	for (var i = 0; i < rawTabsSplit.length - 1; i++) {
		var currentRow = rawTabsSplit[i]
		var nextRow = rawTabsSplit[i+1]
		// console.log(currentRow)

		// Check for chords on the next line with spaces at the front
		// If this matches, we're in a chord row that needs to be moved
		if (currentRow.match(/^ +[A-G]/g)) {
			var numSpaces = currentRow.search(/\S/)

			var nextLineText = nextRow.substring(0, numSpaces).toLowerCase().trim()
			// console.log(nextLineText)

			// Break only on spaces
			// nextLineText = nextLineText.substring(0, nextLineText.lastIndexOf(' ') + 1)

			rawTabsSplit[i] = rawTabsSplit[i].substring(numSpaces).trim()
			rawTabsSplit[i-1] = rawTabsSplit[i-1] + ' ' + nextLineText
			rawTabsSplit[i+1] = rawTabsSplit[i+1].substring(numSpaces).trim()

		}
	}

	console.log(rawTabsSplit)
	return rawTabsSplit.join('\r\n');
}

module.exports = {
	getSong: getSong,
	formatRawTabs: formatRawTabs
};
const pupp = require( "puppeteer" );
// Test URL

export default async function handler(req, res) {

	var song = await getSong(req.query.url)
	var artist = song.artist;
	var songName = song.song_name;
	var tabs = formatRawTabs(song.raw_tabs);

	res.send({
		artist: artist,
		songName: songName,
		tabs: tabs,
	})

}

async function getSong(url) {

	const browser = await pupp.launch({
	  args: [
	    '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
	  ],
	});
	try {
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
		});
		return song
	}
	catch (e) {
		console.log(e)
	}
	finally {
		await browser.close()
	}
}

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
			var lastSpaceInLyric = nextRow.substring(0, numSpaces).lastIndexOf(' ')

			var nextLineText = nextRow.substring(0, lastSpaceInLyric).toLowerCase().trim()
			// console.log(nextLineText)

			// Break only on spaces
			// nextLineText = nextLineText.substring(0, nextLineText.lastIndexOf(' ') + 1)

			rawTabsSplit[i] = rawTabsSplit[i].substring(lastSpaceInLyric).trim()
			rawTabsSplit[i-1] = rawTabsSplit[i-1] + ' ' + nextLineText
			rawTabsSplit[i+1] = rawTabsSplit[i+1].substring(lastSpaceInLyric).trim()

		}
	}

	console.log(rawTabsSplit)
	return rawTabsSplit.join('\r\n');
}


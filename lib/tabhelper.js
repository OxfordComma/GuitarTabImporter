// // const pupp = require( "puppeteer-core" );
// const chromium = require('chrome-aws-lambda');
// const puppeteer = require('puppeteer-extra')
// // Test URL
// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin())


// async function getSong(url) {
// 	let proxies = ['https://us8281.nordvpn.com:89', 'https://us5087.nordvpn.com:89']
// 	let proxy = proxies[Math.floor(Math.random()*proxies.length)]
// 	let browser = await chromium.puppeteer.launch({
// 	// let browser = await puppeteer.launch({
//     args: [
// 	    '--no-sandbox',
//       '--disable-dev-shm-usage',
//       '--single-process',
//       '--disable-setuid-sandbox',
//       '--disable-infobars',
//       '--window-position=0,0',
//       '--ignore-certifcate-errors',
//       '--ignore-certifcate-errors-spki-list',
//       '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"'
// 	  ],

//     // args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
//   	args: ['--proxy-server='+proxy],

//     // defaultViewport: chromium.defaultViewport,
//     // executablePath: await chromium.executablePath,
//     headless: false,
//     ignoreHTTPSErrors: true,
//   });

// 	// const browser = await chromium.puppeteer.launch({
// 	//   args: [
// 	//     '--no-sandbox',
//   //     '--disable-setuid-sandbox',
//   //     '--disable-infobars',
//   //     '--window-position=0,0',
//   //     '--ignore-certifcate-errors',
//   //     '--ignore-certifcate-errors-spki-list',
//   //     '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
// 	//   ],
// 	// });
// 	const page = await browser.newPage();
// 	try {

// 		 await page.authenticate({
//         username: process.env.PROXY_USERNAME,
//         password: process.env.PROXY_PASSWORD,
//     });


// 		await page.goto( url, { waitUntil: 'domcontentloaded' } );

// 		// await page.waitForTimeout(5 * 1000)
// 		// await page.evaluate(() => window.stop())
// 		// await page.waitForNavigation()


// 		let song = await page.evaluate( () => {
// 			// window.stop();

// 			let tab_view = window.UGAPP.store.page.data.tab_view;
// 			let tab = window.UGAPP.store.page.data.tab;

// 			let tuning;
// 			let difficulty;

// 			if ( tab_view && tab_view.meta ) {
// 				tuning = tab_view.meta.tuning;
// 				difficulty = tab_view.meta.difficulty;
// 			}

// 			if  ( !tuning ) {
// 				tuning = [ "E", "A", "D", "G", "B", "E" ];
// 			} else {
// 				tuning = tuning.value.split( " " );
// 			}

// 			if ( !difficulty ) {
// 				difficulty = "unknown";
// 			}

// 			if ( !tab ) {
// 				return {};
// 			}

// 			return {
// 				artist: tab.artist_name,
// 				song_name: tab.song_name,
// 				tab_url: tab.tab_url,
// 				difficulty: difficulty,
// 				tuning: tuning,
// 				raw_tabs: tab_view.wiki_tab.content
// 			}
// 		});
// 		return song
// 	}
// 	catch (e) {
// 		console.log(e)
// 	}
// 	finally {
// 		page.waitForTimeout(10 * 1000).then(() => {
// 			console.log('Closing browser')
// 			browser.close()
// 		})
// 	}
// }

export function formatRawTabs(rawTabs) {
	//Remove [ch][/ch] around chords
	rawTabs = rawTabs.replace(/(\[ch\]|\[\/ch\])/g, '');
	//Remove anything before an [Intro] tag
	rawTabs = rawTabs.replace(/[\s\S]*?(?=\n.*?\[intro\])/i, '');
	//Remove ellipses
	rawTabs = rawTabs.replace(/(\.\.\.|…)/g, ' ');
	//Remove [Intro], [Verse], etc
	rawTabs = rawTabs.replace(/(\[(intro|verse[s]?|chorus|bridge|outro|hook|instrumental|interlude|pre-?chorus|break)\ ?\d?\]\n?)/gi, '');
	// Remove periods, question marks, and commas
	rawTabs = rawTabs.replace(/(\?|!|\?|,|\.|:|\||\*)/g, '');
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

	// Find short chord groups to move
	for (var i = 0; i < rawTabsSplit.length - 1; i++) {
		var currentRow = rawTabsSplit[i]
		var nextRow = rawTabsSplit[i+1] ?? ''
		var thirdRow = rawTabsSplit[i+2] ?? ''
		var fourthRow = rawTabsSplit[i+3] ?? ''

		// Need to check the chords/lyrics that will be moving up

		if (thirdRow.match(/^[A-Gb#m7su]+( |$)/gm) && fourthRow.match(/^[A-Gb#m7su]+( |$)/gm)) {
			continue
		}

		if (currentRow.match(/^[A-Gb#m7su]+( |$)/gm) && currentRow.split(' ').filter(i => i != '').length <= 2) {
			// Move the next chord row up
			let repeatCount = nextRow.trim().length - currentRow.length + 1
			if (repeatCount < 0) 
				repeatCount = 0

			rawTabsSplit[i] = currentRow + " ".repeat(repeatCount) + thirdRow
			// Move the next lyric row up
			rawTabsSplit[i+1] = nextRow.trim() + ' ' + fourthRow.trim().toLowerCase()
			rawTabsSplit[i+2] = ''
			rawTabsSplit[i+3] = ''
		}
	}
	rawTabsSplit = rawTabsSplit.filter(i => i != '')

	console.log(rawTabsSplit)

	return rawTabsSplit.join('\r\n');
}

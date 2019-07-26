const pupp = require( "puppeteer" );

async function getSong( url ) {
	const browser = await pupp.launch({ args: ['--no-sandbox'] });
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

module.exports = {
	getSong: getSong
};
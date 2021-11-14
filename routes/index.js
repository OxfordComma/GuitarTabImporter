const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {

	// Check authentication
	if (req.session.passport && req.session.passport.user) {
      res.redirect('/import')
  }
  else {
      res.redirect('/auth/googledrive')  	
  }
});

module.exports = router;

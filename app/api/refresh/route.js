import { auth } from 'auth'
import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
import { headers } from "next/headers"

// export async function GET(request, { params }) {
// 	console.log('GET', {
// 		request,
// 		params
// 	})
    

// }

export async function POST(request, { params }) {
	// console.log('POST', {
	// 	request,
	// 	// params
	// })

  const searchParams = request.nextUrl.searchParams
  	
  if (!searchParams.get('id')) {
		return Response.json({ })
	}
	
  // let body = await request.json()
  // console.log('body:', body)
  // let session = body.session
  let session = await auth()

	// let account = await fetch(`${process.env.NEXTAUTH_URL}/api/account?id=${searchParams.get('id')}`).then(r => r.json())

  let mongoClient = await clientPromise

  // Fetch account from DB
  var db = await mongoClient.db('tabr')
	var accounts = await db.collection('accounts')
	var account = await accounts.findOne({ 
		userId: new ObjectId(searchParams.get('id')),
		provider: 'google'
	})
	// console.log(account)

  console.log({
    // body, 
    // session, 
    account
  })

  if (!account) {
      // check for invalid stuff
    return Response.json({
      refresh: 0
    })
  }

  let refreshResponse = await fetch(`https://www.googleapis.com/oauth2/v4/token`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: session.client_id,
      client_secret: session.client_secret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    })
  }).then(r => r.json())
  // console.log('refreshResponse', refreshResponse)
  
  let expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + refreshResponse.expires_in)

  return Response.json({
    // refresh: 1,
    ...account,
    access_token: refreshResponse.access_token,
    expires_at: parseInt(expiresAt.valueOf() / 1000),
  })
}

import clientPromise from "lib/db.js"
import { ObjectId } from 'mongodb'
// import { getSession } from "next-auth/react"
import { auth } from 'auth'

export async function GET(request, { params }) {
	console.log('GET', {
		// request,
		params
	})
    const searchParams = request.nextUrl.searchParams
    console.log('searchParams', searchParams)

    if (!searchParams.get('id'))  {
        if (!searchParams.get('userid'))  {
            return Response.json({ })
        }
        
        return Response.json({
            _id: new ObjectId(),
            // id: Math.random().toString(16).slice(2),
            name: 'New Project',
            owner: new ObjectId(searchParams.get('userid')),
            creator: new ObjectId(searchParams.get('userid')),
            collaborators: [],
            folder: null,
        })
    }
    let mongoClient = await clientPromise

    let db = await mongoClient.db('tabr')
    let cl = await db.collection('projects')

    let project = await cl.findOne({ 
        _id: new ObjectId( searchParams.get('id') )
    })

    if (!('_id' in project)) {
        return Response.json({ })
    }
		
    return Response.json(
        project
    )
}


export async function POST(request, { params }) {
    const searchParams = request.nextUrl.searchParams
    let body = await request.json()
    console.log('project post body', body)
	
    // if (!searchParams.get('id'))  {
    //     return Response.json({ })
    // }

    let mongoClient = await clientPromise
	var db = await mongoClient.db('tabr')
	var projects = await db.collection('projects')
	
    let newProject = {
        "_id": new ObjectId(body._id),
        "id": body.id,
        "creator": new ObjectId(body.creator),
        "folder": body.folder,
        "name": body.name,
        "owner": new ObjectId(body.owner),
        "collaborators": body.collaborators,
        "pinnedTabs": body.pinnedTabs,
        "spotifyPlaylistId": body.spotifyPlaylistId,
      }

      var update = await projects.updateOne({ 
            _id: new ObjectId(newProject._id)
        }, {
            '$set': newProject
        }, {
            upsert: true,
        }
    )

    return Response.json({
       newProject
    })
}

export async function DELETE(request, { params }) {
    let body = await request.json()
    const searchParams = request.nextUrl.searchParams
    let _id = body._id
    if (!_id) {
        return Response.json({ }, { status: 500 })
    }

    let mongoClient = await clientPromise

    let db = await mongoClient.db('tabr')
    let tabs = await db.collection('projects')

    var tab = await tabs.findOneAndDelete({ 
        _id: new ObjectId(_id)
    })

    return Response.json(
        tab
    )

}
    

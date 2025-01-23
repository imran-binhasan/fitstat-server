const express = require('express');
const cors = require('cors');
const {configDotenv} = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { availableMemory } = require('process');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;
configDotenv()

const uri = process.env.CONNECTION_STRING;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  async function run() {
    try {

    const database = client.db('fitstat-db');
    const userList = database.collection('userList');
    const classList = database.collection('classList');
    const forumList = database.collection('forumList');
    const newsLetterSubscribersList = database.collection('newsletter-subscribers-list');

    // GET USER DATA
    app.get('/users', async(req,res) => {
        const result = await userList.find().toArray();
        res.send(result)
    })

    // GET THE USER
    app.get('/user', async(req,res) => {
        const query = req.query.email;
        const result = await userList.findOne({email:query})
        res.send(result)
    })

    // GET APPLICATION LISTS
    app.get('/users/applications', async(req,res) => {
        const result = await userList.find({status: 'pending'}).project({name:1,email:1}).toArray();
        res.send(result)
    })

    // GET APPLICATION DETAIL
    app.get('/users/application/:id', async(req, res) => {
        const id = req.params.id;
        const result = await userList.findOne({_id: new ObjectId(id)});
        res.send(result);
    })

    // ADMIN APPROVE TRAINER REQ
    app.patch('/application/accept/:id', async(req,res) => {
        const id = req.params.id;
            const result= await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    status:req.body.status,
                    role:req.body.role
                }
        })
        
        res.send(result)
    })


     // ADMIN REJECT TRAINER
     app.patch('/application/reject/:id', async(req,res) => {
        const id = req.params.id;
            const result= await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    status:req.body.status,
                    feedback:req.body.feedback
                }
        });
        console.log(req.body)
        
        res.send(result)
            })

    // ALL TRAINERS 
    app.get('/trainers', async(req, res) => {
        const result = await userList.find({role:'trainer'}).toArray();
        res.send(result)
    });

    // FETCH CLASS DATA OR TRAINER
    app.get('/trainers/:name', async(req, res) => {
        const name = req.params.name.toLowerCase();
        const result = await userList.find({skills:name}).toArray();
        console.log(result)
        res.send(result);
    })

    // TRAINER DETAILS
    app.get('/trainer/:id', async(req,res) => {
        console.log(req.params.id)
        const result = await userList.find({_id: new ObjectId(req.params.id)}).toArray();
        res.send(result);
    })

    // REMOVE A REMOVE
    app.patch('/trainer/:id', async(req,res) => {
        const id = req.params.id;
            const result= await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    status:req.body.status,
                    role:req.body.role
                }
        })
        
        res.send(result)
            })
   


    // ADD NEW USER
    app.post('/users', async(req,res) => {
        const email = req.body.email;
        const existingUser = await userList.findOne({email: email})
        if(existingUser){
            return res.send({message:'user already exists', insertedId: null})
        }
        const result = await userList.insertOne(req.body);
        res.send(result)
    })

    // APPLY FOR TRAINER
    app.patch('/user/:id', async(req,res) => {
        const id = req.params.id;
        console.log(req.body)
            const result = await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    name:req.body.name,
                    age:req.body.age,
                    photoURL:req.body.photoURL,
                    skills:req.body.skills,
                    availableDays:req.body.availableDays,
                    hoursPerDay:req.body.hoursPerDay,
                    experience:req.body.experience,
                    socialLinks:req.body.socialLinks,
                    biodata:req.body.biodata,
                    status:req.body.status
                }
            })
            res.send(result)
        })

        app.patch('/user/slot/:id', async (req, res) => {
            const id = req.params.id;
            console.log(req.body);
        
            const result = await userList.updateOne(
                { _id: new ObjectId(id) },
                {
                    $push: {
                        slots: {
                            selectedClasses: req.body.selectedClasses,
                            slotName: req.body.slotName,
                            slotTime: req.body.slotTime,
                            slotDay: req.body.slotDay,
                        },
                    },
                }
            );
        
            console.log(result);
            res.send(result);
        });

        app.patch('/user/slot/remove/:id', async (req, res) => {
            const id = req.params.id;
            const slotNameToRemove = req.body.slotNameToRemove;
            console.log(id,slotNameToRemove)
        
            const result = await userList.updateOne(
                { _id: new ObjectId(id) },
                { $pull: { slots: { slotName: slotNameToRemove } } }
              );
        
            console.log(result);
            res.send(result);
        });
        



    // FETCH ALL CLASSES
    app.get('/classes', async(req, res) => {
        result = await classList.find().toArray();
        res.send(result)
    })

    // ADD A CLASS
    app.post('/classes', async(req, res) => {
        result = await classList.insertOne(req.body)
        res.send(result)
    })

  


    // FETCH ALL FORUMS
    app.get('/forums', async(req, res) => {
        result = await forumList.find().toArray();
        res.send(result)
    })

    // ADD A FORUM
    app.post('/forums', async(req, res) => {
        result = await forumList.insertOne(req.body)
        res.send(result)
    })

    //ADD A NEWSLETTER
    app.post('/newsletters', async(req, res) => {
        result = await newsLetterSubscribersList.insertOne(req.body)
        res.send(result)
    })

    // FETCH ALL NEWSLETTER DATA
    app.get('/newsletters', async(req, res) => {
        result = await newsLetterSubscribersList.find().toArray();
        res.send(result)
    })

    // TRAINER DATA FOR BOOKING PAGE
    app.get('/booking/:id', async(req, res) => {
        const id = req.params.id
        result = await userList.findOne({_id: new ObjectId(id)},{projection:{
            name:1,skills:1
        }})
        res.send(result)
    })










    app.listen(port,()=>{
        console.log(`Listening on port : ${port}`);
    })
      
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      
    //   await client.close();
    }
  }
  run().catch(console.dir);
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
                    status:req.body.status
                }
        })
        
        res.send(result)
            })

    // ALL TRAINERS ]
    app.get('/trainers', async(req, res) => {
        const result = await userList.find({role:'trainer'}).toArray();
        res.send(result)
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
                    skills:req.body.skills,
                    availableDays:req.body.availableDays,
                    availableTimes:req.body.availableTimes,
                    socialLinks:req.body.socialLinks,
                    experience:req.body.experience,
                    biodata:req.body.biodata,
                    status:req.body.status
                }
            })
            res.send(result)
        })



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
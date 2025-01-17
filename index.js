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

    // GET USER DATA
    app.get('/users', async(req,res) => {
        const result = await userList.find().toArray();
        res.send(result)
    })

    // ADD NEW USER
    app.post('/users', async(req,res) => {
        const result = await userList.insertOne(req.body);
        res.send(result)
    })

    // APPLY FOR TRAINER
    app.patch('/user/:id', async(req,res) => {
        const id = req.params.id;
            const result = await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    name:req.body.name,
                    age:req.body.age,
                    skills:req.body.skills,
                    availableDays:req.body.availableDays,
                    availableSlots:req.body.availableSlots,
                    socialLinks:req.body.socialLinks,
                    experience:req.body.experience,
                    about:req.body.bio,
                    status:req.body.status
                }
            })
            res.send(result)
        })

        // ADMIN APPROVE TRAINER REQ
    app.patch('/user/promote/:id', async(req,res) => {
        const id = req.params.id;
            const result= await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    status:req.body.status
                }
        })
        
        res.send(result)
    })

    // ADMIN REMOVE TRAINER
    app.patch('/user/demote/:id', async(req,res) => {
        const id = req.params.id;
            const result= await userList.updateOne({_id: new ObjectId(id)},{
                $set:{
                    status:req.body.status
                }
        })
        
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
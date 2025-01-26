const express = require("express");
const cors = require("cors");
const { configDotenv } = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { error } = require("console");
configDotenv();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;

const uri = process.env.CONNECTION_STRING;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("fitstat-db");
    const userList = database.collection("userList");
    const classList = database.collection("classList");
    const forumList = database.collection("forumList");
    const newsLetterSubscriberList = database.collection("subscriberList");
    const paymentList = database.collection("paymentList");
    const reviewList = database.collection("reviewList");

    // JWT

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "4h" });
      console.log(token);
      res.send(token);
    });

    // MIDDLEWARE
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access " });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // GET USER DATA
    app.get("/users", verifyToken, async (req, res) => {
      const result = await userList.find().toArray();
      res.send(result);
    });

    // GET THE USER
    app.get("/user", verifyToken, async (req, res) => {
      const query = req.query.email;
      const result = await userList.findOne({ email: query });
      res.send(result);
    });

    // GET APPLICATION LISTS
    app.get("/users/applications", verifyToken, async (req, res) => {
      const result = await userList
        .find({ status: "pending" })
        .project({ name: 1, email: 1 })
        .toArray();
      res.send(result);
    });

    // GET APPLICATION DETAIL
    app.get("/users/application/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userList.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ADMIN APPROVE TRAINER REQ
    app.patch("/application/accept/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: req.body.status,
            role: req.body.role,
          },
        }
      );

      res.send(result);
    });

    // ADMIN REJECT TRAINER
    app.patch("/application/reject/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: req.body.status,
            feedback: req.body.feedback,
          },
        }
      );

      res.send(result);
    });

    // ALL TRAINERS
    app.get("/trainers", async (req, res) => {
      const result = await userList.find({ role: "trainer" }).toArray();
      res.send(result);
    });

    // 3 TRAINERS ONLY
    app.get("/trainers/team", async (req, res) => {
      const result = await userList
        .find({ role: "trainer" })
        .limit(3)
        .toArray();
      res.send(result);
    });

    // FETCH CLASS DATA OR TRAINER
    app.get("/trainers/:name", async (req, res) => {
      const name = req.params.name;

      const result = await userList
        .find({
          "slots.selectedClasses.label": { $regex: new RegExp(name, "i") },
        })
        .toArray();

      res.send(result);
    });

    // TRAINER DETAILS
    app.get("/trainer/:id", async (req, res) => {
      const result = await userList
        .find({ _id: new ObjectId(req.params.id) })
        .toArray();
      res.send(result);
    });

    // REMOVE A TRAINER
    app.patch("/trainer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: req.body.status,
            role: req.body.role,
          },
        }
      );

      res.send(result);
    });

    // ADD NEW USER
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const existingUser = await userList.findOne({ email: email });
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userList.insertOne(req.body);
      res.send(result);
    });

    // APPLY FOR TRAINER
    app.patch("/user/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: req.body.name,
            age: req.body.age,
            photoURL: req.body.photoURL,
            skills: req.body.skills,
            availableDays: req.body.availableDays,
            hoursPerDay: req.body.hoursPerDay,
            experience: req.body.experience,
            socialLinks: req.body.socialLinks,
            biodata: req.body.biodata,
            status: req.body.status,
          },
        }
      );
      res.send(result);
    });

    app.patch("/user/slot/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

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
      res.send(result);
    });

    app.patch("/user/slot/remove/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const slotNameToRemove = req.body.slotNameToRemove;

      const result = await userList.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { slots: { slotName: slotNameToRemove } } }
      );

      res.send(result);
    });


    // FETCH CLASSES WITH SEARCH
    app.get("/classes", async (req, res) => {
      const { search = "", page = 1, limit = 6 } = req.query;
      const skip = (page - 1) * limit;
  
      let query = search ? { name: { $regex: search, $options: "i" } } : {};
  
      const total = await classList.countDocuments(query); // Get total count for pagination
      const result = await classList.find(query).skip(skip).limit(parseInt(limit)).toArray();
      res.send({ total, classes: result });
  });

  app.get('/classes/all', async(req,res) =>{
    const result = await classList.find().toArray();
    res.send(result)
  })
  
    

    // ADD A CLASS
    app.post("/classes", verifyToken, async (req, res) => {
      result = await classList.insertOne(req.body);
      res.send(result);
    });

    // ADD COUNT OF CLASS BOOKING
    app.patch("/class/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await classList.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { bookingCount: 1 } }
      );
      res.send(result);
    });

    // FETCH ALL FORUMS
    app.get("/forums", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      try {
        const totalPosts = await forumList.countDocuments();
        console.log(totalPosts);
        const posts = await forumList.find().skip(skip).limit(limit).toArray();
        res.json({
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          currentPage: page,
          posts: posts,
        });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
      }
    });

    // LATEST 6 POSTS
    app.get("/forums/latest", async (req, res) => {
      const result = await forumList
        .find()
        .sort({ voteCount: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.patch("/forum/upvote/:id", async (req, res) => {
      const result = await forumList.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $inc: {
            voteCount: 1,
          },
        }
      );
      console.log(result);
      res.send(result);
    });

    app.patch("/forum/downvote/:id", async (req, res) => {
      const result = await forumList.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $inc: {
            voteCount: -1,
          },
        }
      );
      console.log(result);
      res.send(result);
    });

    // ADD A FORUM
    app.post("/forums", verifyToken, async (req, res) => {
      result = await forumList.insertOne(req.body);
      res.send(result);
    });

    //ADD A NEWSLETTER
    app.post("/newsletters", async (req, res) => {
      result = await newsLetterSubscriberList.insertOne(req.body);
      res.send(result);
    });

    // FETCH ALL NEWSLETTER DATA
    app.get("/newsletters", verifyToken, async (req, res) => {
      result = await newsLetterSubscriberList.find().toArray();
      res.send(result);
    });

    // TRAINER DATA FOR BOOKING PAGE
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      result = await userList.findOne(
        { _id: new ObjectId(id) },
        {
          projection: {
            name: 1,
            skills: 1,
            email: 1,
          },
        }
      );
      res.send(result);
    });

    // PAYMENT
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const price = req.body.price;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({ client_secret: paymentIntent.client_secret });
    });

    app.post("/payments", async (req, res) => {
      const paymentInfo = req.body;
      const result = await paymentList.insertOne(paymentInfo);
      res.send(result);
    });

    app.get("/payments", verifyToken, async (req, res) => {
      const result = await paymentList.find().toArray();
      res.send(result);
    });

    app.get("/payment", async (req, res) => {
      const result = await paymentList.findOne({ userEmail: req.query.email });
      res.send(result);
    });

    // ADD REVIEW
    app.post("/reviews", async (req, res) => {
      const result = await reviewList.insertOne(req.body);
      res.send(result);
    });

    // GET REVIEWS
    app.get("/reviews", async (req, res) => {
      const result = await reviewList.find().toArray();
      res.send(result);
    });

    // GET SINGLE REVIEW
    app.get("/review", async (req, res) => {
      const result = await reviewList.findOne({ userEmail: req.query.email });
      console.log(result);
      res.send(result);
    });

    // VERIFY AUTHENTICATION
    app.get("/auth", verifyToken, async (req, res) => {
      const userInfo = await userList.findOne({ email: req.query.email });
      const role = userInfo?.role;
      res.send(role);
    });

    // POPULAR CLASSES

    app.get("/classes/popular", async (req, res) => {
      const result = await classList
        .find()
        .sort({ bookingCount: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });








    // DASHBOARD
    app.get("/state", async (req, res) => {
      try {
        const memberCount = await userList.countDocuments({ role: 'member' });
        const bookingCount = await paymentList.estimatedDocumentCount();
    
        const totalPaymentPrice = await paymentList.aggregate([
          {
            $match: { packagePrice: { $exists: true, $ne: null } }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$packagePrice" }
            }
          }
        ]).toArray(); // Add .toArray() to ensure compatibility
    
        const totalPayment = totalPaymentPrice[0]?.total || 0;
        const transactions = await paymentList.find().sort({_id: -1}).toArray();
        const subscribers = await newsLetterSubscriberList.estimatedDocumentCount();
        const paidMembers = await paymentList.aggregate([
          {
            $group: {
              _id: "$userEmail", // Group by userEmail (this will group payments by unique members)
            },
          },
          {
            $count: "uniqueMemberCount", // Count the number of unique groups (members)
          },
        ]).toArray();
        res.json({
          totalUsers: memberCount,
          totalBookings: bookingCount,
          totalPayment: totalPayment,
          transactions:transactions,
          subscribers:subscribers,
          paidMembers:paidMembers[0].uniqueMemberCount
        });
      } catch (error) {
        console.error("Error fetching state data:", error);
        res.status(500).json({ error: "An error occurred while fetching state data." });
      }
    });
    
    

    app.get('/booked-slot', async (req, res) => {
      const classId = req.query.classId;  // This will be one `classId` at a time
      console.log(req.query);
    
      // Find the result for this specific `classId`
      const result = await paymentList.find({ classId: classId }).toArray();
      res.send(result);
    });

    app.listen(port, () => {
      console.log(`Listening on port : ${port}`);
    });






    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

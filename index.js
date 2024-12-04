require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0b1vd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const db = client.db("crowd-funding");

async function run() {
  try {
    await client.connect();

    const campaignsCollection = db.collection("campaigns");
    const usersCollection = db.collection("users");

    app.get("/", (req, res) => {
      res.send("This is crowd funding home page....");
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.send(result);
    });

    app.get("/home-campaigns", async (req, res) => {
      const cursor = campaignsCollection.find().limit(7);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/all-campaigns", async (req, res) => {
      const campaign = req.body;
      const result = await campaignsCollection.insertOne(campaign);
      res.send(result);
    });
    app.get("/all-campaigns", async (req, res) => {
      const cursor = campaignsCollection.find();
      const campaigns = await cursor.toArray();
      res.send(campaigns);
    });
    app.get("/all-campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const campaign = await campaignsCollection.findOne(query);
      res.send(campaign);
    });

    app.get("/all-raised-amount", async (req, res) => {
      const cursor = campaignsCollection.find();
      const result = await cursor.toArray();
      const totalAmount = result.reduce((accum, data) => {
        const campaignsAmmount = parseInt(data.raised);
        return accum + campaignsAmmount;
      }, 0);

      const resObj = {
        projectName: "Crowd Funding",
        totalAmount: totalAmount,
      };
      res.json(resObj);
    });
  } catch (e) {
    console.log(e.code);
  }
}
run();

app.listen(port, () => {
  console.log("server is running");
});

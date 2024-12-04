const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0b1vd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("crowd-funding");
    const campaignsCollection = db.collection("campaigns");

    app.get("/home-campaigns", async (req, res) => {
      const cursor = campaignsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
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

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(4000, () => {
  console.log("server is running");
});

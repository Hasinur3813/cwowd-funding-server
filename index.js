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
    const donatedCollection = db.collection("donated-collection");

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
      const cursor = campaignsCollection.find().limit(6);
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

    app.put("/donate", async (req, res) => {
      const { mainCampaign, donatedCampaign } = req.body;

      try {
        const filter = { _id: new ObjectId(mainCampaign._id) };

        const campaignFromDB = await campaignsCollection.findOne(filter);

        const raised = parseInt(campaignFromDB.raised || 0);
        const updateCampaign = {
          $set: {
            raised: raised + parseInt(donatedCampaign.raised),
          },
        };
        await campaignsCollection.updateOne(filter, updateCampaign);

        // checking if the campaign is already exist or not in the donatedCollection
        // if exist then simply update it otherwise, add a new one

        const donationFilter = {
          campaignId: mainCampaign._id,
          email: donatedCampaign.email,
        };

        const existingCampaign = await donatedCollection.findOne(
          donationFilter
        );

        if (existingCampaign) {
          const newDonatedAmount =
            parseInt(existingCampaign.raised || 0) +
            parseInt(donatedCampaign.raised);

          const updateCampaign = {
            $set: {
              raised: newDonatedAmount,
              lastDonated: new Date(),
            },
          };

          const result = await donatedCollection.updateOne(
            donationFilter,
            updateCampaign
          );
          res.send(result);
        } else {
          const newDonation = {
            ...donatedCampaign,
            campaignId: mainCampaign._id,
            lastDonated: new Date(),
          };

          const result = await donatedCollection.insertOne(newDonation);
          res.send(result);
        }
      } catch (error) {
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.get("/my-campaign/:email", async (req, res) => {
      const { email } = req.params;

      const query = {
        userEmail: email,
      };

      try {
        const cursor = campaignsCollection.find(query);
        const isExist = await cursor.toArray();
        isExist
          ? res.send(isExist)
          : res.status(404).json({ message: "No Campaign found" });
      } catch {
        res.status(500).send({ message: "Internal Server Error!" });
      }
    });

    app.delete("/my-campaign/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const campaignC = await campaignsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        const donatedC = await donatedCollection.deleteOne({ campaignId: id });
        donatedC.deletedCount ? res.send(donatedC) : res.send(campaignC);
      } catch {
        console.log("error");
      }
    });

    // update a campaign
    app.patch("/all-campaigns/:id", async (req, res) => {
      const { id } = req.params;
      const toUpdate = req.body;

      const filter = {
        _id: new ObjectId(id),
      };

      const updateDoc = {
        $set: {
          ...toUpdate,
        },
      };
      try {
        const result = await campaignsCollection.updateOne(filter, updateDoc);
        console.log(result);
        res.send(result);
      } catch (e) {
        console.log(e);
      }
    });

    // get a single campaign for update
    app.get("/udpate-campaign/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await campaignsCollection.findOne(query);
        res.send(result);
      } catch (e) {
        res
          .status(500)
          .send({ message: "Internal Server Error Or the capaign not found" });
      }
    });

    // get my donations campaigns
    app.get("/my-donations/:email", async (req, res) => {
      const { email } = req.params;
      const cursor = { email };
      const fetchData = donatedCollection.find(cursor);
      const campaigns = await fetchData.toArray();
      res.json(campaigns);
    });
  } catch (e) {
    console.log(e.code);
  }
}
run();

app.listen(port, () => {
  console.log("server is running");
});

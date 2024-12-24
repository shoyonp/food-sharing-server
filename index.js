const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o3uzo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const foodsCollection = client.db("tastyFood").collection("foods");

    // foods related apis

    // post a data
    app.post("/foods", async (req, res) => {
      const formData = req.body;
      const result = await foodsCollection.insertOne(formData);
      res.send(result);
    });

    // get all data
    app.get("/foods", async (req, res) => {
      //   const email = req.query.email;
      //   let query = email ? { "donator.email": email } : {};

      const cursor = foodsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific users posted data
    app.get("/foods/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "donator.email": email };
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    // delete a data
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });

    // specific food detail
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // update a food
    app.put("/updateFood/:id", async (req, res) => {
      const id = req.params.id;
      const formData = req.body;
      const updated = {
        $set: formData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await foodsCollection.updateOne(query, updated, options);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("foods are here");
});

app.listen(port, () => {
  console.log(`food is cooking at port: ${port}`);
});

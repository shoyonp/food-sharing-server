const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: ["http://localhost:5175"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// verify token
const verifyToken = (req, res, next) => {
  console.log("ok bye", req.cookies);
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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
    const foodRequestCollection = client.db("tastyFood").collection("request");

    // generating jwt
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_KEY, {
        expiresIn: "10h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
// removing a token
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // foods related apis

    // save a food data in db
    app.post("/foods", async (req, res) => {
      const formData = req.body;
      const result = await foodsCollection.insertOne(formData);
      res.send(result);
    });

    // get all data
    app.get("/foods", async (req, res) => {
      const { search } = req.query;
      const { sort } = req.query;
      let options = {};
      if (sort) {
        options = { sort: { expiredDate: sort === "asc" ? 1 : -1 } };
      }
      let query = {};
      if (search) {
        query = { foodName: { $regex: search, $options: "i" } };
      }

      //   const email = req.query.email;
      //   let query = email ? { "donator.email": email } : {};
      const cursor = foodsCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific users posted data
    app.get("/foods/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "donator.email": email };

      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
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

    // save a food request data in db
    app.post("/req-food", async (req, res) => {
      const reqData = req.body;
      const result = await foodRequestCollection.insertOne(reqData);

      //   update food status
      const filter = { _id: new ObjectId(reqData.foodId) };
      const update = {
        $set: { foodStatus: "requested" },
      };
      const updateStatus = await foodsCollection.updateOne(filter, update);
      res.send(result);
    });

    // get specific request data
    app.get("/my-request/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };

      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await foodRequestCollection.find(query).toArray();
      //   console.log(result);
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

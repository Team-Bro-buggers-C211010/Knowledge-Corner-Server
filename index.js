const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t8yk7hd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

async function run() {
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  try {
    const database = client.db("knowledge-library-DB");
    const libraryUsersCollection = database.collection("library-users");
    const booksCollection = database.collection("all-books");
    const borrowedBooksCollection = database.collection("borrowed-books");

    // User Data API
    app.get("/users", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await libraryUsersCollection.find(query).toArray();
      res.send(result);
    })
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await libraryUsersCollection.insertOne(user);
      res.send(result);
    });

    // Books Data API
    app.post("/books", async(req, res) => {
      const book = req.body;
      console.log(book);
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })
    app.patch("/books", async (req, res) => {
      const book_name = req.query?.book_name;
      const filter = { book_name: book_name };
      const decrement = { $inc: { book_quantity: -1 } };
      const result = await booksCollection.updateOne(filter, decrement);
      res.send(result);
    })
    app.patch("/books/increase", async (req, res) => {
      const book_name = req.query?.book_name;
      const filter = { book_name: book_name };
      const increment = { $inc: { book_quantity: 1 } };
      const result = await booksCollection.updateOne(filter, increment);
      res.send(result);
    })

    // Borrowed Books API
    app.post("/borrowed-books", async(req, res)=>{
      const borrowedBook = req.body;
      console.log(borrowedBook);
      const result = await borrowedBooksCollection.insertOne(borrowedBook);
      res.send(result);
    })
    app.get("/borrowed-books", async(req, res)=>{
      let query = {};
      if (req.query?.user_email && req.query?.book_name) {
        query = { $and : [{ user_email: req.query.user_email }, { book_name: req.query.book_name }] };
      }
      if(req.query?.user_email) {
        query = { user_email: req.query.user_email }
      }
      const result = await borrowedBooksCollection.find(query).toArray();
      res.send(result);
    })
    app.delete("/borrowed-books", async(req, res)=>{
      let query = {};
      if (req.query?.book_name) {
        query = { book_name: req.query.book_name };
      }
      const result = await borrowedBooksCollection.deleteOne(query);
      res.send(result);
    })

    app.put("/books", async (req, res) => {
      const book = req.body;
      const filter = { book_name: book.book_name };
      const options = { upsert: true };
      const updateDoc = {
        $set: book,
      };
      const result = await booksCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // get single book details
    app.get("/books", async (req, res) => {
      let query = {};
      if (req.query?.book_name) {
        query = { book_name: req.query.book_name };
      }
      if(req.query?.book_quantity) {
        query = { book_quantity: { $gt: parseInt(req.query.book_quantity) } }
      }
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
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

app.get("/", (req, res) => {
  res.send("The Knowledge Corner Server is started.");
});

app.listen(port, () => {
  console.log(`The Knowledge Corner Server is running on port ${port}`);
});

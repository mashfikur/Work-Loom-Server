const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// root URL
app.get("/", async (req, res) => {
  res.send("Server is Running Successfully");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rnoho8k.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    //    <-------- databse collections---------->
    const blogsCollection = client.db("workLoomDB").collection("blogs");
    const employeesCollection = client.db("workLoomDB").collection("employees");
    const postedJobsCollection = client
      .db("workLoomDB")
      .collection("postedJobs");
    const appliedJobsCollection = client
      .db("workLoomDB")
      .collection("appliedJobs");

    // <-------- All GET Requests ---------->

    app.get("/api/v1/employees", async (req, res) => {
      const cursor = employeesCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/blogs", async (req, res) => {
      const cursor = blogsCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });
    app.get("/api/v1/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);

      res.send(result);
    });

    app.get("/api/v1/all-jobs", async (req, res) => {
      const cursor = postedJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/v1/all-jobs/category/:name", async (req, res) => {
      const categoryName = req.params.name;
      const query = { category: categoryName };
      const cursor = postedJobsCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/all-jobs/job/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postedJobsCollection.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/user/posted-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { user_id: id };
      const cursor = postedJobsCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/user/applied-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { user_id: id };
      const cursor = appliedJobsCollection.find(query);
      const result = await cursor.toArray();

      const appliedJobs = result.map((job) => new ObjectId(job.job_id));
      // console.log(appliedJobs);

      const findingJobQuery = { _id: { $in: appliedJobs } };
      const findedJobCursor = postedJobsCollection.find(findingJobQuery);

      const findedJobs = await findedJobCursor.toArray();
      // console.log(findedJobs);

      res.send(findedJobs);
    });

    // <-------- All POST Requests ---------->

    app.post("/api/v1/user/add-job", async (req, res) => {
      const jobInfo = req.body;
      const result = await postedJobsCollection.insertOne(jobInfo);
      res.send(result);
    });

    app.post("/api/v1/user/apply-job/:id", async (req, res) => {
      const id = req.params.id;
      const appliedJobInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateJobApplicant = await postedJobsCollection.updateOne(filter, {
        $inc: { applied: 1 },
      });

      // posting job to the database
      const result = await appliedJobsCollection.insertOne(appliedJobInfo);

      res.send(result);
    });

    // <-------- All PATCH Requests ---------->
    app.patch("/api/v1/user/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const jobInfo = req.body;
      const {
        user_id,
        posted_by,
        posted_date,
        title,
        company,
        company_logo,
        category,
        banner,
        salary,
        deadline,
        description,
      } = jobInfo;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          user_id,
          posted_by,
          posted_date,
          title,
          company,
          company_logo,
          category,
          banner,
          salary,
          deadline,
          description,
        },
      };

      const result = await postedJobsCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // <-------- All DELETE Requests ---------->
    app.delete("/api/v1/user/delete-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postedJobsCollection.deleteOne(query);

      res.send(result);
    });

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

app.listen(port, () => {
  console.log(`Server is running on port ${port} `);
});

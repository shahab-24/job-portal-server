const express = require("express");
const  app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
require('dotenv').config()


app.use(express.json())
app.use(cors())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3jtn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
	const jobsCollection = client.db("JobPortal").collection("jobs")
  const jobApplicationCollection = client.db("JobPortal").collection("Job-Applications")

  // jobs related APIs

	app.get('/jobs', async(req,res) => {
		const email = req.query.email
    let query = {};
    if(email) {
      query = {
        hr_email : email
      }

    }
    
    const result = await jobsCollection.find(query).toArray()
		// const result = await jobsCollection.find().toArray();
		res.send(result)
	})

  app.get('/jobs/:id', async(req,res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await jobsCollection.findOne(query);
    res.send(result)
  })

  app.post('/jobs', async(req, res) => {
    const newJob = req.body;
    const result = await jobsCollection.insertOne(newJob)
    res.send(result)
  })

  // job application apis


  app.get("/job-application", async(req, res) => {
    const email = req.query.email;
    const query = {applicant_email: email}
    const result = await jobApplicationCollection.find(query).toArray()

    for (const application of result ){
      // console.log(application.job_id)
      const query1 = {_id : new ObjectId(application.job_id)}
      // console.log(query1)
      const job = await jobsCollection.findOne(query1)
      console.log(job)

      if(job){
        application.title = job.title,
        application.company = job.company,
        application.location = job.location,
        application.company_logo = job.company_logo
      }
    }
    res.send(result)
  })

  // /who has  applied for a job...k k abedon koreche akta job seta dekhabe
  app.get('/job-applications/jobs/:job_id', async(req, res) => {
    const jobId = req.params.job_id;
    const query = {job_id: jobId }
    const result = await jobApplicationCollection.find(query).toArray()
    res.send(result)

  })


  // job id te koijone abedon koreche setar count number and ui te update kore dekhano
  app.post('/job-applications', async(req, res) => {
    const application = req.body;
    const result = await jobApplicationCollection.insertOne(application);


    // find job id form jobsApplication to show how many application has submitted for each job title-----
    // step-1====fist get job id form jobapplication collection===
    
const id = application.job_id;

// by getting id from job application has to  query  by job id which already got
const query = {_id: new ObjectId(id)}
const job = await jobsCollection.findOne(query)

let newCount = 0;
if(job.applicationCount){
  
  newCount = job.applicationCount + 1;
} else{
  newCount = 1;
}

// update doc--------------------------
// step-2
// now to show application count in each job title by id...has to update ui and has to add filed named applicationCount filed when applying to the job

const filter = {_id: new ObjectId(id)};

const updatedDoc = {
  $set: {
    applicationCount : newCount
  }
}

const updateResult = await jobsCollection.updateOne(filter, updatedDoc)

    res.send(result)
  })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) => {
	res.send('Hello from job portal')

})

app.listen(port, () => {
	console.log(`server is running on port: ${port}`)
})
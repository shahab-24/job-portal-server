const express = require("express");
const  app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
require('dotenv').config()



app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())





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

  // auth related API======
  app.post('/jwt', async (req, res) =>{
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "1h"})
    res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
      
    })
    .send({success: true})

  })

  app.post('/logout',(req, res) => {
    res.clearCookie("token",{
      httpOnly: true,
      secure: false
    }).send({success: true})
  })


  const verifyToken = (req,res, next) => {
    console.log("hello from verify token")
    const token = req?.cookies?.token

    if(!token){
      return res.status(401).send({message: "Unauthorized access"})
    }

    jwt.verify(token, process.env.JWT_SECRET,(err, decoded) =>{
      if(err){
        return res.status(401).send({message: "Unauthorized access"})
      }
    req.user = decoded;
      next()
    } )

  }

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


  app.get("/job-application",verifyToken, async(req, res) => {
    const email = req.query.email;
    const query = {applicant_email: email}
    if(req.user.email !== req.query.email){
      return res.status(403).send({message: "forbidden access"})
    }

    // console.log("cookies", req.cookies)
    const result = await jobApplicationCollection.find(query).toArray()

    for (const application of result ){
      // console.log(application.job_id)
      const query1 = {_id : new ObjectId(application.job_id)}
      // console.log(query1)
      const job = await jobsCollection.findOne(query1)
      

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

  app.patch('/job-applications/:id', async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const data = req.body;
    const updatedDoc = {
      $set: {
        status: data.status
      }}
 const result = await jobApplicationCollection.updateOne(query, updatedDoc)
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
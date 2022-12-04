//// const { application } = require('express')
const express = require('express')
var cors = require('cors')

//image
const {format} = require('util');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();


const bodyParser = require('body-parser')
const app = express()
app.use(express.json())
app.use(cors())

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
//const { application } = require('express');

if (process.env.NODE_ENV == 'development') {
  console.log("Dev environment")
  const serviceAccount = require("d:/Bitbucket/all.configuration/ptplacesdev-serviceaccount.json");
  initializeApp({
    credential: cert(serviceAccount)
  });
}
else {
  console.log("prod environment")
  initializeApp({
    credential: applicationDefault()
  });
}

const db = getFirestore();

//image
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});
const bucket = storage.bucket("placesprodvisits");

app.disable('x-powered-by')
//app.use(multerMid.single('file'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.post('/uploads', async (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
})
//endimage




app.get("/Date", (req, res) => {
  console.log("request date");
  console.log(process.env.NODE_ENV)
  res.send(new Date().toString());
})

app.get("/PlaceList", async (req, res) => {
  const placesCollection = db.collection('Places');
  const places = await placesCollection.get();
  console.log(places)
  var result = [];
  places.forEach(doc => {
    var element = { id: doc.id }
    console.log(doc.id, '=>', doc.data())
    element = { ...element, ...doc.data() }
    result.push(element);
  })
  res.json(result);
})

app.get("/Place", async (req, res) => {
  let id = req.query.id;
  console.log(req.query);
  console.log(id);
  const placeRef = db.collection('Places').doc(id);
  const doc = await placeRef.get();
  console.log(doc);
  var element = { id: doc.id }
  element = { ...element, ...doc.data() }
  res.json(element);
})

app.get("/", (req, res) => {
  res.send("Wooho1")
})

app.post("/NewPlace", (req, res) => {
  console.log('NewPlace');
  console.log(req.body);
  console.log(req);

  const docRef = db.collection('Places').add(req.body)

  res.send(`Hello1 `);
})

app.post("/UpdatePlace", (req, res) => {
  console.log(req.body);
  console.log(req.body.name)
  const docRef = db.collection('Places').doc(req.body.id).set(req.body)
  res.send(`Updated`);
})


// app.post("/Visit", (req,res)=>{
//   console.log(req.body.comment);
// })

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

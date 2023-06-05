const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s5ncp.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message: "Unauthorized access!"});
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            res.status(401).send({message: "Unauthorized access!"});
        }

        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        const serviceCollection = client.db('smartCar').collection('services');
        const orderCollection = client.db('smartCar').collection('orders');

        // JWT Token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2 days'});
            res.send({token});
        })


        // service
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });


        // orders api
        app.get('/orders', verifyJWT, async (req, res) => {
            // console.log(req.query.email);
            let query = {};
            if (req.query?.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });


        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(order);
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });


        // update
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = {_id: new ObjectId(id)};
            const updatedDoc = {
                $set: {
                    status: status
                }
            };
            const result = await orderCollection.updateOne(query, updatedDoc);
            res.send(result);
        })


        // delete
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })





    } finally { }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('smart car server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
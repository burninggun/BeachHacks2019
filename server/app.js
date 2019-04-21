  //https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=33.7386669,-117.8399826&radius=500&keyword=clothes+donation+place&key=AIzaSyBwjclPeS40gutkt8N4-TbrISt1qFJJzeA
 // var key = 'AIzaSyBwjclPeS40gutkt8N4-TbrISt1qFJJzeA';

 
var axios = require('axios')
var bodyParser = require('body-parser')
var firebase = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://beachhackstim.firebaseio.com"
});

const db = firebase.firestore();

function addUserInfo(User_name, pkg_desc, addy, lat, long){

    var docRef = db.collection('packages').doc();

    var setUser = docRef.set({
        Name: User_name,
        Package_Description : pkg_desc,
        Address: addy,
        Latitude: lat,
        Longitude: long,
        complete: false
    })

}

///////////////////////////////// test ^^^


const express = require('express');
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//This is to test
// Use = for int and others
//Use : for strings
const example_request = {
    Name : "Buzz THICCyear",
    Package_description : "Socks",
    Latitude : 33.738690,
    Longitude : -117.837820,
    Address : "10091 Montego way, Santa Ana Ca",
    complete : false
    
}


//This occurs when the client puts in a request for their donation to be picked up
app.get('/client/request', function(req, res){
    req.body = example_request;

    //This unpacks the object
    let Name = req.body.Name
    let Package_description = req.body.Package_description
    let Latitude = req.body.Latitude
    let Longitude = req.body.Longitude
    let Address = req.body.Address
    let complete = false

    addUserInfo(Name, Package_description, Address, Latitude, Longitude)

    res.send( 'Request Complete!')
})

//This adds all current clients to the queue so drivers can choose which donation to pick up
app.get('/driver/looking', function (req, res) {
    db.collection('packages').get()
        .then((snapshot) => {
            let documents = []
            snapshot.forEach((doc) => {
                if(doc.data().complete != true){
                    documents.push(doc.data())
                }
                             
            });
            res.json(documents)

        })
        .catch((err) => {
            res.send('fail')
            console.log('Error getting documents', err);
        });

})

//This occurs when a driver accepts a request to donate.  This takes the donation's address and finds the closest
//donation center
app.post('/package/deliver', (req, res) => {
    //req.body.lat req.body.long
    //req.body.id

    var pkgRef = db.collection('packages').doc(req.body.id);
    var getDoc = pkgRef.get()
        .then(doc => {
            if (!doc.exists) {

                console.log('No such document!');
            } else {

                let lat = doc.data().Latitude
                let long = doc.data().Longitude
                
                axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat + "," + long}&rankby=distance&keyword=clothes+donation&key=AIzaSyBwjclPeS40gutkt8N4-TbrISt1qFJJzeA`)
                .then(function(res){
                    
                    if(res.data.results[0] != null){
                    console.log(res.data.results[0].vicinity)
                    console.log(res.data.results[1].vicinity)
                    console.log(res.data.results[2].vicinity)
                    
                    }
                    else{
                        console.log("There are no donation centers in range!")
                    }
                })
            var updateComplete = pkgRef.update({complete: true}) ;   
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });



    res.end()
})

//Update account 
app.post('/user/update', (req, res) => {
    firebase.auth().updateUser(uid=req.body.uid, {
        
        email: req.body.email,
        phoneNumber: '+'+req.body.phoneNumber,
        password: req.body.password,
        displayName: req.body.displayName,
    
      })
        .then(function(userRecord) {
          // See the UserRecord reference doc for the contents of userRecord.
          console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch(function(error) {
          console.log('Error updating user:', error);
        });
        res.end()   
})

//Creates Account
app.post('/user/create', (req, res) => {
    firebase.auth().createUser({
        email: req.body.email,
        emailVerified: false,
        phoneNumber: '+'+req.body.phoneNumber,
        password: req.body.password,
        displayName: req.body.displayName,
        disabled: false
      })
        .then(function(userRecord) {
          // See the UserRecord reference doc for the contents of userRecord.
          console.log('Successfully created new user:', userRecord.uid);
        })
        .catch(function(error) {
          console.log('Error creating new user:', error);
        });
        res.end()    

})

//Delete account
app.post('/user/delete', (req, res) => {
    firebase.auth().deleteUser(uid=req.body.uid)
  .then(function() {
    console.log('Successfully deleted user');
  })
  .catch(function(error) {
    console.log('Error deleting user:', error);
  });
  res.end()
})


app.listen(3000, () => {
    console.log('listening to port 3000')
} )


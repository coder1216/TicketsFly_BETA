const https = require('https');
const cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var fs = require('fs');

// MongoDB Variables
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectId = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');

var config = JSON.parse(fs.readFileSync("config.json"));
var MongoDBServer = config.settings.mongoDB;
var MongoDB = config.mongoDB.servers;
MongoDB = MongoDB[MongoDBServer];

var userAndPass = "";

if (MongoDB.user != ""){
    userAndPass = MongoDB.user + ":" + MongoDB.password + "@"
}
MongoDB = "mongodb://" + userAndPass + MongoDB.host + ":" + MongoDB.port + "/" + MongoDB.database;

localMongoUrl = MongoDB;

console.log(localMongoUrl);

var PORT = 3000;

// get the total number of pages there are in the current ticketfly database
var dataArray = [];

//finds the total number of events and how many pages there should be
function getTotalPages(callback){

    https.get('https://www.ticketfly.com/search/page/20/?q', function(resp){
        var data = '';
        resp.on('data', (function(chunk){
            data += chunk;
        }));
        resp.on('end', function (){
            const $ = cheerio.load(data);
            //the total number of entries in the database on ticketfly and figures out how many pages there should be
            var totalResults = $('.search-results-message').html();
            totalResults = Math.ceil(totalResults.split("&")[0] / 100);
            callback(totalResults);
        })
    }).on('error', function(err){
        console.log(err);
    });
}

function getObjectByValue(array, key, value) {
    return array.filter(function (object) {
        return object["offers"][key] === value;
    });
};

function getEvents(url, callback) {
    var tempUrl = url;
    https.get(url, function (resp) {
        var data = '';
        resp.on('data', (function (chunk) {
            data += chunk;
        }));
        resp.on('end', function () {
            const $ = cheerio.load(data);
            var results = $('script[type="application/ld+json"]').html();
            var cleanResults = JSON.parse(results);
            callback(cleanResults);
        })
    }).on('error', function (err) {
        console.log("Error getting URL:", err);
        getEvents(tempUrl, callback)
    });
}

function insertEvents(dataSet, targetDB, callback){
    try {
        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();
            console.log("MONGODB CALL: OPEN");
            console.log("Is there Data?: ",dataSet);
            console.log("Is there a Database?: ",targetDB);
            if (dataSet.length != 0){
                db.collection(targetDB).insertMany(dataSet,{ ordered: false }, function (err, result) {
                    if(err){
                        console.log(targetDB);
                        console.log("Is there Data?: ",dataSet);
                        console.log("Type of Data?: ",typeof(dataSet));
                        console.log("Error Inserting Many: ", err);
                        callback();
                    }
                    else {
                        console.log("Inserted a document into the collection.");
                        callback();
                    }
                    client.close();
                    console.log("MONGODB CALL: CLOSE");
                });
            }
            else{
                callback();
            }
        });
    }
    catch(err){
        console.log("Error: ",err)
    }
}

function cloneDB(sourceDB, targetDB, callback){
    try {
        console.log("Cloning...");
        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();
            console.log("MONGODB CALL: OPEN");
            // some code that duplicated the database
            db.collection(sourceDB).find().toArray(function(err, docs){
                if (err){
                    console.log("Error: ",err);
                }
                MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
                    assert.equal(null, err);
                    db2 = client.db();
                    db2.collection(targetDB).insertMany(docs, {ordered: false}, function (err, result) {
                        if (err) {
                            console.log("Error: ", err);
                            callback();
                        }
                        else {
                            console.log("Inserted a document into the collection.");
                            callback();
                        }
                        client.close();
                        console.log("MONGODB CALL: CLOSE");
                    });
                });
                client.close();
                console.log("MONGODB CALL: CLOSE");
            })
        });
    }
    catch(err){
        console.log("Error: ",err)
    }
}

function removeDB(targetDB, callback){
    try {
        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();
            console.log("MONGODB CALL: OPEN");
            db.collection(targetDB).drop(function(){
                client.close();
                callback();
                console.log("MONGODB CALL: CLOSE");
            });
        });
    }
    catch(err){
        console.log("Error: ",err);
        callback();
    }
}

//once the new dataArray is "processed" we run checkforDB()
function checkforDB(dataSet, dbTarget, callback){
    try {
        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();
            console.log("MONGODB CALL: OPEN");
            var collection = db.collection(dbTarget).findOne(function (err, result) {
                if (err) {
                    console.log("Error: ", err)
                }
                else {
                    if (result == null){
                        insertEvents(dataSet, dbTarget, function(){
                            client.close();
                            console.log("MONGODB CALL: CLOSE");
                            callback();
                        })
                    }
                    else {
                        console.log("Database Exists, Removing Temp.");
                        removeDB("tempDB", function(){
                            insertEvents(dataSet, "tempDB", function(){
                                client.close();
                                console.log("MONGODB CALL: CLOSE");
                            })
                        });
                        cloneDB("main", "backupDB", function(){
                            console.log("Done the Backup.");
                            client.close();
                            console.log("MONGODB CALL: CLOSE");
                            callback();
                        });
                    }
                }
            });
        });
        console.log()
    }
    catch(err){
        console.log("Error: ",err)
    }
}

function updateEvent(input){
    //console.log(input);
    MongoClient.connect(localMongoUrl, {poolSize: 10}, function (err, client) {
        assert.equal(null, err);
        db3 = client.db();
        console.log("MONGODB CALL: OPEN - UpdateEvent");
        var myquery = { "_id" : input["_id"] };
        var newvalues = {$set: {offers: input["offers"] }};
        db3.collection("main").updateOne(myquery, newvalues, function(err, res) {
            if (err){
                console.log(err)
            }
            console.log(myquery, " has been updated.");
            client.close();
            console.log("MONGODB CALL: CLOSE");
        })
    });
}

function compareAndReport(sourceDB, targetDB, callback){
    try {
        MongoClient.connect(localMongoUrl, {poolSize: 10}, function (err, client) {
            assert.equal(null, err);
            db = client.db();
            console.log("MONGODB CALL: OPEN - CompareAndReport");
            db.collection(sourceDB).find().toArray(function (err, sourceDocs) {
                if (err) {
                    console.log("Error: ", err);
                }
                MongoClient.connect(localMongoUrl, {poolSize: 10}, function (err, client) {
                    assert.equal(null, err);
                    db2 = client.db();
                    db2.collection(targetDB).find().toArray(function (err, targetDocs) {
                        if (err) {
                            console.log("Error: ", err);
                        }
                        console.log("sourceDB",sourceDocs.length);
                        console.log("targetDB", targetDocs.length);
                        var newSoldOut = [];
                        for (var i = 0; i < sourceDocs.length - 1; i++){          // uncomment after testing
                            for (var x = 0; x < targetDocs.length - 1; x++){        // loop through all of the targetDocs
                                // did we find a match?
                                if (sourceDocs[i]["_id"] == targetDocs[x]["_id"]){
                                    // was it sold out before? If so, remove it from the new list.
                                    if (sourceDocs[i]["offers"]["availability"] == "SoldOut"){
                                        // removing from targetDocs
                                        targetDocs.splice(x, 1);
                                    }
                                    // if it wasn't sold out before, is it now? If so, add to update list.
                                    else if (targetDocs[x]["offers"]["availability"] == "SoldOut"){
                                        // add new SoldOut show to newSoldOut array;
                                        newSoldOut.push(targetDocs[x]);
                                        console.log(targetDocs[x]["_id"], "is now SoldOut");
                                        // update old item with new status
                                        updateEvent(targetDocs[x]);
                                        // remove from tragetDocs
                                        targetDocs.splice(x, 1);
                                    }
                                    // if it hasn't changes remove it from the list
                                    else{
                                        // remove from targetDocs
                                        targetDocs.splice(x, 1);
                                    }
                                }
                            }
                        }
                        console.log("Unprocessed Docs: ", targetDocs.length);
                        // add all of the remaining docs to the database, then process them
                        try {
                            MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
                                assert.equal(null, err);
                                dbNEW = client.db();

                                dbNEW.collection("main").insertMany(targetDocs,{ ordered: false }, function (err, result) {
                                    if(err){
                                        console.log("Error Inserting Many: ", err);
                                    }
                                    else {
                                        console.log("Inserted a document into the collection.");
                                    }
                                    client.close();
                                });
                            });
                        }
                        catch(err){
                            console.log("Error: ",err)
                        }
                        for (var x = 0; x < targetDocs.length - 1; x++) {        // loop through all of the remaining targetDocs
                            // did we find a match?
                            if (targetDocs[x]["offers"]["availability"] == "SoldOut"){
                                // add new SoldOut show to newSoldOut array;
                                newSoldOut.push(targetDocs[x]);
                                console.log(targetDocs[x]["_id"], "is also SoldOut");
                            }
                        }
                        // remove old newSoldOutEvents database
                        removeDB("newSoldOutEvents", function(){
                            console.log("newSoldOutEvents clear...");
                        // create new database for the newly sold out items
                        insertEvents(newSoldOut, "newSoldOutEvents", function(){
                            console.log("newSoldOutEvents database created and populated.");
                            // generate Report
                            var organizedData = {};
                            var report = "<html>";
                            for (var x = 0; x < newSoldOut.length; x++) {
                                //organize by year
                                var year = String(newSoldOut[x]["startDate"].split("-")[0]);
                                if (organizedData[year] == undefined){
                                    organizedData[year] = {};
                                }
                                // organize be month
                                var month = String(newSoldOut[x]["startDate"].split("-")[1]);
                                if (organizedData[year][month] == undefined){
                                    organizedData[year][month] = {};
                                }
                                // organize by band
                                var name = newSoldOut[x]["name"];
                                if (organizedData[year][month][name] == undefined){
                                    organizedData[year][month][name] = [];
                                    organizedData[year][month][name].push(newSoldOut[x]["location"]["name"]);
                                }
                                else if (organizedData[year][month][name]){
                                    organizedData[year][month][name].push(newSoldOut[x]["location"]["name"])
                                }
                                // phrase for report
                            }
                                var myJsonAbc = require("jsonabc");
                                var sorted = myJsonAbc.sortObj(organizedData);
                                var data = sorted;
                                var years = Object.entries(data).length;
                                console.log("Years: ", years);
                                var month_names = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                                for (var x = 0; x < years; x++){
                                    var year  = Object.entries(data)[x][0];
                                    console.log("Year being processed: ",year);
                                    report = report + "<br><p>------------------------------------</p><h1><b>" + year + "</b></h1><p>------------------------------------</p>";
                                    var months = Object.entries(Object.entries(data)[x][1]).length;
                                    console.log("Months: ",months); // should be 4 and 1
                                    for (var y = 0; y < months; y++){
                                        var month = Object.entries(Object.entries(data)[x][1])[y];
                                        var monthNumber = month[0] - 1;
                                    var monthName = month_names[monthNumber];
                                    console.log(monthNumber);
                                    report = report + "</br><h2><b>" + monthName + " " + year +"</b></h2></br>";
                                    var monthContent = month[1];
                                    var events = Object.entries(monthContent).length;
                                    for (var z = 0; z < events; z++){
                                        var event = Object.entries(monthContent)[z];
                                        var name = event[0].toString().toUpperCase();
                                        var venues = event[1].toString();
                                        console.log("Venues: ",event[1].toString())
                                        report = report + "<span style='text-transform: uppercase; font-weight: bold; font-size: 18px;'> <b>" + name + "</b></span><span style='font-size: 18px;'> " + venues + "</span><br>";
                                    }
                                }
                            }
                            var htmlToRtf = require('html-to-rtf');
                            htmlToRtf.saveRtfInFile('NewSoldOutReport.rtf', htmlToRtf.convertHtmlToRtf(report));
                            report = report + "</html>";
                            fs.writeFile('NewSoldOutReport.html', report, function(err){
                                // throws an error, you could also catch it here
                                if (err)
                                    console.log(err);
                            });

                            // Load client secrets from a local file.
                            // fs.readFile('credentials.json', (err, content) => {
                            //     if (err) return console.log('Error loading client secret file:', err);
                            // Authorize a client with credentials, then call the Google Drive API.
                        //     authorize(JSON.parse(content), insertNewReport);
                        // });
                        MongoClient.connect(localMongoUrl, {poolSize: 10}, function (err, client) {
                            assert.equal(null, err);
                            db2 = client.db();
                            db2.collection("main").find().toArray(function (err, targetDocs) {
                                if (err) {
                                    console.log("Error: ", err);
                                }
                                var soldOutDB = [];
                                for (var x = 0; x < targetDocs.length - 1; x++) {        // loop through all of the targetDocs
                                    // did we find a match?
                                    if (targetDocs[x]["offers"]["availability"] == "SoldOut") {
                                        // add new SoldOut show to newSoldOut array;
                                        soldOutDB.push(targetDocs[x]);
                                    }
                                }

                        function fullReport(inputData, callback){
                            var organizedData = {};
                            var report = "<html>";
                            for (var x = 0; x < inputData.length - 1; x++) {
                                //organize by year
                                var year = String(inputData[x]["startDate"].split("-")[0]);
                                if (organizedData[year] == undefined){
                                    organizedData[year] = {};
                                }
                                // organize be month
                                var month = String(inputData[x]["startDate"].split("-")[1]);
                                if (organizedData[year][month] == undefined){
                                    organizedData[year][month] = {};
                                }
                                // organize by band
                                var name = inputData[x]["name"];
                                if (organizedData[year][month][name] == undefined){
                                    organizedData[year][month][name] = [];
                                    organizedData[year][month][name].push(inputData[x]["location"]["name"]);
                                }
                                else if (organizedData[year][month][name]){
                                    organizedData[year][month][name].push(inputData[x]["location"]["name"])
                                }
                                // phrase for report
                            }
                            var myJsonAbc = require("jsonabc");
                            var sorted = myJsonAbc.sortObj(organizedData);
                            var data = sorted;
                            var years = Object.entries(data).length;
                            console.log("Years: ", years);
                            var month_names = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                            for (var x = 0; x < years; x++){
                                var year  = Object.entries(data)[x][0];
                                console.log("Year being processed: ",year);
                                report = report + "<br><p>------------------------------------</p><h1><b>" + year + "</b></h1><p>------------------------------------</p>";
                                var months = Object.entries(Object.entries(data)[x][1]).length;
                                console.log("Months: ",months); // should be 4 and 1
                                for (var y = 0; y < months; y++){
                                    var month = Object.entries(Object.entries(data)[x][1])[y];
                                    var monthNumber = month[0] - 1;
                                    var monthName = month_names[monthNumber];
                                    console.log(monthNumber);
                                    report = report + "</br><h2><b>" + monthName + " " + year +"</b></h2></br>";
                                    var monthContent = month[1];
                                    var events = Object.entries(monthContent).length;
                                    for (var z = 0; z < events; z++){
                                        var event = Object.entries(monthContent)[z];
                                        var name = event[0].toString().toUpperCase();
                                        var venues = event[1].toString();
                                        console.log("Venues: ",event[1].toString())
                                        report = report + "<span style='text-transform: uppercase; font-weight: bold; font-size: 18px;'> <b>" + name + "</b></span><span style='font-size: 18px;'> " + venues + "</span><br>";
                                    }
                                }
                            }
                                var htmlToRtf = require('html-to-rtf');
                                htmlToRtf.saveRtfInFile('FullReport.rtf', htmlToRtf.convertHtmlToRtf(report));
                                report = report + "</html>";
                                fs.writeFile('FullReport.html', report, function(err){
                                    // throws an error, you could also catch it here
                                    if (err)
                                        console.log(err);
                                });
                                // Load client secrets from a local file.
                                // fs.readFile('credentials.json', function (err, content) {
                                // if (err) return console.log('Error loading client secret file:', err);
                                // Authorize a client with credentials, then call the Google Drive API.
                                // authorize(JSON.parse(content), updateFullReport);
                                // });
                                const nodemailer = require('nodemailer');
                                var transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: "baraqu.edubba@gmail.com",
                                        pass: "spac3n!spac3n"
                                    }
                                });
                                // setup email data with unicode symbols
                                var mailOptions = {
                                    from: "'EDUBBA' <baraqu.edubba@gmail.com>", // sender address
                                    //to: 'louis@baraqu.com', // list of receivers
                                    to: 'jakefargoteresi@gmail.com, louis@baraqu.com', // list of receivers
                                    subject: 'New TickeyFly Report is ready!', // Subject line
                                    html: '<a href="https://drive.google.com/open?id=1XhfOAf0mUeSZKLUmnzwz35Ir7t2MECRQ">Report Folder</a>' // html body
                                };
                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, function(error, info) {
                                //     if (error) {
                                //         return console.log(error);
                                //     }
                                //     console.log('Message sent: %s', info.messageId);
                                // Preview only available when sending through an Ethereal account
                                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                            });
                                callback();
                            }
                                        fullReport(soldOutDB, function(){
                                            client.close();
                                            console.log("MONGODB CALL: CLOSE");
                                        });
                                    })});

                            });
                                        });
                                        client.close();
                                        console.log("MONGODB CALL: CLOSE");
                                    });
                                });
                                        client.close();
                                        console.log("MONGODB CALL: CLOSE");
                                    });
                                    callback();
                                })
                            }
                            catch(err){
                                console.log("Error: ",err);
                                callback();
                            }
                        }

const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', "https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
    console.log('Token stored to', TOKEN_PATH);
});
    callback(oAuth2Client);
});
});
}
/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    const drive = google.drive({version: 'v3', auth});
    drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
        console.log('Files:');
        files.map((file) => {
            console.log(`${file.name} (${file.id})`);
    });
    } else {
        console.log('No files found.');
    }
});
}
function insertNewReport(auth){
     const drive = google.drive({version: 'v3', auth});
     var folderId = '1dG7b7OVKXXOOFs-tg3ZMbVjxHld2_bCe';
     var fileMetadata = {
         'name': 'NewSoldOutReport_' + new Date().toISOString().split(".")[0] + '.rtf',
         parents: [folderId]
     };
     var media = {
         mimeType: 'text/rtf',
         body: fs.createReadStream('NewSoldOutReport.rtf')
     };
     drive.files.create({
         resource: fileMetadata,
         media: media,
         fields: 'id'
     }, function (err, file) {
         if (err) {
             // Handle error
             console.error(err);
         } else {
             console.log('File Id: ', file.id);
         }
     });

 }
function updateFullReport(auth){
     const drive = google.drive({version: 'v3', auth});

     drive.files.update({
         fileId: "1OG0iYpIGnR4yPHdeQTp_h2UhuD44Ux7v",
         addParents: 'root',
         removeParents: '1XhfOAf0mUeSZKLUmnzwz35Ir7t2MECRQ'
     }, function(err, file){
         if (err){
             console.log(err)
         }
         else{
             var fileMetadata = {
                 'name': 'TicketFlyReport'
             };
             var media = {
                 mimeType: 'text/rtf',
                 methods: "PATCH",
                 body: fs.createReadStream('FullReport.rtf')
             };
             drive.files.update({
                 resource: fileMetadata,
                 fileId: "1OG0iYpIGnR4yPHdeQTp_h2UhuD44Ux7v",
                 media: media,
                 fields: 'id'
             }, function (err, file) {
                 if (err) {
                     // Handle error
                     console.error(err);
                 } else {
                     console.log('File Id: ', file.id);
                     drive.files.update({
                         fileId: "1OG0iYpIGnR4yPHdeQTp_h2UhuD44Ux7v",
                         addParents: '1XhfOAf0mUeSZKLUmnzwz35Ir7t2MECRQ',
                         removeParents: 'root'
                     })
                 }
             });

         }
     })
 }

var days = {'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0};

function getDayPosition(day) {
     return days[day];
 }

function scheduleGenerator(dayOfTheWeek, inputTime, desiredTimeZone){

     var offset = new Date().getTimezoneOffset();

     Date.prototype.stdTimezoneOffset = function () {
         var jan = new Date(this.getFullYear(), 0, 1);
         var jul = new Date(this.getFullYear(), 6, 1);
         return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
     };

     Date.prototype.isDstObserved = function () {
         return this.getTimezoneOffset() < this.stdTimezoneOffset();
     };

     var today = new Date();
    if (today.isDstObserved() == false) {
        offset = offset + 60;
        console.log("DST is off!")
    }

    var desiredOffset = Number(desiredTimeZone.split("UTC")[1]) * 60 * -1;
    var UTCTime = Number(inputTime.split(":")[0]) + (offset/60);
    var dif = offset/60 - desiredOffset/60;
    var newHour = (Number(inputTime.split(":")[0]) - dif);
    var newMin = (Number(inputTime.split(":")[1]));
    var output = ({"dayOfWeek" : getDayPosition(dayOfTheWeek), "hour" : newHour, "minute" : newMin});
    return output;
 }

var schedule = require('node-schedule');

function runEDDUBA () {
    getTotalPages(function(pages){
        console.log("Total Pages in DB: ",pages);  //spits out how many pages there are in the database
        var startPage = 20;
        var page = startPage;
        var processedPages = page;
        pages = pages + 1;
       // goes through all the pages and adds them to an array "dataArray"
        run = function(){
            var urlTemplate = "https://www.ticketfly.com/search/page/" + page + "/?q";
            console.log("Calling: ",urlTemplate);
            //goes to the page and scrapes the JSON from the page and returns it so it passes that to the callback
            getEvents(urlTemplate, function(data){
                dataArray.push.apply(dataArray, data);
                console.log("Processed Page: ", processedPages);
                processedPages = processedPages + 1;
            });
            page++;
            if (page < pages){
                setTimeout(run, 1000);
            }
            else{
                processEvents();
            }
        };
        //prepping the data for the database
        //goes to the page and scrapes the JSON from the page and returns it
        //so it passes that to the callback that is how we are populating the "dataArray"
        function processEvents() {
            console.log("Waiting for process to finish...");
            try {
                if (processedPages ==  pages){
                    console.log("Array Length: ", dataArray.length);
                    // determine id
                    var data = dataArray;
                    //pads the number so they become 12 in total
                    for (entrie in data){
                        var temp_id = data[entrie]["url"].slice(0,-1).split("/").pop().split("-")[0]; // display the value of the last object in the array.
                        data[entrie]["_id"] = temp_id.padStart(12, '0'); //padded number with 12 digits total
                    }
                    // write data to DB
                    checkforDB(data, "main", function(){
                        console.log("Ready to process!!!");
                        compareAndReport("main", "tempDB", function(){
                            console.log("DONE!!!");
                        });
                    });
                    // backup of manual write to file method
                    /*
                    fs.writeFile('ticketflyDB.json', JSON.stringify(data), function(err){
                        // throws an error, you could also catch it here
                        if (err)
                            console.log(err);
                    });
                    */
                }
                else{
                    setTimeout(processEvents, 10000);
                }
            }
            catch (err) {
                setTimeout(processEvents, 10000);
                console.log("Processing Error: ", err);
            }
        }
        run();
    });
}

function main(){
    // console.log("here we are:", config.schedule);
    for (dayEntry in config.schedule){
        for (var x = 0; x < config.schedule[dayEntry].length; x++){
            console.log("--------------This is dayEntry:", dayEntry);
            console.log("--------------This is length:", config.schedule[dayEntry].length);
            console.log("--------------This is config.schedule:", config.schedule);
            var parsedSchedule = scheduleGenerator(dayEntry,config.schedule[dayEntry][x]["time"],config.schedule[dayEntry][x]["zone"]);
            console.log("Task Set for: ", parsedSchedule);
            // var taskThread = schedule.scheduleJob(parsedSchedule, function(){
            //     console.log("Running EDUBBA.");
            //     runEDDUBA ();
            // });
            //console.log("success!!");
            //runEDDUBA();
           //processEvents();
        }
    }
    //runEDDUBA();
    //checkforDB();
}
checkforDB();
main();

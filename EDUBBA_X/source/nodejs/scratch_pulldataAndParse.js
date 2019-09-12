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

function getTotalPages(callback){

    https.get('https://www.ticketfly.com/search/page/20/?q', function(resp){
        var data = '';

        resp.on('data', (function(chunk){
            data += chunk;
        }));

        resp.on('end', function (){

            const $ = cheerio.load(data);

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

// get the total number of pages there are in the current ticketfly database
var dataArray = [];

getTotalPages(function(pages){
    console.log("Total Pages in DB: ",pages);  //spits out how many pages there are in the database

    var startPage = 20;

    var page = startPage;

    var processedPages = page;

    pages = pages + 1;

    run = function(){
        var urlTemplate = "https://www.ticketfly.com/search/page/" + page + "/?q";

        console.log("Calling: ",urlTemplate);
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

    function processEvents() {
        console.log("Waiting for process to finish...");
        try {
            if (processedPages ==  pages){
                console.log("Array Length: ", dataArray.length);

                var data = dataArray;

                for (entrie in data){
                    var temp_id = data[entrie]["url"].slice(0,-1).split("/").pop().split("-")[0]; // display the value of the last object in the array.
                    data[entrie]["_id"] = temp_id.padStart(12, '0'); //padded number with 12 digits total
                }

                // write data to DB
                checkforDB(data, "main", function(){
                    console.log("Ready to process!!!");

                    compareAndReport("main", "ticketflyDB", function(){
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

function insertEvents(dataSet, targetDB, callback){

    try {

        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();

            db.collection(targetDB).insertMany(dataSet,{ ordered: false }, function (err, result) {
                if(err){
                    console.log("Error Inserting Many: ", err);
                    callback();
                }
                else {
                    console.log("Inserted a document into the collection.");
                    callback();
                }

                client.close();
            });
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
                    });
                });

                client.close();

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

            db.collection(targetDB).drop(function(){
                client.close();
                callback();
            });

        });

    }

    catch(err){

        console.log("Error: ",err)
    }

}

function checkforDB(dataSet, dbTarget, callback){

    try {

        MongoClient.connect(localMongoUrl, {poolSize:10} , function (err, client) {
            assert.equal(null, err);
            db = client.db();

            var collection = db.collection(dbTarget).findOne(function (err, result) {
                if (err) {
                    console.log("Error: ", err)
                }
                else {

                    if (result == null){
                        insertEvents(dataSet, dbTarget, function(){
                            client.close();
                            callback();
                        })
                    }

                    else {
                        console.log("Database Exists, Removing Temp.");
                        removeDB("tempDB", function(){
                            insertEvents(dataSet, "tempDB", function(){
                                client.close();
                            })
                        });
                        cloneDB("main", "backupDB", function(){
                            console.log("Done the Backup.");
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

        var myquery = { "_id" : input["_id"] };

        var newvalues = {$set: {offers: input["offers"] }};

        db3.collection("main").updateOne(myquery, newvalues, function(err, res) {

            if (err){
                console.log(err)
            }
            console.log(myquery, " has been updated.");

        })
    });

}

function compareAndReport(sourceDB, targetDB, callback){

    try {

        MongoClient.connect(localMongoUrl, {poolSize: 10}, function (err, client) {
            assert.equal(null, err);
            db = client.db();

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
                            console.log("newSoldOutEvents clear...")
                        });

                        // create new database for the newly sold out items
                        insertEvents(newSoldOut, "newSoldOutEvents", function(){
                            console.log("newSoldOutEvents database created and populated.");

                            // generate Report
                            var organizedData = {};
                            var report = "<html>";
                            for (var x = 0; x < newSoldOut.length - 1; x++) {

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

                                report = report + "<h1>" + year + "</h1>";

                                var months = Object.entries(Object.entries(data)[x][1]).length;

                                console.log("Months: ",months); // should be 4 and 1

                                for (var y = 0; y < months; y++){
                                    var month = Object.entries(Object.entries(data)[x][1])[y];
                                    var monthNumber = month[0] - 1;



                                    var monthName = month_names[monthNumber];
                                    console.log(monthNumber);

                                    report = report + "<h2>" + monthName + " " + year +"</h2>";

                                    var monthContent = month[1];

                                    var events = Object.entries(monthContent).length;
                                    for (var z = 0; z < events; z++){

                                        var event = Object.entries(monthContent)[z];

                                        var name = event[0].toString();
                                        var venues = event[1].toString();

                                        report = report + "<span style='text-transform: uppercase; font-weight: bold;'>" + name + "</span><span> " + venues + "</span><br>";

                                    }
                                }


                            }

                            report = report + "</html>";

                            fs.writeFile('NewSoldOutReport.html', report, function(err){
                                // throws an error, you could also catch it here
                                if (err)
                                    console.log(err);
                            });

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

                                            report = report + "<h1>" + year + "</h1>";

                                            var months = Object.entries(Object.entries(data)[x][1]).length;

                                            console.log("Months: ",months); // should be 4 and 1

                                            for (var y = 0; y < months; y++){
                                                var month = Object.entries(Object.entries(data)[x][1])[y];
                                                var monthNumber = month[0] - 1;



                                                var monthName = month_names[monthNumber];
                                                console.log(monthNumber);

                                                report = report + "<h2>" + monthName + " " + year +"</h2>";

                                                var monthContent = month[1];

                                                var events = Object.entries(monthContent).length;
                                                for (var z = 0; z < events; z++){

                                                    var event = Object.entries(monthContent)[z];

                                                    var name = event[0].toString();
                                                    var venues = event[1].toString();

                                                    report = report + "<span style='text-transform: uppercase; font-weight: bold;'>" + name + "</span><span> " + venues + "</span><br>";

                                                }
                                            }


                                        }

                                        report = report + "</html>";

                                        fs.writeFile('FullReport.html', report, function(err){
                                            // throws an error, you could also catch it here
                                            if (err)
                                                console.log(err);
                                        });

                                        callback();
                                    }

                                    fullReport(soldOutDB, function(){
                                        client.close();
                                    });
                                })});

                        });

                        client.close();

                    })
                });

                client.close();
            })

            callback();
        })



    }

    catch(err){

        console.log("Error: ",err);

        callback();
    }



}

/*
checkforDB(data, "main", function(){
    console.log("Ready to process!!!");
});
*/

compareAndReport("main", "ticketflyDB", function(){
    console.log("DONE!!!");
});

const https = require('https');
const cheerio = require('cheerio');
const http = require('http');
const fs = require('fs');
const url = require('url');

/*

===== Class Notes For Decomposing The Google Doc =====

c2 = an entry
c3 c0 = Month and Year
c0 = band name
c1 = venue
c1 c4 = itallic venue

 */


function convertHTMLtoCSV(input){

    function processData(data){

        const $ = cheerio.load(data);

        ($("p").each(function(){

            console.log($( this ).html())
        }))

    }

    if (input.split("//")[0] == "file:") {

        input = input.split("//")[1];

        var data = fs.readFileSync(input, 'utf8');

        processData(data);

    }

    else if (input.split("//")[0] == "https:") {

        https.get(input, function (resp) {
            var data = '';

            resp.on('data', (function (chunk) {
                data += chunk;
            }));

            resp.on('end', function () {

                processData(data);

            })
        }).on('error', function (err) {
            console.log(err);
        });

    }
}

var output = convertHTMLtoCSV('file:///home/silverstein_louis/WebstormProjects/EDUBBA/data/SoldOutEvents.html');
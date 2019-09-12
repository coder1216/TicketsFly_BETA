var data = {"2018":{"10":{"BASIA":["Yoshi's Oakland"],"Basia":["Rams Head On Stage"],"Blue Rodeo - Live at The KEE to Bala Saturday October 6th":["The KEE to Bala"],"Blue Rodeo - Live at The KEE to Bala Sunday October 7th":["The KEE to Bala"],"Colter Wall":["Rialto Bozeman"],"Courtney Barnett":["Observatory North Park"],"Every Time I Die":["Saint Vitus"],"half•alive":["Moroccan Lounge"],"HYUKOH - 24 TOUR":["The UC Theatre Taube Family Music Hall"],"Iron & Wine":["The Castle Theatre"],"Jonathan Van Ness & Friends":["The Lincoln Theatre"],"Leo Kottke":["The Armory"],"OFFICIAL 2018 ACL FEST LATE NIGHT SHOW: Gang of Youths":["Antone's"],"OWL CITY: CINEMATIC TOUR":["Crescent Ballroom"],"STANLEY CLARKE BAND":["Yoshi's Oakland"],"STRFKR: 10th Anniversary Tour":["The Bowery Ballroom"],"The Beths":["Alphaville"],"The Del McCoury Band":["The Armory"],"Wild Nothing":["The Independent"]},"11":{"(Sandy) Alex G":["First Unitarian Church"],"CAAMP: Boys Tour":["Troubadour"],"CONAN GRAY":["Rickshaw Stop"],"Conan Gray":["Mercury Lounge"],"Frankie Cosmos, Kero Kero Bonito":["The Regent Theater"],"Ghostemane":["The Echo"],"Jessie Reyez: Being Human On Tour":["Union Stage"],"Kristian Bush":["Eddie's Attic"],"Mac Ayres":["The Drake Hotel"],"Riley Green":["Georgia Theatre"],"shallou: souls world tour":["The Independent"],"Still Woozy":["Baby's All Right"],"Ween":["Palace Theatre - St. Paul/Minneapolis"],"Yellow Days":["Rock & Roll Hotel"]},"12":{"Caamp":["The Horseshoe Tavern"],"Japanese Breakfast":["Johnny Brenda's"]},"09":{"Alestorm":["El Corazon"],"Alvvays":["UnionTransfer"],"BOTMC- Early American Songster Banjo w/Dom Flemons":["Freight & Salvage Coffeehouse"],"Gin Blossoms":["Troubadour"],"Grace Potter's Grand Point North":["Waterfront Park Burlington"],"Hatchie":["Bootleg Theater - Bar Stage"],"Hot Snakes":["Cobra Lounge"],"Jonathan McReynolds #MakeRoomTour":["1884 Lounge"],"Michael Hurley":["Union Pool"],"Moon Taxi":["Georgia Theatre"],"Randy Rogers Band":["The Jones Assembly"],"SALES":["The Horseshoe Tavern"],"Social Distortion":["Georgia Theatre"],"State Champs":["Ace of Cups"],"SuperMega: Drunk Drawing LIVE":["The Hi Hat"],"The Dandy Warhols":["3TEN Austin City Limits Live"],"The Ocean Blue":["Union Stage"],"Todd Snider (seated)":["Sweetwater Music Hall", "Here is Fake", "DromeBox Labs"]}},"2019":{"05":{"Gift Cards":["Rick Bronson's House of Comedy - AZ"]}}}

var fs = require("fs");

var report = "<html>";

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

htmlToRtf.saveRtfInFile('report.rtf', htmlToRtf.convertHtmlToRtf(report));

report = report + "</html>";

fs.writeFile('report.html', report, function(err){
    // throws an error, you could also catch it here
    if (err)
        console.log(err);
});

var clientID = "244135471570-0b9u4lmb7br0hpn55g00b32ptu61pi3p.apps.googleusercontent.com";
var clientSecret = "ePeOkLHYY8OmAJEIuEqM-5E7";

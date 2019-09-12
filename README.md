Default Structure:

    root/
        appliance/  # Compiled Binaries or Finished Scripts
        assets/     # Required Objects and Linked Assets
        data/       # Sample Data-sets and or Local Database Entries
        docs/       # Documentation
        source/     # Sourcecode Repository
        README.md   # This file.

Custom Structure:

    customFolderName/

Note: camelCase is preferred.

---

Project Name: EDUBBA (house of scribal tablets)
Entity: Louis Silverstein
Author(s): Louis Silverstein
Contact: Louis@baraqu.com
URL:

---

Requirements:

---

Description: Custom analytics tools for Jake Teresi

Order Of Operations:
Scrape Ticketfly.com for all shows and enter them into a database
This needs to be able to run daily and update the current database
Tool for rendering database in a visual way that reflects the google doc that Jake Supplied
Notify Jake of new events that are SoldOut

Automated program that will check tickeyfly.com once a day or upon request and
query ticket availability. All “Sold Out” performances will be reported to a document and updated
when new information is available. Only bands and venues that are sold out will be added to the
document. Changes (updated status and band info) will be bolded or highlighted, and will be
returned as an email to the user.

Tags: api, database, analytics, scrape, rest, nodejs

---

ToDo:
        Set Schedule Module
        {"schedule" : {
            "monday" : [
                {
                    "time":"18:00",
                    "zone" : "UTC-5"
                }
            ],
            "tuesday" : [
                {
                    "time": "18:00",
                    "zone" : "UTC-5"
                }
            ],
            "wednesday" : [
                {
                    "time": "18:00",
                    "zone" : "UTC-5"
                }
            ],
            "thursday"  : [
               {
                   "time": "18:00",
                   "zone" : "UTC-5"
               }
            ],
            "friday" : [
                {
                    "time": "12:30",
                    "zone" : "UTC-5"
                },
                {
                    "time": "19:00",
                    "zone" : "UTC-5"
                }
            ],
            "saturday" : [
                {
                    "time": "10:00",
                    "zone" : "UTC-5"
                },
                {
                    "time": "18:00",
                    "zone" : "UTC-5"
                }
            ],
            "sunday"  : [
               {
                   "time": "18:00",
                   "zone" : "UTC-5"
               }
            ]
        }
    }

---------------------------------------------------

Part 2. Tickeymaster

Basically, three times a week — Sunday, Monday and Tuesday evenings — I spent 1.5-2 hours going through Ticketmaster's site, trying to find events that are going on sale or presale. Now, in doing this I have to comb through all the events that are already on sale. I search VIEW ALL EVENTS IN THE UNITED STATES, I go by date, but not location (I'm searching all locations).

What makes it take so long is that it can only load 500 results at a time.

https://www.ticketmaster.com/browse/all-music-catid-10001/music-rid-10001?rdc_emonth=10&tm_link=tm_changeloc_cities&rdc_syear=2018&rdc_sday=13&rdc_smonth=10&rdc_eyear=2018&rdc_eday=13&type=range&teval=

So I have to go a couple days at a time to find them all (in the FROM and TO boxes). I do this up to a year in advance.

I do this for Canada too, but it's quicker.

I need a way to see ONLY the events going on SALE/PRESALE. I spend way too much time looking through the dumb site just to isolate them.

------------------------------------------

Notes about the Tickeymaster API

https://app.ticketmaster.com/discovery/v2/events.json?countryCode=US&apikey=GjareoQoD8tjZUdPBXqjNpIhthQA5SUo&size=10&onsaleOnStartDate=2019-01-02

apiKey = "GjareoQoD8tjZUdPBXqjNpIhthQA5SUo"
"https://app.ticketmaster.com/discovery/v2/events.json?countryCode=US&apikey="+ apiKey + "&size=200&onsaleOnStartDate=" + data;

--------------------------------------------------------------

Part 3. TicketWeb.com

https://www.ticketweb.com/api/

https://www.ticketweb.com/api/events?version=1&method=json&page=50

--------------------------------------------------------------

Part 4. AXS

Can't find an API for the data

--------------------------------------------------------------

Part 5. Eventbright (issue?)

https://www.eventbrite.com/support/articles/en_US/How_To/how-to-locate-your-eventbrite-api-user-key?lg=en_US

https://www.eventbrite.com/platform/api/

Site Terms Prohibit Scraping (13-14) https://www.eventbrite.com/support/articles/en_US/Troubleshooting/eventbrite-terms-of-service?lg=en_US

---------------------------------------------------------------

Part 6. Etix.com

{"@context":"http://schema.org","@type":"WebSite","url":"https://tickets-online.com","potentialAction":{"@type":"SearchAction","target":"https://tickets-online.com/Search?query={search_term}","query-input":"required name=search_term"}}

This is the query for the autocomplete
https://tickets-online.com/autocomplete/?q=styx

Not sure what this is, but looks promising
https://www.tickets-online.com/es/ajax

https://www.youtube.com/list_ajax?style=json&action_get_list=1&list=UUsVcseUYbYjldc-XgcsiEbg


---------------------------------------------------------------

Misc Ticket Info

https://www.programmableweb.com/category/tickets/api

---------------------------------------------------------------

Scraping Tools

https://www.scraperapi.com/blog/the-10-best-rotating-proxy-services-for-web-scraping

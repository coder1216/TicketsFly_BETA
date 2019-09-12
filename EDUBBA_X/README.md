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

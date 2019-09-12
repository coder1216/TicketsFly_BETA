const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', "https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
// Authorize a client with credentials, then call the Google Drive API.
authorize(JSON.parse(content), insertFileToGoogle);
authorize(JSON.parse(content), updateFullReport);
});

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

function insertFileToGoogle(auth){
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

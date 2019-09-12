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
    to: 'jakefargoteresi@gmail.com, louis@baraqu.com', // list of receivers
    subject: 'New TickeyFly Report is ready!', // Subject line
    html: '<a href="https://drive.google.com/open?id=1XhfOAf0mUeSZKLUmnzwz35Ir7t2MECRQ">Report Folder</a>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
});
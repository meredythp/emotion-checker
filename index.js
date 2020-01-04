const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');

const server = app.listen(5000, () => {  
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


const verifySignature = (req) => { 
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
    const [version, hash] = signature.split('=');
  
    // Check if the timestamp is too old
    const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
    if (timestamp < fiveMinutesAgo) return false;
  
    hmac.update(`${version}:${timestamp}:${req.rawBody}`);
  
    // check that the request signature matches expected value
    return timingSafeCompare(hmac.digest('hex'), hash);
}; 


const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.post('/event', (req, res) => {
    console.log(req);
    console.log('--------------------------------------------------------');
    console.log(req.body);
    if (req.body.type === 'url_verification') {
        // console.log(req.body.challenge);
        res.send(req.body.challenge);
    }
    });
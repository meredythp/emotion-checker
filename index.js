const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');
const dotenv = require('dotenv');

const server = app.listen(5000, () => {  
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

dotenv.config();

const verifySignature = (req) => { 
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
    // console.log(`slack signing secret is ${process.env.SLACK_SIGNING_SECRET}`);
    const [version, hash] = signature.split('=');
  
    const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
    if (timestamp < fiveMinutesAgo) return false;
  
    hmac.update(`${version}:${timestamp}:${req.rawBody}`);
  
    // check that the request signature matches expected value
    console.log(`timingSafeCompare(hmac.digest('hex'), hash)`);
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
    console.log(req.body);
    if (req.body.type === 'url_verification') {
        // console.log(req.body.challenge);
        res.send(req.body.challenge);
    }

    else if (req.body.type === 'event_callback') {
        if (!verifySignature) {
          res.sendStatus(404);
          return;
        } else {
          res.sendStatus(200);
        }
        const {type, subtype, text, user, channel} = req.body.event;

        if(!text) return;

        let regex = /(^\/)/;
        if(subtype === 'bot_message' || regex.test(text)) return;
          getPersonality(text, user, channel);
      }
    });

const PersonalityInsightsV3 = require('ibm-watson/personality-insights/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const personalityInsights = new PersonalityInsightsV3({
  version: '2017-10-13',
  authenticator: new IamAuthenticator({
    apikey: `${process.env.PERSONALITY_IAM_APIKEY}`,
  }),
  url: `${process.env.PERSONALITY_URL}`,
});


function getPersonality(text, user, channel) {

  // let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
  // if(regex.test(text)) {
  //   text = text.replace(/_/g , ' ');
  //   text = text.replace(/:/g , '');
  // }
    console.log(text);
    console.log(personalityInsights)
    const profileParams = {
      // Get the content from the JSON file.
      content: require('./profile.json'),
      contentType: 'application/json',
      consumptionPreferences: true,
      rawScores: true,
    };

    personalityInsights.profile(profileParams)
      .then(profile => {
        let personality = JSON.stringify(profile, null, 2);
        console.log(`personality results are ${personality}`);
        postPersonality(personality, user, channel)
      })
      .catch(err => {
        console.log('error:', err);
      });
}

const apiUrl = 'https://slack.com/api';

const postPersonality = async(personality, user, channel) => { 
  const args = {
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: channel,
    text: `<@${user}> resutls are: ${personality.join(', ')}`
  };
  const result = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(args));
};







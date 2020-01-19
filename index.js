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
				const {type, text, user, channel} = req.body.event;

				if(!text) return;
				console.log(text);

				let hasSlackbot = text.includes('<@US84ZF3JB>');
				if (hasSlackbot) {
					postSlashDirections(text, user, channel);
				}

				let regex = /(^\/)/;
				// if(subtype === 'bot_message' || regex.test(text)) return;
				//   getPersonality(text, user, channel);
			}
		});

app.post('/slashcommand', (req, res) => {
	console.log(req.body);
	if (!verifySignature) {
		res.sendStatus(404);
		return;
	} else {
		res.sendStatus(200);
	}
	const {text, command, channel_id} = req.body;
	let targetUser = text.substring(
    text.lastIndexOf("<") + 1, 
    text.lastIndexOf("|")
	).replace("@", "");
	console.log(`targetUser is ${targetUser}`);
	if(targetUser.length < 2) return;
	getConverstationHistory(channel_id, targetUser);
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


function getPersonality(targetMessages, targetUser, channel_id) {

	// let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
	// if(regex.test(text)) {
	//   text = text.replace(/_/g , ' ');
	//   text = text.replace(/:/g , '');
	// }
		console.log(targetMessages);
		console.log(personalityInsights)
		const profileParams = {
			// Get the content from the JSON file.
			content: targetMessages,
			contentType: 'application/json',
			consumptionPreferences: true,
			rawScores: true,
		};

		personalityInsights.profile(profileParams)
			.then(profile => {
				let personality = JSON.stringify(profile, null, 2);
				console.log(`personality results are ${personality}`);
				postFile(profile, targetUser, channel_id);
				postPersonality(profile, targetUser, channel_id);
			})
			.catch(err => {
				console.log('error:', err);
			});
}

const apiUrl = 'https://slack.com/api';

const postFile = async(profile, user, channel) => { 
	const args = {
		token: process.env.SLACK_ACCESS_TOKEN,
		channel: channel,
		content: JSON.stringify(profile, null, 2)
	};
	const result = await axios.post(`${apiUrl}files.upload`, qs.stringify(args))
		.then((result) => { 
	    console.log('uploaded file'); 
	  }).catch((err) => {
	    console.log('err on files upload %0', err);
	  });
	console.log(result);
};

const postPersonality = async(profile, user, channel) => { 
	const args = {
		token: process.env.SLACK_ACCESS_TOKEN,
		channel: channel,
		text: `<@${user}>'s top personality traits are: ${JSON.stringify(profile.result.personality[0].name)}, ${JSON.stringify(profile.result.personality[1].name)}, ${JSON.stringify(profile.result.personality[2].name)}, ${JSON.stringify(profile.result.personality[3].name)}, and ${JSON.stringify(profile.result.personality[4].name)}`
	};
	const result = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(args));
	// console.log(result);
};

const postSlashDirections = async(profile, user, channel) => { 
	const args = {
		token: process.env.SLACK_ACCESS_TOKEN,
		channel: channel,
		text: `use /personality_bot @user_name to find personality results`
	};	
	const directions = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(args));
	// console.log(directions);
};

const getConverstationHistory = async(channel_id, targetUser) => { 
	const args = {
		token: process.env.SLACK_ACCESS_TOKEN,
		channel: channel_id
	};	
	let convoHistory = await axios.post(`${apiUrl}/channels.history`, qs.stringify(args));
	convoHistory = convoHistory.data.messages;
	let targetMessages = {"contentItems": []};
	convoHistory.forEach(
		function getTargetMessages(item) {
			if (item.user == targetUser) {
				let inputMessage = {"content": `${item.text}`};
				targetMessages.contentItems.push(inputMessage);
			};
		});
	// console.log(targetMessages);
	getPersonality(targetMessages, targetUser, channel_id);
};					

function putMessageUser(item, index) {
	console.log(item.user);
};






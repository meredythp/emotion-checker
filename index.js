'use strict';

const PersonalityInsightsV3 = require('ibm-watson/personality-insights/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const personalityInsights = new PersonalityInsightsV3({
	version: '2017-10-13',
	authenticator: new IamAuthenticator({
		apikey: `qM9W4FDh0YMqLTswruNChPOlYXnD1EP0Rpmw-0kXj2T_`,
	}),
	url: `https://api.us-south.personality-insights.watson.cloud.ibm.com/instances/026798e4-d337-4c2f-b7c0-f77b084b083a`,
});

function getPersonality(targetMessages, targetUser) {
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
			})
			.catch(err => {
				console.log('error:', err);
			});
}

funtion getUserName(inputText) {
	console.log(`inputText are ${inputText}`);
}

// funtion getUserMessages(inputText, userName) {

// }

function processInputs(inputText) {
	console.log(`inputText are ${inputText}`)
	getUserName(inputText)
	// getUserMessages(inputText, userName)
	// displayResults()
}

function displayResults(responseJson) {
  console.log(responseJson);
  document.getElementById('results').innerHTML = "<h2>Here are your personality traits:</h2>";

  for(var i = 0; i < responseJson.message.length; i++) {
    var pictureURL = responseJson.message[i];
    console.log(pictureURL);
    var newTrait = document.createElement("ul");
    newTrait.setAttribute("class", "results");
    // console.log(newDog);
    document.getElementById('results').appendChild(newTrait);
  }
  $('.results').removeClass('hidden');
}

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    var inputText = document.getElementById('messageText').value;
    processInputs(inputText);
  });
}

$(function() {
  console.log('App loaded! Waiting for submit!');
  watchForm();
});
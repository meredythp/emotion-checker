'use strict';

// pings emotion checking api and starts process to get tone
function getSentiment(inputText) {
	$('.results').addClass('hidden')
	document.getElementById('submitButton').style.backgroundColor = 'grey';
	var encodedText = encodeURIComponent(inputText);
	getTone(encodedText);
	var url = "https://twinword-emotion-analysis-v1.p.rapidapi.com/analyze/?text=" + encodedText
	fetch(url, {
		"method": "GET",
		"headers": {
			"x-rapidapi-host": "twinword-emotion-analysis-v1.p.rapidapi.com",
			"x-rapidapi-key": "5ba8f7281emshb675d036ab63e58p1f65e4jsn0785dc59f1da"
		}
	})
	.then(response => response.json())
	.then(responseJson => displayResults(responseJson))
	.catch(error => alert(error));
}

// pings tone detection api and starts update background method with results
function getTone(encodedText) {
	var url = "https://twinword-sentiment-analysis.p.rapidapi.com/analyze/?text=" + encodedText
	fetch(url, {
	"method": "GET",
	"headers": {
		"x-rapidapi-host": "twinword-sentiment-analysis.p.rapidapi.com",
		"x-rapidapi-key": "5ba8f7281emshb675d036ab63e58p1f65e4jsn0785dc59f1da"
		}
	})
	.then(response => response.json())
	.then(responseJson => updateBackground(responseJson))
	.catch(error => alert(error));
}

// adds each trait as a span with results class and unhides results container
function displayResults(responseJson) {
	document.getElementById('submitButton').style.backgroundColor = "rgb(0, 173, 185)";
	console.log(responseJson);
	console.log(responseJson.emotions_detected)
	if (responseJson.emotions_detected.length > 0) {
		document.getElementById('results').innerHTML = "<h2>Emotions detected:</h2>";
		for(var i = 0; i < responseJson.emotions_detected.length; i++) {
			var emotion = responseJson.emotions_detected[i];
			var newTrait = document.createElement("span");
			newTrait.setAttribute("class", "results");
			newTrait.innerHTML = emotion;
			document.getElementById('results').appendChild(newTrait);
			document.getElementById('results').appendChild(document.createElement("br"));
		}
	} else {
		document.getElementById('results').innerHTML = "<h2>No emotions detected</h2>";
	}
	$('.results').removeClass('hidden');
}

// makes results container yellow, red, or grey, depending on tone
function updateBackground(responseJson) {
	console.log(responseJson.type)
	if (responseJson.type == "positive") {
		document.getElementById('results').style.backgroundColor = "rgb(255, 252, 156)";
	} else if (responseJson.type == "negative") {
		document.getElementById('results').style.backgroundColor = "rgb(255, 207, 207)";
	}
	else {
		document.getElementById('results').style.backgroundColor = "#f2f2f2";
	}
}

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
		var inputText = document.getElementById('messageText').value;
		console.log(inputText);
    getSentiment(inputText);
  });
}

$(function() {
  console.log('App loaded, watching');
  watchForm();
});
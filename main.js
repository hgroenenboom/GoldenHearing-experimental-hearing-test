// Requires:
// - WebAudio
// - Chart.js
// - d3

// Constants / Settings
const pages = ["startscreen", "calibration", "likert", "results"];
const likertList = ["Not at all", "Slightly", "Moderately", "Very", "Extremely"];

// Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();

// Loaded AudioBuffers
let buffers = [];

// Audio URL sources
const instrumentPaths = [
	['audio/samples/Piano_Original_1.wav'], 
	// ['audio/samples/Piano_TD10_Original_1.wav'], 
	['audio/samples/Piano_TD5_Original_1.wav'], 
	['audio/samples/Snare_Original_1.wav'], 
	// ['audio/samples/Snare_td10_Original_1.wav'], 
	['audio/samples/Snare_td5_Original_1.wav'], 
	['audio/samples/woodblock_Original_1.wav'], 
	// ['audio/samples/woodblock_td10_Original_1.wav'], 
	['audio/samples/woodblock_td5_Original_1.wav']
];
const ambiencePaths = [
	['audio/samples/Backgrounds/orchestra.wav'], 
	['audio/samples/Backgrounds/party.wav'], 
	// ['audio/samples/Backgrounds/traffic.wav'], 
];

// Debugging: only generates one audio settings
// instrumentPaths = [instrumentPaths[0]];
// ambiencePaths = [ambiencePaths[0]];
// ambiencePaths = [];

// variables used for saving all results
var numResults = 0;
var currentLikertButton = null;
var results = []; 

var instrument = new Sound(0);
var ambience = new Sound(1);
var calibrationAudio = null;

// Website state
var allAudioFilesLoaded = false;
var currentPage = 0;

// List of all playback rate frequencies used inside the test
// the amount of values is a multiplication of the number of samples and the amount of random number generated
const numberOfFrequencyVariations = 5;
const maximumFrequency = 60;
const minimumFrequency = 15;
let __availableFrequencies = [];
for(let i = 0; i < numberOfFrequencyVariations; i++) 
{
	const freq = minimumFrequency + (maximumFrequency - minimumFrequency) / (numberOfFrequencyVariations - 1) * i;

	for(let j = 0; j < instrumentPaths.length; j++) 
	{
		__availableFrequencies.push([freq, j]); 
	}
}
const availableFrequencies = d3.shuffle(__availableFrequencies);


/*--------------------------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------------------------*/

// handle all keyboard input (a bit chaotic still)
var keys = {};
function handleInput(e) {
    keys[e.keyCode] = true;

	if(pages[currentPage] == 'startscreen') {
		switchPage(e);
	}

    if( pages[currentPage] == 'likert' && (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105) ) {
        const key =  e.keyCode % 48;
        
        if(key > 0 && key <= 5) {
            const likertButtons = jQuery("#likertbuttons button");
            likertButtons[key - 1].click();
        }
    }

    // Enter key
    if(e.keyCode == 13) {
        if(jQuery("#likert")[0].classList.contains("visible")) {
            nextTest();
        }
    }
}
window.onkeydown = handleInput;
window.onkeyup = function(e) { 
	keys[e.keyCode] = false; 
}

$(window).resize( function() {
	if(currentPage == 3) {
		drawGraph(results);
	}
});

$(window).mousedown( function(){
    handleInput("mouseclick");
})

// Switch between document states of the test
// TODO: should just be seperate pages
function switchPage(e) 
{
	if (!allAudioFilesLoaded || currentPage == pages.length) 
	{
		return;
	}		
		
	const currentPageDiv = $("#" + pages[currentPage]);
	
	if(currentPageDiv.hasClass("visible")) 
	{
		const nextPage = $("#" + pages[currentPage + 1]);
		
		currentPageDiv.addClass('invisible').removeClass("visible");
		nextPage.addClass('visible').removeClass("invisible");

		switch (pages[currentPage]) 
		{
			case "calibration":
				calibrationAudio.togglePlayback(document.getElementById("calib_button"), 1);
				nextTest(true);
				break;
			case "likert":
				drawTable();
				instrument.togglePlayback(buffers, 1);
				ambience.togglePlayback(buffers, 1);
				break;
			case "startscreen":
				calibrationAudio.togglePlayback(document.getElementById("calib_button"), 2);
				break;
		}

		currentPage++;
	}
}

$(document).ready(function()
{
	jQuery("#startscreen_dynamicText")[0].innerHTML = "please wait till all audio has been loaded";
	
	const buttons = document.getElementsByTagName('button');
	for(let i = 0; i < buttons.length; i++) 
	{
        if(buttons[i].classList.contains("buttonOn") || buttons[i].classList.contains("buttonOff")) 
		{
			const id = "" + buttons[i].id;
			if(id.substring(0, 7) == "likert") {
				buttons[i].innerHTML = likertList[buttons[i][8] * 1];
			}
		}
	}
	
	// Get all soundbuffers as soon as the document is loaded
	let allAudioFiles = instrumentPaths.concat(ambiencePaths);
    allAudioFiles.push(["audio/calibrationFile.ogg"]);

	downloadAudioBuffers(allAudioFiles);
});

function soundsLoadedCallback() 
{
    const calibBuffer = buffers[buffers.length - 1];
	calibrationAudio = new SimpleSound(calibBuffer);

    buffers.pop();
    
	jQuery("#startscreen_dynamicText")[0].innerHTML = "Press any button or tap/click screen to continue";
    jQuery("#startscreen_dynamicText")[0].style.color = "Blue";
	
	// Configure audio HTML element
    audioElement = document.querySelector("audio");
	const track = audioCtx.createMediaElementSource(audioElement);
	const volumeControl = document.querySelector('[data-action="volume"]');
	volumeControl.addEventListener('input', function() {
		gainNode.gain.value = this.value;
	}, false);
	track.connect(gainNode).connect(audioCtx.destination);
	
	// Start audio - TODO: is this necessary?
	audioCtx.resume();
}

function downloadAudioBuffers(urls) 
{
	const progressHtmlId = "audioLoadingProcess";
	if( document.getElementById(progressHtmlId) === null ) 
	{
		$( "<div id='" + progressHtmlId + "' class='centered bottomhalf'></div> " ).appendTo( jQuery("#startscreen_dynamicText") );
	} 

    let loadingProgress = [];
	let numDone = 0;
    
	for(let i = 0; i < urls.length; i++) 
	{
		let request = new XMLHttpRequest();
		request.open('GET', window.location.href + "/" + urls[i][0], true);
		request.responseType = 'arraybuffer';
		
		function showProcess(e) 
		{	
			// Update loadingProgress array
			const currentRequestLoadingProgress = e.loaded / e.total * 100 / (2 * instrumentPaths.length);
			loadingProgress[i] = currentRequestLoadingProgress != NaN ? currentRequestLoadingProgress : 0;
			
			const total = loadingProgress.reduce((a, b) => a + b, 0);
			document.getElementById(progressHtmlId).innerHTML = "loading: " + total + "%";
		}
		
		request.onload = function() 
		{
			console.groupCollapsed("HTMLRequest onLoad: " + this.responseURL);
			
			const urlIndex = i;
			const audioData = this.response;
			audioCtx.decodeAudioData(audioData, function(buffer) 
			{
				buffers[urlIndex] = buffer;
                
				numDone++;
				if(numDone < urls.length)
				{
					return;
				}

				console.log("all files loaded!");
				document.getElementById("audioLoadingProcess").innerHTML = "";
				allAudioFilesLoaded = true;
				soundsLoadedCallback(); 
			}, function(e) {
				console.log("\tError while decoding audio data: '" + e.error); 
            });
			
            console.groupEnd();
		}
        request.addEventListener("error", function (e) {console.log("\trequest-error" + e);});
		request.addEventListener("abort", function (e) {console.log("\trequest-abort" + e);});
		request.addEventListener("progress", showProcess);
		request.addEventListener("load", showProcess );

		request.send();
	}
}

function resetAllToggleableButtons() 
{
	const buttons = document.getElementsByTagName('button');
	for(let i = 0; i < buttons.length; i++) 
	{
		buttons[i].classList.add("buttonOff");
		buttons[i].classList.remove("buttonOn");
	}
}

function likertButtonClicked(e, buttonNumber) 
{
	if ( e.classList.contains("buttonOn")) 
	{
		resetAllToggleableButtons();
		e.classList.add("buttonOff");
		e.classList.remove("buttonOn");
	} 
	else 
	{
        currentLikertButton = buttonNumber;
		resetAllToggleableButtons();
		e.classList.add("buttonOn");
		e.classList.remove("buttonOff");

		nextTest();
	}
}

let testCounter = 0;
function nextTest(forceNewSound = false) 
{
	// forceNewSound makes sure a new sound file is generated even if no rating is yet selected.
	if(forceNewSound)
	{
		console.groupCollapsed("Tests");
	}

	const buttons = document.getElementsByTagName('button');
	let likertButtonToggled = false;
	for(let i = 0; i < buttons.length; i++) {
		if(buttons[i].id.includes("likert") && buttons[i].classList.contains("buttonOn")) {
			likertButtonToggled = true;
			break;
		}
	}

	if(likertButtonToggled) 
	{
        results.push([currentLikertButton, instrument.frequency, instrument.selectedAudio]);
        numResults++;
		resetAllToggleableButtons();
	}

	// Select a new frequency and instrument and background sound file
	if(likertButtonToggled || forceNewSound) 
	{
		instrument.frequency = availableFrequencies[testCounter][0];
		const selectedAudioFile = availableFrequencies[testCounter][1];
		instrument.selectedAudio = selectedAudioFile;
		ambience.selectedAudio = selectedAudioFile;
		
		console.log("New test: frequency=" + instrument.frequency + ", audioFile=" + selectedAudioFile);
		instrument.play(buffers);
		ambience.play(buffers);
		
		testCounter++; 
		testCounter %= availableFrequencies.length;
	}

    jQuery("#testTitle")[0].innerHTML = "Hearing test (" + numResults + "/" + availableFrequencies.length + ")";
	
	if(results.length >= availableFrequencies.length) {
		console.groupEnd();
		switchPage("show results");
	}
}

function Sound(whichPartOfBuffer) 
{ 
	this.part = whichPartOfBuffer;
	this.source = null;   
	this.isPlaying = false;
	this.frequency = null;
	this.selectedAudio = 0;
	
    this.togglePlayback = function(buffers, mode = 3, loop = false) 
	{
        // 1=stop, 2=start, 3=toggle
        if(mode==2) 
		{
            this.play(buffers, loop);
            jQuery("#play_sound_button")[0].innerHTML = "Stop sound";
        } 
		else if (mode==1) 
		{
            this.stop(loop);
            jQuery("#play_sound_button")[0].innerHTML = "Start sound";
        } 
		else if (mode==3) 
		{
			if(this.isPlaying) 
			{
				this.stop(loop);
			} 
			else 
			{
				this.play(buffers, loop);
			}
		}
    }
	
	this.play = function(buffers, loop = true) 
	{
		if(this.source) {this.source.stop();}
		
		this.source = audioCtx.createBufferSource();
		this.source.buffer = buffers[this.selectedAudio + this.part * 0.5 * buffers.length];
		this.source.loop = loop; 
		if(this.frequency != null) {
			this.source.loopEnd = 1 / this.frequency;
		}
		this.source.connect(gainNode).connect(audioCtx.destination);
		this.source.start();
		this.isPlaying = true;

		jQuery("#play_sound_button")[0].innerHTML = "Stop sound";
	}
	
	this.stop = function() 
	{
		jQuery("#play_sound_button")[0].innerHTML = "Start sound";
		this.source.stop();
		this.isPlaying = false;
	}
}

function SimpleSound(audioBuffer, loop = true) 
{
	this.audiobuffer = audioBuffer;
	this.source = null;   
	this.isPlaying = false;
    this.loop = loop;
	
    this.togglePlayback = function(e, mode = 3) 
	{
        // 1=stop, 2=start, 3=toggle
        
        if(mode==2) 
		{
            this.play();
            e.innerHTML = "Stop sound";
        } 
		else if (mode==1) 
		{
            this.stop();
            e.innerHTML = "Start sound";
        } 
		else if (mode==3) 
		{
			if(this.isPlaying) 
			{
				this.stop();
				e.innerHTML = "Start sound";
			} 
			else 
			{
				this.play();
				e.innerHTML = "Stop sound";
			}
		}
    }
	
	this.play = function() 
	{
		if(this.source != null) {this.source.stop();}
		this.source = audioCtx.createBufferSource();
        
        this.source.buffer = this.audiobuffer;
		this.source.loop = this.loop; 
        this.source.endLoop = this.audiobuffer.duration;
		this.source.connect(gainNode).connect(audioCtx.destination);
		this.source.start();
		this.isPlaying = true;
	}
	
	this.stop = function() 
	{
		this.source.stop();
		this.isPlaying = false;
	}
}

function drawTable() {

    data = "All data: ["
    for (var i = 0; i < results.length; i++) {
        // data += "("+i+") ";
        data += ("["+results[i][1]).substring(0,4)+", ";
        data += "\""+likertList[results[i][0]] + "\", ";
		data += ""+results[i][2]+"], ";
    }
    data += "]"
    
    //console.log(data);
    jQuery("#how_to_change_text_in_html")[0].innerHTML = data;
    
    /////////////////////////////////////////////////////////

    dataForGraph = [];
    for(var v = 0; v < likertList.length; v++) {
        count = 0;
        addedFrequencies = 0;
        for(var i = 0; i < results.length; i++) {
            if(results[i][0] == v) {
                addedFrequencies += results[i][1];
                count++;
            }
        }
        if(count != 0) {
            dataForGraph.push(addedFrequencies/count);
        } else {
            dataForGraph.push(0);
        }
    }
	
	/////////////////////////////////////////////////
    
    var body = document.getElementById("results_table");
    var tbl = document.createElement("table");
    var tblBody = document.createElement("tbody");

    for (var i = 0; i < likertList.length; i++) {
        var row = document.createElement("tr");

        var cell = document.createElement("td");
        var cellText = document.createTextNode((""+dataForGraph[i]).substring(0,4)+"Hz");
        cell.appendChild(cellText);
        row.appendChild(cell);
        
        var cell = document.createElement("td");
        var cellText = document.createTextNode(likertList[i]);
        cell.appendChild(cellText);
        row.appendChild(cell);
		
        tblBody.appendChild(row);
    }

    tbl.appendChild(tblBody);
    body.appendChild(tbl);
    tbl.setAttribute("border", "2");
	
	
    drawGraph(results);
}

// TODO:
// create data elements outside of drawGraph, make drawGraphs argument MDArray. (example: [[data], [data2], [data3]])
// use forloop to iterate through data and to show in graph. 
//      All this will make sure this drawGraph object is able to draw multiple graphs.
//      It will probably also need params like: dataLabels, dataColours='def', x_axis_label='x', y_axis_label='x', fontsize=20, title='graph', xRange='def' [0,4], yRange='def'[0,4], xTickscallback='def', yTickscallback='def', xsteps='def', ysteps='def'
// for this example it would be:
//      drawGraph([[datPia],[datSna],[datWoo],[allData]], ["Piano","Snare","Woodblock","Average"], ['#8789ff','#c1f9ff','#ffc1c1','#000000'], 'Playback frequency', 'Distinguishability', 20, 'Distinguishability of individual notes with different playback frequencies', 'def', [0,4], function(value, index, values) {return value+"Hz";}, function(value, index, values) {return likertList[Math.floor(value)];}, 'def', 1);
function drawGraph(dat) {
	// dat[0] = rating, dat[1] = freq, dat[2] = instrument
	var accuracy = 4;
	//console.log(dat);
	datPia = [];
	datSna = [];
	datWoo = [];
	allData = [];
	
	// dat[0] = freq, dat[1] = rating
	for(var i = 0; i < dat.length; i++) {
		var dataP = [dat[i][1], dat[i][0]];
		switch (dat[i][2]) {
			case 0:
				datPia.push(dataP);
				break;
			case 1:
				datSna.push(dataP);
				break;
			case 2:
				datWoo.push(dataP);
				break;
		}
		allData.push(dataP);
	}
	
	var getAveraged = function(data) {
		var freqRange = maximumFrequency-minimumFrequency;
		var freqIncr = freqRange / accuracy;
		newData = [];
		for(var v = 0; v < accuracy; v++) {
			var freq = minimumFrequency+0.5*freqIncr*(v+1);
			count = 0;
			addedResults = 0;
			for(var i = 0; i < data.length; i++) {
				if(data[i][0] >= freq && data[i][0] < freq+freqIncr) {
					addedResults += data[i][1];
					count++;
				}
			}
			console.log(addedResults);
			newData.push(addedResults/count);
		}
		return newData;
	}
	
	allData = getAveraged(allData);
	datPia = getAveraged(datPia);
	datSna = getAveraged(datSna);
	datWoo = getAveraged(datWoo);
	
	console.log(allData);
	console.log(datPia);
	console.log(datSna);
	console.log(datWoo);
	
	lab = [];
	for(var i = 0; i < accuracy; i++) {
		var freqIncr = (maximumFrequency-minimumFrequency)/(accuracy-1);
		lab.push(minimumFrequency+freqIncr*i);
	}
	console.log(lab);
	
    scaleY = $(window).height() / 1080;
    scaleX = $(window).width() / 1920;
    scale = Math.min(scaleX, scaleY);
    console.log("scale = "+scale);
    
    //var Chart = require('chart.js'); 
	Chart.defaults.global.elements.line.fill = false;
	Chart.defaults.global.defaultFontSize = scale*25;
    var c = new Chart(document.getElementById("myChart"), {
        type: 'line',
        data: {
            labels: lab,
            datasets: [{
                label: 'Piano',
                data: datPia,
				borderColor: "#8789ff",
                borderWidth: scale*4
            }, {
                label: 'Snare',
                data: datSna,
				borderColor: "#c1f9ff",
                borderWidth: scale*4
            }, {
                label: 'Woodblock',
                data: datWoo,
				borderColor: "#ffc1c1",
                borderWidth: scale*4
            }, {
                label: 'Average',
                data: allData,
				borderColor: "#000000",
                borderWidth: scale*6
            }
			]
        },
        options: {
            scales: {
                yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Distinguishability'
					  },
                    ticks: {
                        beginAtZero:true,
						min: 0, // minimum value
						max: 4, // maximum value
						stepSize: 1,
						callback: function(value, index, values) {
							return likertList[Math.floor(value)];
						},
						fontSize: scale*15
                    },
                }],
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Playback frequency'
					  },
                    ticks: {               
						callback: function(value, index, values) {
							return value.toFixed(1)+"Hz";
						},
						fontSize: scale*15
                    },
                }]
            },
			title: {
				display: true,
				text: 'Distinguishability of individual notes with different playback frequencies',
				fontSize: scale*25
			},
			legend: {
				fontSize: scale*15
			}
        }
    });
	console.log(c);
	document.getElementById("myChart").style.backgroundColor = 'rgba(255,255,255,255)';
}
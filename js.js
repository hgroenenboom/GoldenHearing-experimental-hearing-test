	console.log("deb versie 4");

// get context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// dsp modules
const gainNode = audioCtx.createGain();

var instrumentPaths = [
	// ["audio/Aestethics_3.mp3", "audio/mpeg"],
	
	["https://hgroenenboom.github.io/HKU-Hearing-test/audio/Impulse.mp3"],
	["https://hgroenenboom.github.io/HKU-Hearing-test/audio/Impulse_h.mp3"],
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Piano_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Piano_TD10_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Piano_TD5_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Snare_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Snare_td10_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Snare_td5_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/woodblock_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/woodblock_td10_Original_1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/woodblock_td5_Original_1.mp3']
];
var ambiencePaths = [
	["https://hgroenenboom.github.io/HKU-Hearing-test/audio/Aestethics_3.mp3", "audio/wav", "audio/mpeg"], 
	["https://hgroenenboom.github.io/HKU-Hearing-test/audio/Aestethics_3_h.mp3", "audio/mp3"],
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Background/162765__dorhel__symphony-orchestra-tuning-before-concert.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Background/191350__malupeeters__traffic-mel-1.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Background/214993__4team__ambient-sound-inside-cafe-dining.mp3'], 
	['https://hgroenenboom.github.io/HKU-Hearing-test/audio/Hearingtest Samples/Background/387548__mikikroom__city-milano-traffic-whistle-moto.mp3']
];
var buffers = [];
// var instrumentBuffers = [];
// var ambienceBuffers = [];

var loadingProcessIdentifiers = [0];
var loadingProcess = [0];
loadingProcess.length = instrumentPaths.length*2;
for(var i = 0; i < loadingProcess.length; i++) { loadingProcess[i] = 0; }
loadingProcessIdentifiers.length = instrumentPaths.length*2;

// saving all results
var numResults = 0;
var activeButtonNum = null; // currently active likert button
var results = []; 
var chosenAudio = 0;
var instrument = new Sound(0);
var ambience = new Sound(1);

$(document).ready(function(){
	jQuery("#startscreen")[0].innerHTML = "please wait till all audio has been loaded";
	
	var allPaths = instrumentPaths.concat(ambiencePaths);
	buffers = getSoundBuffers(allPaths);
});

function documentReadyPart2() {
	jQuery("#startscreen")[0].innerHTML = "Press space to continue";
	
	// initiate audio elements
    audioElement = document.querySelector("audio");
	
	const track = audioCtx.createMediaElementSource(audioElement);
	const volumeControl = document.querySelector('[data-action="volume"]');
	volumeControl.addEventListener('input', function() {
		gainNode.gain.value = this.value;
	}, false);
	track.connect(gainNode).connect(audioCtx.destination);
	
	// start audio - necessary?
	audioCtx.resume();
	
	// console.log(buffers);
	// var half_length = ambiencePaths.length;    
	// instrumentBuffers = buffers.slice(0,half_length);
	// ambienceBuffers = buffers.slice(half_length,half_length+half_length);
	// console.log(buffers.slice(half_length,half_length+half_length));
	// console.log(buffers);
	
	// console.log("instrumentBuffers: ");
	// console.log(instrumentBuffers);
	// console.log("ambienceBuffers: ");
	// console.log(ambienceBuffers);
}

function getSoundBuffers(soundPaths) {
	var buffers = [];
	var isDone = [];
	buffers.length = soundPaths.length;
	
	var request = null;
	for(var i = 0; i < soundPaths.length; i++) {
		isDone.push(false);
		loadingProcessIdentifiers[i] = soundPaths[i][0];
		
		
		request = new XMLHttpRequest();
		request.open('GET', soundPaths[i][0], true);
		request.responseType = 'arraybuffer';
		
		var showProcess = function (e) {	
			console.log("inside showprocess with e.loaded: "+e.loaded / e.total * 100 / (instrumentPaths.length*2));
			console.log("original url = "+e.srcElement.responseURL);
			var n = loadingProcessIdentifiers.indexOf(e.srcElement.responseURL);
			console.log("n = "+n);
			
			var text = "audioLoadingProcess";
			if( document.getElementById(text) == null ) {
				$( "<div id='"+text+"' class='centered bottomhalf'></div> " ).appendTo( jQuery("#startscreen") );
			} 
			
			var val = e.loaded / e.total * 100 / (instrumentPaths.length*2);
			if(val != NaN) {loadingProcess[n] = val;} else {loadingProcess[n] = 0;}
			console.log("inside showprocess with loadingprocess: " + loadingProcess);
			
			var total = 0
			for(var j = 0; j < loadingProcess.length; j++) {
				total += loadingProcess[j];
			}
			document.getElementById(text).innerHTML = "loading: "+total+"%";
		}
		
		request.addEventListener("load", function (e){ console.log("\trequest-load");showProcess(e); });
		request.addEventListener("error", function (e) {console.log("\trequest-error");});
		request.addEventListener("abort", function (e) {console.log("\trequest-abort");});
		request.addEventListener("progress", showProcess);
		
		request.onload = function() {
			var n = loadingProcessIdentifiers.indexOf(this.responseURL);
			var audioData = this.response;
			audioCtx.decodeAudioData(audioData, function(buffer) {
				buffers[n] = buffer;
			}, function(e){console.log("Error with decoding audio data" + e.error);});
			
			// check if all buffers are loaded
			isDone[n] = true;
			var allIsDone = true;
			for(var a = 0; a < isDone.length; a++) {
				if(isDone[a] != true) { allIsDone = false; break; }
			}
			if(allIsDone) { documentReadyPart2(); };
		}
		request.send();
	}
	
	console.log("loadingProcessIdentifiers: ");
	console.log(loadingProcessIdentifiers);
	return buffers;
}

// get keyboard responses
var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) {
    //console.log(e.keyCode);
    keys[e.keyCode] = true;
    if(e.keyCode == 32) {
        stateSwitch(e);
    }
    if((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
        var key =  e.keyCode % 48;
        
        if(key > 0 && key <= 5) {
            var likertButtons = jQuery("#likertbuttons button");
            likertButtons[key-1].click();
        }
    }
    // enter
    if(e.keyCode == 13) {
        if(jQuery("#likert")[0].classList.contains("visible")) {
            nextTest();
        }
    }
}

// switch between document states of the test (hoe werkt dit bij andere websites?)
function stateSwitch(e) {
	var divs = document.getElementsByTagName('div');
	
	console.log(document.getElementById("startscreen").classList.contains("visible"));
	if(document.getElementById("startscreen").classList.contains("visible") && document.getElementById("startscreen").innerHTML == "Press space to continue") {
		$("#startscreen").addClass('invisible').removeClass("visible");
		$("#likert").addClass('visible').removeClass("invisible");
		nextTest(true);
	}
	if((keys[32] || e=="show results") && results.length != 0 ) {
		$("#likert").addClass('invisible').removeClass("visible");
        drawTable();
        instrument.togglePlayback(buffers, 1);
		ambience.togglePlayback(buffers, 1);
		$("#results").addClass('visible').removeClass("invisible");
		return;
	}
}

function likertButtonClicked(e, buttonnum) {
	if ( e.classList.contains("buttonOn")) {
		resetAllToggleableButtons();
		e.classList.add("buttonOff");
		e.classList.remove("buttonOn");
	} else {
        activeButtonNum = buttonnum;
		resetAllToggleableButtons();
		e.classList.add("buttonOn");
		e.classList.remove("buttonOff");
		//document.getElementById("next_file_button").disabled = '';
		nextTest();
	}
}

function resetAllToggleableButtons() {
	var buttons = document.getElementsByTagName('button');
	for(var i = 0; i < buttons.length; i++) {
        if(buttons[i].classList.contains("buttonOn")) {
			buttons[i].classList.add("buttonOff");
			buttons[i].classList.remove("buttonOn");
        }
	}
	//document.getElementById("next_file_button").disabled = "disabled";
}

// generate next test data
function nextTest(override = false) {
	// override toggle can make sure a new sound file is generated even if no rating is selected yet.
	var buttons = document.getElementsByTagName('button');
	var isAButtonToggled = false;
    var activeButton = -1;
	for(var i = 0; i < buttons.length; i++) {
		if(buttons[i].id.includes("likert")) {
			if(buttons[i].classList.contains("buttonOn")) {
				isAButtonToggled = true;
			}
		}
	}
	if(isAButtonToggled) {
        results.push([activeButtonNum, instrument.frequency, instrument.selectedAudio]);
        numResults++;
		resetAllToggleableButtons();
	}
	if(isAButtonToggled || override) {
		// random audio and soundfile
		instrument.frequency = 10+20*Math.random(30, 60);
		chosenAudio = Math.floor(Math.random() * instrumentPaths.length);
		instrument.selectedAudio = chosenAudio;
		ambience.selectedAudio = chosenAudio;
		instrument.play(buffers);
		ambience.play(buffers);
		console.log(""+instrument.frequency+ " - " +chosenAudio);
	}
	
	if(results.length >= 10) {
		stateSwitch("show results");
	}
}

function Sound(whichPartOfBuffer) { 
	this.part = whichPartOfBuffer;
	this.source = null;   
	this.isplaying = false;
	this.frequency = null;
	this.selectedAudio = 0;
	
    this.togglePlayback = function(buffers, mode=3, shouldLoop=false) {
        // mode 1 = stop, mode 2 = start, mode 3 = toggle
        var e = jQuery("#likert_audio_control")[0];
		
        //if(mode == 0) { e.currentTime=0; }
        if(mode==2) {
            this.play(buffers, shouldLoop);
            jQuery("#play_sound_button")[0].innerHTML = "Stop sound";
        } else if (mode==1) {
            this.stop(shouldLoop);
            jQuery("#play_sound_button")[0].innerHTML = "Start sound";
        } else if (mode==3) {
			if(this.isplaying) {
				this.stop(shouldLoop);
				jQuery("#play_sound_button")[0].innerHTML = "Start sound";
			} else {
				this.play(buffers, shouldLoop);
				jQuery("#play_sound_button")[0].innerHTML = "Stop sound";
			}
		}
    }
	
	this.play = function(buffers, shouldLoop=true) {
		if(this.source) {this.source.stop();}
		this.source = audioCtx.createBufferSource();
		console.log(this.selectedAudio + this.part*buffers.length*0.5);
		this.source.buffer = buffers[this.selectedAudio + this.part*buffers.length*0.5];
		console.log(buffers);
		this.source.loop = shouldLoop; 
		if(this.frequency != null) {
			this.source.loopEnd = 1 / this.frequency;
		}
		this.source.connect(gainNode).connect(audioCtx.destination);
		this.source.start();
		this.isplaying = true;
	}
	
	this.stop = function() {
		this.source.stop();
		this.isplaying = false;
	}
}

function drawTable() {
    
    likertList = ["Not good", "Poor", "Neutral", "Decent", "Good"];
    //document.getElementById("how to change text in html").innerHTML = "nieuwe text";

    data = "All data: ["
    for (var i = 0; i < results.length; i++) {
        // data += "("+i+") ";
        data += ("["+results[i][1]).substring(0,4)+", ";
        data += "\""+likertList[results[i][0]] + "\", ";
		data += ""+results[i][2]+"], ";
    }
    data += "]"
    
    console.log(data);
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
	
	
    drawGraph(dataForGraph);
}

function drawGraph(dat) {
    //var Chart = require('chart.js'); 
	Chart.defaults.global.elements.line.fill = false;
    var c = new Chart(document.getElementById("myChart"), {
        type: 'line',
        data: {
            labels: [0,1,2,3,4],
            datasets: [{
                label: 'Distinguishability',
                data: dat,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            },
			title: {
				display: true,
				text: 'Distinguishability of individual notes with different playback frequencies'
			}
        }
    });
	console.log(c);
}
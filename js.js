// $(document).ready(function(){
   // document.body.onkeydown = stateSwitch;
// });

var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) {
    console.log(e.keyCode);
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
        if(jQuery("#likert")[0].className == "visible") {
            newTestFile();
        }
    }
}

numResults = 0;
activeButtonNum = -1;
frequency = 0;
results = [];

function stateSwitch(e) {
	var divs = document.getElementsByTagName('div');
	console.log(divs);
	
	if(document.getElementById("startscreen").className == "visible") {
		document.getElementById("startscreen").className = "invisible";
		document.getElementById("likert").className = "visible";
        newTestFile();
        sound.genNewAudio();
		return;
	}
	if(document.getElementById("likert").className == "visible" && (keys[32] || e=="show results") && results.length != 0 ) {
		document.getElementById("likert").className = "invisible";
        drawTable();
        sound.togglePlayback(1);
		document.getElementById("results").className = "visible";
		return;
	}
}

function likertButtonClicked(e, buttonnum) {    
	toggleButton(e, buttonnum);
}

function toggleButton(b, buttonnum) {
	if ( b.className.match("buttonOn")) {
		resetAllButtons();
		b.className = "buttonOff";
	} else {
        activeButtonNum = buttonnum;
		resetAllButtons();
		b.className = "buttonOn";
	}
}

function newTestFile(override = false) {
	var buttons = document.getElementsByTagName('button');
	var isAButtonToggled = false;
    var activeButton = -1;
	for(var i = 0; i < buttons.length; i++) {
		if(buttons[i].id.includes("likert")) {
			if(buttons[i].className == "buttonOn") {
				isAButtonToggled = true;
			}
		}
	}
	if(isAButtonToggled || override) {
        results.push([activeButtonNum, frequency]);
        numResults++;
		resetAllButtons();
        sound.genNewAudio();
	}
}

function resetAllButtons() {
	var buttons = document.getElementsByTagName('button');
	for(var i = 0; i < buttons.length; i++) {
        b = buttons[i].className;
        if(b == "buttonOn") {
            buttons[i].className = "buttonOff";
        }
	}
}

function Sound() {
    sounds = [["Aestethics_3.mp3", "audio/mpeg"]]
    
    this.genNewAudio = function() {
        frequency = 30+30*Math.random(30, 60);
        
        var e = jQuery("#likert_audio")[0];
        var rand = sounds[Math.floor(Math.random() * sounds.length)];
        e.src = rand[0];
        e.type = rand[1];
        e.load();
        
        this.playSound();
    }
    
    this.playSound = function() {
        this.togglePlayback(0);
    }

    this.togglePlayback = function(mode=2) {
        // mode 0 = restart, mode 1 = stop, mode 2 = toggle
        var e = jQuery("#likert_audio")[0];
        if(mode == 0) { e.currentTime=0; }
        if((e.paused && mode==2) || mode==0) {
            e.play();
            jQuery("#play_sound_button")[0].innerHTML = "Stop sound";
        } else if ((!e.paused && mode==2) || mode==1) {
            e.currentTime = 0;
            e.pause();
            jQuery("#play_sound_button")[0].innerHTML = "Start sound";
        }
    }
}
var sound = new Sound();

function drawTable() {
    
    likertList = ["Not good", "Poor", "Neutral", "Decent", "Good"];
    //document.getElementById("how to change text in html").innerHTML = "nieuwe text";

    data = "All data: ["
    for (var i = 0; i < results.length; i++) {
        // data += "("+i+") ";
        data += ("["+results[i][1]).substring(0,4)+", ";
        data += "\""+likertList[results[i][0]] + "\"], ";
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
    drawGraph(dataForGraph);
    
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
}

function drawGraph(dat) {
    //var Chart = require('chart.js'); 
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: likertList,
            datasets: [{
                label: '# of Votes',
                data: dat,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
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
            }
        }
    });
}
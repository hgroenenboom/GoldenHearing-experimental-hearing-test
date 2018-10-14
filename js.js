// $(document).ready(function(){
   // document.body.onkeydown = stateSwitch;
// });

var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { 
    keys[e.keyCode] = true;
    if(e.keyCode == 32) {
        stateSwitch(e);
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
		return;
	}
	if(document.getElementById("likert").className == "visible" && (keys[32] || e=="show results") && results.length != 0 ) {
		document.getElementById("likert").className = "invisible";
        sendResults();
		document.getElementById("results").className = "visible";
		return;
	}
}

function likertButtonClicked(e, buttonnum) {
	console.log("click die maaaaan");
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

function newTestFile() {
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
	if(isAButtonToggled) {
        results.push([activeButtonNum, frequency]);
        numResults++;
		resetAllButtons();
		console.log("neeeext");
        frequency = 30+30*Math.random(30, 60);
        document.getElementById("likert_audio").currentTime = 0;
        document.getElementById("likert_audio").pause();
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

function playSound() {
    document.getElementById("likert_audio").play();
}

function sendResults() {
    likertList = ["Not good", "Poor", "Neutral", "Decent", "Good"];
    //document.getElementById("how to change text in html").innerHTML = "nieuwe text";

    var body = document.getElementById("results_table");
    var tbl = document.createElement("table");
    var tblBody = document.createElement("tbody");

    for (var i = 0; i < results.length; i++) {
        var row = document.createElement("tr");

        var cell = document.createElement("td");
        var cellText = document.createTextNode((""+results[i][1]).substring(0,4)+"Hz");
        cell.appendChild(cellText);
        row.appendChild(cell);
        
        var cell = document.createElement("td");
        var cellText = document.createTextNode(likertList[results[i][0]]);
        cell.appendChild(cellText);
        row.appendChild(cell);
        
        tblBody.appendChild(row);
    }

    tbl.appendChild(tblBody);
    body.appendChild(tbl);
    tbl.setAttribute("border", "2");
}
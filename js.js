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
results = [];

function stateSwitch(e) {
	var divs = document.getElementsByTagName('div');
	console.log(divs);
	
	if(document.getElementById("startscreen").className == "visible") {
		document.getElementById("startscreen").className = "invisible";
		document.getElementById("likert").className = "visible";
		return;
	}
	if(document.getElementById("likert").className == "visible" && (keys[32] || e=="show results")) {
		document.getElementById("likert").className = "invisible";
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
        results.push(activeButtonNum);
        numResults++;
		resetAllButtons();
		console.log("neeeext");
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
    
}
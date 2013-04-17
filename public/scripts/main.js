var circleRows = 6;
var circleWidth = 54;
var circlesCount = 0;
var circles = [];
var circlesInterval = null;

function initPage(){
	initCircles();
}

function initCircles(){
	circlesCount = calculateOptimalCirclesCount();
	if(circlesInterval){
		window.clearInterval(circlesInterval);
		circlesInterval = null;
		if(circles.length){
			for(var i = 0, len = circles.length; i < len; i++){
				document.getElementById('background').removeChild(circles[i]);
			}
		}
		circles = [];
	}
	for(var i = 0; i < circlesCount; i++){
		var circle = document.createElement('div');
		circle.className = 'circle';
		circle.style.backgroundColor = generateRandomColor();
		document.getElementById('background').appendChild(circle);
		circles.push(circle);
	}

	circlesInterval = window.setInterval(function(){
		var rndIndex = Math.floor(Math.random() * circlesCount);
		circles[rndIndex].style.backgroundColor = generateRandomColor();
	}, 100);

	document.getElementsByTagName('section')[0].style.marginLeft = 0;
}

function onScroll(e){
	if(document.body.scrollTop > 15){
		document.getElementsByTagName('nav')[0].style.boxShadow = '-5px 2px 2px rgba(0,0,0,.4)';
	} else {
		document.getElementsByTagName('nav')[0].style.boxShadow = '';
	}
}

function generateRandomColor(){
	return '#' + ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
}

function calculateOptimalCirclesCount(){
	var perRow = Math.floor(document.width / circleWidth);
	return perRow * circleRows;
}

window.onload = initPage;
window.onresize = initCircles;
window.onscroll = onScroll;
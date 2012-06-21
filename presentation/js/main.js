////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INITIALIZE VARIABLES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
this is the parallax array where all the items live
all of the items are positioned relative to the center middle of the screen which is considered (0, 0)
each item is broken up by page
*/
var parArr = [
	{id:"#bg", x:0, y:-250, layer:.1, pages:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]},
	{id:"#intro-line", x:-140, y:-90, layer:1, pages:[0]},
	{id:"#icon1", x:1750, y:-150, layer:.9, pages:[1, 2]},
	{id:"#icon2", x:1890, y:-220, layer:.7, pages:[1, 2]},
	{id:"#icon3", x:2130, y:-190, layer:.85, pages:[1, 2]},
	{id:"#icon4", x:1850, y:10, layer:1.1, pages:[1, 2]},
	{id:"#icon5", x:2050, y:60, layer:1, pages:[1, 2]},
	{id:"#line1", x:2250, y:-85, layer:3.5, pages:[2]},
	{id:"#line2", x:3385, y:-100, layer:3.5, pages:[3]},
	{id:"#arrowtop", x:3450, y:-150, layer:2, pages:[3]},
	{id:"#arrowbottom", x:3450, y:90, layer:2, pages:[3]},
	{id:"#line3", x:4900, y:-120, layer:3.5, pages:[4]},
	{id:"#red-icon1", x:5020, y:-180, layer:.9, pages:[4, 5]},
	{id:"#red-icon2", x:5300, y:-140, layer:.95, pages:[4, 5]},
	{id:"#red-icon3", x:5100, y:0, layer:.85, pages:[4, 5]},
	{id:"#red-icon4", x:5250, y:-40, layer:0.9, pages:[4, 5]},
	{id:"#red-icon5", x:5030, y:100, layer:1, pages:[4, 5]},
	{id:"#dottedline", x:5500, y:-250, layer:2, pages:[5]},
	{id:"#video-sm", x:5550, y:-120, layer:1.5, pages:[5, 6]},
	{id:"#video-big", x:5446, y:-300, layer:1.5, pages:[7]},
	{id:"#popcorn-logo", x:6250, y:-140, layer:1, pages:[8]},
	{id:"#mini-popcorn-logo", x:7270, y:-130, layer:1, pages:[9, 10]},
	{id:"#red-icon1-2", x:7020, y:50, layer:0.9, pages:[9, 10]},
	{id:"#red-icon2-2", x:7140, y:-250, layer:0.7, pages:[9, 10]},
	{id:"#red-icon3-2", x:7040, y:-290, layer:0.85, pages:[9, 10]},
	{id:"#red-icon4-2", x:6970, y:-140, layer:0.8, pages:[9, 10]},
	{id:"#red-icon5-2", x:7150, y:135, layer:0.75, pages:[9, 10]},
	{id:"#video-med", x:7500, y:-140, layer:0.6, pages:[9, 10, 11, 12]},
	{id:"#flow-lines", x:7235, y:-220, layer:1.3, pages:[10]},
	{id:"#red-icons-assembled", x:7580, y:-210, layer:0.8, pages:[11, 12]},
	{id:"#green-icons-assembled", x:8050, y:-220, layer:0.9, pages:[12]},
	{id:"#line4", x:8220, y:-165, layer:3.5, pages:[12]},
	{id:"#popcorn-template", x:9520, y:-260, layer:1, pages:[13]}		
];

var pagePosArr = [0, 2000, 2300, 3500, 5000, 5500, 5690, 5690, 6500, 7500, 7500, 7850, 8200, 10000]; // this is the page position array
var winWidth = 0; // adjust based on window width
var winHeight = 0; // adjust based on window height
var cameraX = 0; // the value that sets the position of the items with relation to where a camera would be
var pageNum = 0; // current slide you are on
var oldpageNum = 0; // last slide you were on


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// gets calle don page load
function init(){
	$("body").css({display:"block"}); // show body (initially set blank in css)
	
	for (var i=0; i<parArr.length; i++){
		// set parallax offset
		parArr[i].x *= parArr[i].layer;
		
		// duplicate values in parArr so that there are multiple copies of the values that will change
		parArr[i].origX = parArr[i].posX = parArr[i].x;
		parArr[i].origY = parArr[i].posY = parArr[i].y;
		
		// set z index according to parallax depth
		$(parArr[i].id).css({"z-index":Math.round(parArr[i].layer*100)});
	}
	
	resize(); resize(); //initial resize call (called twice for correction)
	$(window).resize(resize); //resize handler
	
	addNavHandlers(); // add keyboard input handler
	
	showPage(0); // show the first page
}

// this gets called on window resize, use it to resize any items if the screen has a different resolution
function resize(){
	winWidth = $(window).width();
	winHeight = $(window).height();
	
	$("#bg-gradient").css({width : winWidth-6, height : winHeight-6}); // adjust background
	$("#logo").css({left : winWidth-200}); // adjust logo
	// adjust nav
	$("#btn-left").css({left : winWidth-110, top : winHeight-60});
	$("#btn-right").css({left : winWidth-20, top : winHeight-20});
	
	// run through all the parallax items and adjust them
	for (var i=0; i<parArr.length; i++){
		// adjust the item values
		parArr[i].posX = (winWidth/2) + parArr[i].origX;
		parArr[i].posY = (winHeight/2) + parArr[i].origY;
		$(parArr[i].id).css({top:parArr[i].posY, left:parArr[i].posX - (cameraX * parArr[i].layer)});
	}
}

// this gets called every frame
function loop(){
	// loop through all elements
	for (var i=0; i<parArr.length; i++){
		// adjust the item values
		parArr[i].x = parArr[i].posX - (cameraX * parArr[i].layer);
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// this is deprecated because checking is being done by the pages array on each item 
		// ** put back in if you want items to only disappear when they reach the page extremities
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// if it is inside the visibility area then show it if it is hidden
		/*
		if (parArr[i].x > 0 - $(parArr[i].id).width() && parArr[i].x < winWidth){
			if ($(parArr[i].id).is(":hidden")){
				$(parArr[i].id).show();
			}
		// if it is outside the visible zone then hide it
		}else{
			if ($(parArr[i].id).is(":visible")){
				$(parArr[i].id).hide();
			}
		}
		*/
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		// if the item is visible then adjust the x position according to the camera
		if ($(parArr[i].id).is(":visible")){
			$(parArr[i].id).css({left:parArr[i].x});
		}
	}
}

function addNavHandlers(){
	// keyboard nav handler
	$(document.documentElement).keyup(function(event){
		if (event.keyCode == 37) { // key left
			pageNavigator(-1);
		} else if (event.keyCode == 39) { // key right
			pageNavigator(1);
		}
	});
	
	// button nav handler
	$(".nav-btn").hover(function(){
		$(this).children(".up").hide();
		$(this).children(".over").show();
	}, function(){
		$(this).children(".up").show();
		$(this).children(".over").hide();
	});
	$("#btn-left").click(function(){
		pageNavigator(-1);
	});
	$("#btn-right").click(function(){
		pageNavigator(1);
	});
}

function pageNavigator(val){
	oldpageNum = pageNum; // set the current page num for later use
	pageNum += val;
	
	// handle cursor keys
	if (pageNum<0){
		pageNum = 0;
	}else if (pageNum>=pagePosArr.length){
		pageNum = pagePosArr.length-1;
	}
	
	// check if the page num has changed at all, if not them don't call thie function
	if (oldpageNum!=pageNum){
		showPage(pageNum);
	}
}

// show pages
function showPage(_num){
	console.log("PAGE: "+_num);
	
	pageNum = _num; // set pageNum variable
	
	TweenLite.ticker.removeEventListener("tick", loop); // kill listener in case it already exists
	TweenLite.killTweensOf(this); // kill all the tweens in case there is something left over
	
	TweenLite.ticker.addEventListener("tick", loop); // loop handler
	TweenLite.to(this, 1, {cameraX:pagePosArr[_num], ease:Expo.easeOut, onComplete:function(){
		TweenLite.ticker.removeEventListener("tick", loop); // remove loop
		
		// hide items if they are on on this page
		for (var i=0; i<parArr.length; i++){
			if ($.inArray(pageNum, parArr[i].pages) == -1){
				if ($(parArr[i].id).is(":visible")){
					$(parArr[i].id).hide();
				}
			}
		}
	}});
	
	// show items if they are on this page but are hidden
	for (var i=0; i<parArr.length; i++){
		if ($.inArray(pageNum, parArr[i].pages) != -1){
			if ($(parArr[i].id).is(":hidden")){
				$(parArr[i].id).show();
			}
		}else{
			if ($(parArr[i].id).is(":visible")){
				$(parArr[i].id).fadeOut();
			}
		}
	}
	
	// run any page specific after the transition to the next page has completed
	pageActions();
}

// implement any page specific actions into this function
function pageActions(){
	
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// START
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// on document ready
$(document).ready(function(){
	init();
})

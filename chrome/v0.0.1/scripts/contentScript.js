var connectionObjectKey = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';

function Webmark(){
	this.id = generateUID();
	this.scrollTop = document.body.scrollTop;
	this.webmarkAnchorTopPosition = document.documentElement.scrollTop || document.body.scrollTop;
	this.initComponents();
}

Webmark.prototype.calculateViewTopPosition = function(){
	var webmarkViewTopPosition = 
		(window.innerHeight / document.body.scrollHeight) * this.scrollTop;

	this.divActionLink.style.top = webmarkViewTopPosition + 'px';
}

Webmark.prototype.initComponents = function(){
	var self = this;
	
	//create the anchor
	this.divHiddenAnchor = document.createElement('div');
	this.divHiddenAnchor.id = this.id;
	this.divHiddenAnchor.className = '-webmark-hidden-anchor';
	this.divHiddenAnchor.style.top = this.webmarkAnchorTopPosition + 'px';
	document.getElementsByTagName('body')[0].appendChild(this.divHiddenAnchor);

	//create the link
	this.divActionLink = document.createElement('div');
	this.divActionLink.id = this.id;
	this.divActionLink.className = '-webmark-action-link';
	this.calculateViewTopPosition();
	this.divActionLink.style.backgroundColor = generateRandomColor();
	
	this.bindEvents();
	
	document.getElementsByTagName('body')[0].appendChild(this.divActionLink);
	
	window.setTimeout(function(){
		self.divActionLink.style.right = '7px';
	}, 100);
};

Webmark.prototype.bindEvents = function(){
	var self = this;
	
	this.divActionLink.addEventListener('click', function(){
		document.getElementById(self.id).scrollIntoView();
	}, false);
	
	this.divActionLink.addEventListener('mouseover', function(e){
		_lastWebmarkIdContextMenuClick = e.srcElement.id;
		sendMessage({ type: 'menuState', id: 'webmark_remove', payload: { enabled: true }});
		_keyHandler.shortcuts.undo.enabled = true;
	}, false);
	
	this.divActionLink.addEventListener('mouseout', function(e){
		sendMessage({ type: 'menuState', id: 'webmark_remove', payload: { enabled: false }});
		_keyHandler.shortcuts.undo.enabled = false;
	}, false);
}

Webmark.prototype.dispose = function(){
	var self = this;
	this.divHiddenAnchor.remove();
	
	this.divActionLink.style.right = '-40px';
	window.setTimeout(function(){
		self.divActionLink.remove();
	}, 100);
};

var _webmarks = {};
var _webmarksIds = [];
var _lastWebmarkIdContextMenuClick = null;
var _lastHtmlElementContextMenuClick = null;
var _keyHandler = {
	shortcuts: {
		add: {
			which: 65, //a
			special: 'shiftKey',
			handler: handleAddWebmarkShortcut,
			enabled: true
		},
		undo: {
			which: 90, //z
			special: 'shiftKey',
			handler: handleUndoWebmarkShortcut,
			enabled: false
		}
	}
};

document.body.addEventListener('keyup', function(e){
	switch(e.which){
		case _keyHandler.shortcuts.add.which:
			if(e[_keyHandler.shortcuts.add.special]){
				_keyHandler.shortcuts.add.handler();
			}
			break;
		case _keyHandler.shortcuts.undo.which:
			if(e[_keyHandler.shortcuts.undo.special]){
				_keyHandler.shortcuts.undo.handler();	
			}
			break;
	}
}, false);

window.addEventListener('resize', function(e){
	for(var id in _webmarks){
		_webmarks[id].calculateViewTopPosition();
	}
}, false);

chrome.extension.onMessage.addListener(function(message, sender, response){
	switch(message.type){
		case 'requestWebmarkCreate':
			addWebmarkItem(response);
			break;
		case 'requestWebmarkRemove':
			removeWebmarkItem(_lastWebmarkIdContextMenuClick, response);
			_lastWebmarkIdContextMenuClick = null;
	}
});

function addWebmarkItem(response){
	if(window.innerHeight == document.body.scrollHeight) return;
	var webmark = new Webmark();
	_webmarks[webmark.id] = webmark;
	_webmarksIds.push(webmark.id);

	var data = { type: 'requestWebmarkCreate' };
	response ? response(data) : sendMessage(data);
}

function removeWebmarkItem(webmarkId, response){
	var webmark = _webmarks[webmarkId];
	if(webmark){
		webmark.dispose();		
		
		delete _webmarks[webmarkId];
		
		var webmarkIdIndex = _webmarksIds.indexOf(webmarkId);
		if(webmarkIdIndex > -1){
			_webmarksIds.splice(webmarkIdIndex, 1);
		}

		var data = { type: 'requestWebmarkRemove' };
		response ? response(data) : sendMessage(data);
	}
}

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4)
}

function handleAddWebmarkShortcut(){
	if(_keyHandler.shortcuts.add.enabled){
		addWebmarkItem();
	}
}

function handleUndoWebmarkShortcut(){
	if(_keyHandler.shortcuts.undo.enabled || _webmarksIds.length){
		var lastWebmarkId = _webmarksIds.pop();
		removeWebmarkItem(lastWebmarkId);
	}
}

function generateRandomColor(){
	return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function sendMessage(data){
	chrome[connectionObjectKey].sendMessage(data);
}
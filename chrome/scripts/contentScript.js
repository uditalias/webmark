var _connectionObjectKey = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';
var _webmarks = {};
var _webmarksIds = [];
var	_lastSelectedWebmarkId = null;
var _lastWebmarkIdContextMenuClick = null;
var _currentScrollHeight = document.body.scrollHeight;
var _validateScrollHeightInterval = 1000;
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
		},
		deleteSelected: {
			which: 88, //x
			special: 'shiftKey',
			handler: handleDeleteSelectedWebmarkShortcut,
			enabled: false
		}		
	}
};

function Webmark(params){
	this.params = params;
	this.id = this.params.id || generateUID();
	this.scrollTop = this.params.scrollTop || document.body.scrollTop;
	this.webmarkAnchorTopPosition = this.params.webmarkAnchorTopPosition || 
									document.documentElement.scrollTop || 
									document.body.scrollTop;
	this.color = this.params.color || generateRandomColor();
	this.initComponents();
	this.bindEvents();
}

Webmark.prototype.calculateViewTopPosition = function(){
	var webmarkViewTopPosition = 
		(window.innerHeight / document.body.scrollHeight) * this.scrollTop;

	this.divActionLink.style.top = webmarkViewTopPosition + 'px';
}

Webmark.prototype.initComponents = function(){
	var self = this;
	
	this.createAnchor();

	this.createLink();

	this.createArrows();
		
	window.setTimeout(function(){
		self.divActionLink.style.right = '7px';
	}, 100);
};

Webmark.prototype.createAnchor = function(){
	this.divHiddenAnchor = document.createElement('div');
	this.divHiddenAnchor.id = this.id;
	this.divHiddenAnchor.className = '-webmark-hidden-anchor';
	this.divHiddenAnchor.style.top = this.webmarkAnchorTopPosition + 'px';
	document.getElementsByTagName('body')[0].appendChild(this.divHiddenAnchor);
}

Webmark.prototype.createLink = function(){
	this.divActionLink = document.createElement('div');
	this.divActionLink.id = this.id;
	this.divActionLink.className = '-webmark-action-link';
	this.calculateViewTopPosition();
	this.divActionLink.style.backgroundColor = this.color;
	document.getElementsByTagName('body')[0].appendChild(this.divActionLink);
}

Webmark.prototype.createArrows = function(){
	this.arrowsWrapper = document.createElement('div');
	this.arrowsWrapper.className = '-webmark-arrows-wrapper';

	this.arrowUp = document.createElement('div');
	this.arrowUp.id = this.id;
	this.arrowUp.className = '-webmark-arrow-up';
	this.arrowUp.style.borderBottomColor = this.color;

	this.arrowDown = document.createElement('div');
	this.arrowDown.id = this.id;
	this.arrowDown.className = '-webmark-arrow-down';
	this.arrowDown.style.borderTopColor = this.color;

	this.arrowsWrapper.appendChild(this.arrowUp);
	this.arrowsWrapper.appendChild(this.arrowDown);

	this.divActionLink.appendChild(this.arrowsWrapper);
}

Webmark.prototype.bindEvents = function(){
	var self = this;
	
	this.divActionLink.addEventListener('click', function(){
		var id = self.id;
		
		_keyHandler.shortcuts.deleteSelected.enabled = true;
		_lastSelectedWebmarkId = id;
		document.getElementById(id).scrollIntoView();

		self.arrowUp.style.top = '';
		self.arrowDown.style.top = '';
	}, false);
	
	this.divActionLink.addEventListener('mouseover', function(e){
		_lastWebmarkIdContextMenuClick = e.srcElement.id;
		sendMessage({ type: 'menuState', id: 'webmark_remove', payload: { enabled: true }});
		_keyHandler.shortcuts.undo.enabled = true;

		if(self.scrollTop < document.body.scrollTop){
			self.arrowUp.style.top = '-17px';
		} else if(self.scrollTop > document.body.scrollTop){
			self.arrowDown.style.top = '9px';
		}
	}, false);
	
	this.divActionLink.addEventListener('mouseout', function(e){
		sendMessage({ type: 'menuState', id: 'webmark_remove', payload: { enabled: false }});
		_keyHandler.shortcuts.undo.enabled = false;

		self.arrowUp.style.top = '';
		self.arrowDown.style.top = '';
	}, false);
}

Webmark.prototype.serialize = function(){
	var serialized = {};
	serialized.id = this.id;
	serialized.scrollTop = this.scrollTop;
	serialized.color = this.color;
	serialized.webmarkAnchorTopPosition = this.webmarkAnchorTopPosition;

	return serialized;
}

Webmark.prototype.dispose = function(){
	var self = this;
	this.divHiddenAnchor.remove();
	
	this.divActionLink.style.right = '-40px';
	window.setTimeout(function(){
		self.divActionLink.remove();
	}, 100);
};



document.body.addEventListener('keyup', function(e){
	var shortcuts = _keyHandler.shortcuts;
	for(h in shortcuts){
		var shortcut = shortcuts[h];
		if (e.which == shortcut.which &&
			e[shortcut.special] &&
			shortcut.enabled){
				shortcut.handler();
			}
		}
}, false);

window.addEventListener('resize', function(e){
	recalcWebmarksPosition();
}, false);

chrome[_connectionObjectKey].onMessage.addListener(function(message, sender, response){
	switch(message.type){
		case 'requestWebmarkCreate':
			addWebmarkItem(sendMessage);
			break;
		case 'requestWebmarkRemove':
			removeWebmarkItem(_lastWebmarkIdContextMenuClick, sendMessage);
			_lastWebmarkIdContextMenuClick = null;
			break;
		case 'requestStoreWebmarks':
			initializeStoreWebmarks(message);
			break;
	}
});

function addWebmarkItem(response, fromStore, params){
	if(window.innerHeight == document.body.scrollHeight) return;

	var webmark = new Webmark(params || {});
	_webmarks[webmark.id] = webmark;
	_webmarksIds.push(webmark.id);

	if(!fromStore){
		var data = { type: 'requestWebmarkCreate', url: window.location.href, webmark: webmark.serialize() };
		response(data);
	}
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

		var data = { type: 'requestWebmarkRemove', url: window.location.href, id: webmarkId };
		response(data);
	}
}

function generateUID() {
    return ("0000" + (Math.random() * Math.pow(36,4) << 0).toString(36)).substr(-4)
}

function handleAddWebmarkShortcut(){
	if(_keyHandler.shortcuts.add.enabled){
		addWebmarkItem(sendMessage);
	}
}

function handleUndoWebmarkShortcut(){
	if(_keyHandler.shortcuts.undo.enabled || _webmarksIds.length){
		var lastWebmarkId = _webmarksIds.pop();
		removeWebmarkItem(lastWebmarkId, sendMessage);
	}
}

function handleDeleteSelectedWebmarkShortcut(){
	if(_keyHandler.shortcuts.deleteSelected.enabled || _webmarksIds.length){
		removeWebmarkItem(_lastSelectedWebmarkId, sendMessage);
	}
}

function generateRandomColor(){
	return '#' + ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
}

function recalcWebmarksPosition(){
	for(var id in _webmarks){
		_webmarks[id].calculateViewTopPosition();
	}
}

function sendMessage(data, callback){
	chrome[_connectionObjectKey].sendMessage('', data, callback || function(){});
}

function initializeStoreWebmarks(data){
	if(data.store){
		for(var webmarkId in data.store){
			addWebmarkItem(null, true, data.store[webmarkId]);
		}
	}
}

window.setInterval(function(){
	if(_currentScrollHeight != document.body.scrollHeight){
		_currentScrollHeight = document.body.scrollHeight;
		recalcWebmarksPosition();
	}
}, _validateScrollHeightInterval);

sendMessage({ type: 'requestStoreWebmarks', url: window.location.href});
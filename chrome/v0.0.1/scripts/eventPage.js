var connectionObjectKey = chrome.runtime && chrome.runtime.sendMessage ? 'runtime' : 'extension';

var _contextMenuEvents = {
	onAddWebmarkContextMenuCreated: function(){
		//do nothing...
	},
	onRemoveWebmarkContextMenuCreated: function(){
		//do nothing...
	},
	onWebmarkContextMenuItemClicked: function(info, tab){
		switch(info.menuItemId){
			case 'webmark_create':
				sendRequestAddWebmark(tab);
				break;
			case 'webmark_remove':
				sendRequestRemoveWebmark(tab);
				break;
		}
	}		
}

chrome.contextMenus.create({
	type: "normal",
	id: "webmark_create",
	title: "Add Webmark",
	contexts: [ "all" ]
}, _contextMenuEvents.onAddWebmarkContextMenuCreated);

chrome.contextMenus.create({
	type: "normal",
	id: "webmark_remove",
	title: "Remove Webmark",
	enabled: false,
	contexts: [ "all" ]
}, _contextMenuEvents.onRemoveWebmarkContextMenuCreated);

chrome.contextMenus.onClicked.addListener(_contextMenuEvents.onWebmarkContextMenuItemClicked);

chrome[connectionObjectKey].onMessage.addListener(function(message, sender, sendResponse) {
	switch(message.type){
		case 'menuState':
			updateContextMenuButton(message.id, message.payload);
			break;
		case 'requestWebmarkCreate':
			webmarkCreated(message);
			break;
		case 'requestWebmarkRemove':
			webmarkRemoved(message);
			break;
	}
});

function updateContextMenuButton(id, data){
	chrome.contextMenus.update(id, data);
}

function sendRequestAddWebmark(tab){
	chrome.tabs.sendMessage(tab.id, { type: 'requestWebmarkCreate' }, function(response) {
		if(response.type == 'requestWebmarkCreate'){
			webmarkCreated(response);
		}
	});
}

function sendRequestRemoveWebmark(tab){
	chrome.tabs.sendMessage(tab.id, { type: 'requestWebmarkRemove' }, function(response) {
		if(response.type == 'requestWebmarkRemove'){
			webmarkRemoved(response);
		}
	});
}

function webmarkCreated(data){
	//webmark added to page, update the local storage...
}

function webmarkRemoved(data){
	//webmark removed from page, update the local storage...
}
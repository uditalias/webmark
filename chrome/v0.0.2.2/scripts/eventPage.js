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
		case 'requestStoreWebmarks':
			getUrlWebmarksStore(message.url, sender);
			break;
	}
});

function sendMessage(tab, data, callback){
	chrome.tabs.sendMessage(tab.id, data, callback || function(){});
}

function updateContextMenuButton(id, data){
	chrome.contextMenus.update(id, data);
}

function sendRequestAddWebmark(tab){
	sendMessage(tab, { type: 'requestWebmarkCreate' });
}

function sendRequestRemoveWebmark(tab){
	sendMessage(tab, { type: 'requestWebmarkRemove' });
}

function webmarkCreated(data){
	var url = clearUrlForStorageKey(data.url);
	if(url){
		var urlStore = null;
		chrome.storage.sync.get(url, function(obj){
			if(obj[url]){
				urlStore = obj;
			} else {
				urlStore = {};
				urlStore[url] = {};
			}
			
			urlStore[url][data.webmark.id] = data.webmark;
			chrome.storage.sync.set(urlStore);
		});
	}
}

function webmarkRemoved(data){
	var url = clearUrlForStorageKey(data.url);
	if(url){
		var urlStore = null;
		chrome.storage.sync.get(url, function(obj){
			if(obj[url]){
				urlStore = obj;
				delete urlStore[url][data.id];
				
				chrome.storage.sync.set(urlStore);
			}
		});
	}
}

function getUrlWebmarksStore(url, sender){
	url = clearUrlForStorageKey(url);
	if(url){
		var urlStore = null;
		chrome.storage.sync.get(url, function(obj){
			sendMessage(sender.tab, { type: 'requestStoreWebmarks', store: obj[url] || null });
		});
	}
}

function clearUrlForStorageKey(url){
	return url.replace('http://','').replace('https://','').replaceAll('/','').split('#')[0];
}

/* overrides */
/**
 * ReplaceAll by Fagner Brack (MIT Licensed)
 * Replaces all occurrences of a substring in a string
 */
String.prototype.replaceAll = function(token, newToken, ignoreCase){
    var _token;
    var str = this + "";
    var i = -1;

    if ( typeof token === "string" ) {

        if ( ignoreCase ) {

            _token = token.toLowerCase();

            while( (
                i = str.toLowerCase().indexOf(
                    token, i >= 0 ? i + newToken.length : 0
                ) ) !== -1
            ) {
                str = str.substring( 0, i ) +
                    newToken +
                    str.substring( i + token.length );
            }

        } else {
            return this.split( token ).join( newToken );
        }

    }
	return str;
}
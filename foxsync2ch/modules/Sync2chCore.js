EXPORTED_SYMBOLS = ['Sync2chCore'];

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import("resource://foxage2ch/utils.jsm");

const { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

const document = Cc["@mozilla.org/xul/xul-document;1"].createInstance(Ci.nsIDOMDocument);
const prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('extensions.sync2ch.');
const console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
const fuelApp = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);

const API_URI = 'http://sync2ch.com/api/sync3';
const CHAIKA_ID = "chaika@chaika.xrea.jp";
const B2R_ID = "{0B9D558E-6983-486b-9AAD-B6CBCD2FC807}";

function log(){
    var args = Array.slice(arguments);
    args.unshift('[Sync2ch]');

    console.logStringMessage(U(args.join(' ')));
}

function notify(){
    if(!prefs.getBoolPref('notify_through_foxage2ch')) return;

    var args = Array.slice(arguments);
    FoxAge2chUtils.showMessage(U(args.join(' ')));
}

function U(byte){
    var text = byte;

    try{
        text = decodeURIComponent(escape(byte));
    }catch(e){}

    return text;
}


var Sync2chCore = {

    _request: null,

    _data: null,

    init: function(){
        FoxAge2chUtils.observer.addObserver(this, FoxAge2chUtils.TOPIC_GLOBAL, false);
    },

    sync: function(){
        log('Start syncing...');
        notify('Sync2chと同期中...');

        //バックアップを取る
//        if(prefs.getBoolPref('backup_before_sync')){
//            FoxAge2chUtils.service._archiveData();
//        }

        //データを準備する
        var data = this._data = this._createRequestXML();
        var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
        data = serializer.serializeToString(data);
        data = '<?xml version="1.0" encoding="utf-8" ?>' + data.replace('xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" ', '');

        //通信
        this._request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
        this._request.QueryInterface(Ci.nsIDOMEventTarget).QueryInterface(Ci.nsIXMLHttpRequest);
        this._request.addEventListener("load", this, false);
        this._request.addEventListener("error", this, false);

        this._request.open("POST", API_URI, true, prefs.getCharPref('account.id'), prefs.getCharPref('account.password'));
        this._request.setRequestHeader("User-Agent", FoxAge2chUtils.userAgent);
        this._request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        this._request.channel.contentCharset = 'UTF-8';

        this._request.send(data);
    },

    _createRequestXML: function(){
        var client = Sync2chUtils.getClientInfo();
        var doc = document.implementation.createDocument(null, '', null);
        var root = document.createElement('sync2ch_request');

        root.setAttribute('sync_number', prefs.getIntPref('sync_number'));
        root.setAttribute('client_id', prefs.getIntPref('client_id'));
        root.setAttribute('client_version', client.version);
        root.setAttribute('client_name', client.name);
        root.setAttribute('os', Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS);

        if(prefs.getBoolPref('sync.favorite'))
            root.appendChild(this._getFavoriteThread());

        if(prefs.getBoolPref('sync.open'))
            root.appendChild(this._getOpeningThread());

        return doc.appendChild(root);
    },

    _getFavoriteThread: function(){
        var addBoardAsFav = prefs.getBoolPref('add_board_as_favorite');
        var setNowAsRead = prefs.getBoolPref('set_nownum_to_readnum');

        //thread_group
        var group = document.createElement('thread_group');
        group.setAttribute('category', 'favorite');
        group.setAttribute('struct', 'FoxAge2ch');

        FoxAge2chUtils.service.getChildItems("root", {}).forEach(function(boardItem){
            //Sync2chでは、boardの中にthreadを入れることはできないので、
            //代わりにdir要素を使うことにする
            var dir = document.createElement('dir');
            dir.setAttribute('name', boardItem.title);

            //個々のスレッドを追加する
            FoxAge2chUtils.service.getChildItems(boardItem.id, {}).forEach(function(threadItem){
                let thread = document.createElement('th');
                thread.setAttribute('url', FoxAge2chUtils.parseToURL(threadItem));
                thread.setAttribute('title', threadItem.title);
                thread.setAttribute('read', threadItem.readRes);
                thread.setAttribute('count', threadItem.lastRes);

                if(setNowAsRead)
                    thread.setAttribute('now', thradItem.readRes);

                dir.appendChild(thread);
            });

            //fragmentに追加
            group.appendChild(dir);

            //板を追加
            if(addBoardAsFav){
                let board = document.createElement('bd');
                board.setAttribute('title', boardItem.title);
                board.setAttribute('url', FoxAge2chUtils.parseToURL(boardItem));

                group.appendChild(board);
            }
        });

        return group;
    },

    _getOpeningThread: function(){
        var group = document.createElement('thread_group');
        group.setAttribute('category', 'open');
        group.setAttribute('struct', 'FoxAge2ch');

        var preserveOriginalURL = prefs.getBoolPref('preserve_original_opening_url');
        var disableSyncBoards = prefs.getBoolPref('disable_syncing_opening_boards');
        var setNowAsRead = prefs.getBoolPref('set_nownum_to_readnum');

        //ウィンドウを列挙
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var enumerator = wm.getEnumerator('navigator:browser');
        while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();

            //タブを列挙
            var num = win.gBrowser.browsers.length;
            for(var i=0; i<num; i++){
                try{
                    var tab = win.gBrowser.getBrowserAtIndex(i);
                    var url = tab.currentURI.spec;
                    var [boardId, threadId] = FoxAge2chUtils.parseFromURL(FoxAge2chUtils.unwrapURL(url));
                }catch(e){
                    //2chでないのでスキップ
                    continue;
                }

                if(threadId){
                    //スレッドの場合
                    var threadItem = FoxAge2chUtils.service.getItem(threadId);
                    var thread = document.createElement('th');

                    if(threadItem){
                        //FoxAge2chに登録済みのスレッドの場合
                        thread.setAttribute('url', preserveOriginalURL ? url : FoxAge2chUtils.parseToURL(threadItem));
                        thread.setAttribute('title', threadItem.title);
                        thread.setAttribute('read', threadItem.readRes);
                        thread.setAttribute('count', threadItem.lastRes);

                        if(setNowAsRead)
                            thread.setAttribute('now', thradItem.readRes);
                    }else{
                        //無登録のスレッドの場合
                        var boardItem = FoxAge2chUtils.createBoardItem(boardId);
                        threadItem = FoxAge2chUtils.createThreadItem(threadId, boardItem);
                        thread.setAttribute('url', preserveOriginalURL ? url : FoxAge2chUtils.parseToURL(threadItem));
                        thread.setAttribute('title', tab.contentTitle);
                        //thread.setAttribute('read', );
                        //thread.setAttribute('count', );
                    }

                    group.appendChild(thread);
                }else if(boardId && !disableSyncBoards){
                    //板の場合
                    var boardItem = FoxAge2chUtils.service.getItem(boardId);
                    var board = document.createElement('bd');

                    if(boardItem){
                        //FoxAge2chに登録済みの場合
                        board.setAttribute('title', boardItem.title);
                        board.setAttribute('url', preserveOriginalURL ? url : FoxAge2chUtils.parseToURL(boardItem));
                    }else{
                        //無登録の板の場合
                        boardItem = FoxAge2chUtils.createBoardItem(boardId);
                        board.setAttribute('url', preserveOriginalURL ? url : FoxAge2chUtils.parseToURL(boardItem));
                        board.setAttribute('title', tab.contentTitle);
                    }

                    group.appendChild(board);
                }
            }
        }

        return group;
    },


    _getEntity: function(aEntities, aID){
        return aEntities.querySelector('[id="' + aID + '"]');
    },


    /* *** handle observers and events *** */

    observe: function(aSubject, aTopic, aData){
        if(aTopic === FoxAge2chUtils.TOPIC_GLOBAL){
            if(aData === 'finish-checking' && prefs.getBoolPref('sync_when_foxage2ch_updated')){
               this.sync();
            }
        }
    },

    handleEvent: function(aEvent){
        switch(aEvent.type){
            case 'load':
                this._request.removeEventListener('load', this, false);
                this._request.removeEventListener('error', this, false);

                switch(this._request.status){
                    case '400':
                        log('Invalid Request:', this._data);
                        notify('同期失敗: 送信データが変です');
                        return;

                    case '401':
                        log('Authorization Error');
                        notify('同期失敗: 認証エラー');
                        return;

                    case '403':
                        log('Limit Exceeded');
                        notify('同期失敗: 回数制限超過');
                        return;

                    case '503':
                        log('Service Unavailable');
                        notify('同期失敗: サーバが落ちています');
                        return;

                    case '200':
                        this._onSuccess();
                        return;

                    default:
                        log('Unknown Error:', this._request.status, this._request.responseText);
                        notify('同期失敗: 不明なエラー');
                        return;
                }

                break;

            case 'error':
                log('Sync Error - HTTP Status:', this._request.status);
                notify('同期失敗: HTTP Status', this._request.status);

                this._request.removeEventListener('load', this, false);
                this._request.removeEventListener('error', this, false);

                break;
        }
    },


    _onSuccess: function(){
        var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
        var root = parser.parseFromString(this._request.responseText, 'application/xml').documentElement;

        //パースエラーの場合
        if(root.nodeName !== 'sync2ch_response'){
            log('Parse Error:', this._request.responseText);
            notify('同期失敗: XMLパースエラー');
            return;
        }

        //result がおかしい場合
        if(root.getAttribute('result') !== 'ok'){
            log('Unexpected Response (result is not "ok"):', this._request.responseText);
            notify('同期失敗: 受信データが変です');
            return;
        }

        //entities が存在しない場合
        if(!root.getElementsByTagName('entities')){
            log('Unexpected Response (No entities tag found):', this._request.responseText);
            notify('同期失敗: 受信データが変です');
            return;
        }


        //同期成功
        //Sync Number, Client IDを保存
        var sync_number = root.getAttribute('sync_number');
        var client_id = root.getAttribute('client_id');

        prefs.setIntPref('sync_number', root.getAttribute('sync_number'));
        prefs.setIntPref('client_id', root.getAttribute('client_id'));

        log('Success Syncing. Sync Number:', sync_number,
            'Client ID:', client_id, 'Response:', this._request.responseText);


        //変更などを反映させる

        //未読などを反映させるかどうか
        var applyLineNumberChange = prefs.getBoolPref('apply_line_number_change');

        //同期に関する情報
        var syncInfo = {
            fav: { removed: 0, added: 0, updated: 0 },
            open: { removed: 0, added: 0, updated: 0 }
        };

        //Entities
        let entities = root.querySelector('entities');


        //お気に入りの変更を反映
        if(prefs.getBoolPref('sync.favorite')){
            let threads = Array.slice(root.querySelectorAll('thread_group[category="favorite"] th'))
                               .map(function(th){ return this._getEntity(th.getAttribute('id')); }, this);

            threads.forEach(function(thread){
                switch(thread.getAttribute('s')){

                    //変更なし
                    case 'n':
                        return;

                    //追加
                    case 'a': {
                        let [boardItem, threadId] = FoxAge2chUtils.parseFromURL(thread.getAttribute('url'));

                        //すでにあるものは追加しない
                        if(!FoxAge2chUtils.service.getItem(threadId)){
                            let item = FoxAge2chUtils.service.addFavorite(thread.getAttribute('url'));

                            if(item){
                                //タイトルを反映させる
                                FoxAge2chUtils.service.changeItemProperty(item, 'title', thread.getAttribute('title'));

                                //未読などを反映させる
                                if(applyLineNumberChange){
                                    FoxAge2chUtils.service.changeItemProperty(item, 'readRes', thread.getAttribute('read'));
                                    FoxAge2chUtils.service.changeItemProperty(item, 'lastRes', thread.getAttribute('count'));
                                }

                                syncInfo.fav.added++;
                            }
                        }

                        break;
                    }

                    //更新
                    case 'u': {
                        let [boardId, threadId] = FoxAge2chUtils.parseFromURL(thread.getAttribute('url'));
                        let item = FoxAge2chUtils.service.getItem(threadId);

                        //URL
                        FoxAge2chUtils.service.changeItemProperty(item, 'title', thread.getAttribute('title'));

                        //未読など
                        if(applyLineNumberChange){
                            FoxAge2chUtils.service.changeItemProperty(item, 'readRes', thread.getAttribute('read'));
                            FoxAge2chUtils.service.changeItemProperty(item, 'lastRes', thread.getAttribute('count'));
                        }

                        syncInfo.fav.updated++;

                        break;
                    }


                    default:
                        return;

                }
            }, this);


            //お気に入りで削除されたものを削除する
            Array.slice(this._data.querySelectorAll('thread_group[category="favorite"] thread')).forEach(function(thread){
                var url = thread.getAttribute('url');

                if(!root.querySelector('thread_group[category="favorite"] thread[url="' + url + '"]')){
                    var [boardItem, threadId] = FoxAge2chUtils.parseFromURL(thread.getAttribute('url'));
                    var threadItem = FoxAge2chUtils.service.getItem(threadId);

                    FoxAge2chUtils.service.removeItem(threadItem);

                    syncInfo.fav.removed++;
                }
            });
        }

        if(prefs.getBoolPref('sync.open')){
            //新しく開かれたスレッド/板を開く
            Array.slice(root.querySelectorAll('thread_group[category="open"] > thread[s="a"],' + 
                                               'thread_group[category="open"] > board[s="a"]')).forEach(function(node){
                var url = node.getAttribute('url');
                var [boardId, threadId] = FoxAge2chUtils.parseFromURL(url);
                var item = FoxAge2chUtils.service.getItem(threadId || boardId);
                if(!item){
                    item = FoxAge2chUtils.createBoardItem(boardId);
                    if(threadId) item = FoxAge2chUtils.createThreadItem(threadId, item);
                }

                FoxAge2chUtils.service.openItem(item, true, true);

                syncInfo.open.added++;
            });

            //閉じられたスレッド/板を閉じる
            //更新されたスレッドを再読み込みする(板は更新されない)

            //ウィンドウを列挙
            var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            var enumerator = wm.getEnumerator('navigator:browser');
            while(enumerator.hasMoreElements()){
                var win = enumerator.getNext();

                //タブを列挙
                var num = win.gBrowser.browsers.length;
                for(var i=0; i<num; i++){
                    try{
                        var tab = win.gBrowser.getBrowserAtIndex(i);
                        var url = tab.currentURI.spec;
                        url = FoxAge2chUtils.unwrapURL(url);
                        var [boardId, threadId] = FoxAge2chUtils.parseFromURL(url);
                    }catch(e){
                        //2chでないのでスキップ
                        continue;
                    }

                    var item = FoxAge2chUtils.service.getItem(threadId || boardId);
                    if(!item){
                        let boardItem = FoxAge2chUtils.createBoardItem(boardId);
                        item = threadId ? FoxAge2chUtils.createThreadItem(threadId, boardItem) :
                                            FoxAge2chUtils.createBoardItem(boardId);
                    }

                    url = FoxAge2chUtils.parseToURL(item);

                    //削除されていた場合
                    if(!root.querySelector('thread_group[category="open"] > thread[url="' + url + '"],' +
                                            'thread_group[category="open"] > board[url="' + url + '"]')){
                        tab.contentWindow.close();

                        syncInfo.open.removed++;
                        continue;
                    }

                    //更新されていた場合
                    if(root.querySelector('thread_group[category="open"] > thread[url="' + url + '"][s="u"]') &&
                       prefs.getBoolPref('reload_updated_threads')){
                            tab.contentDocument.location.reload();

                            syncInfo.open.updated++;
                            continue;
                    }
                }
            }
        }

        //同期の成功を通知
        notify('同期完了 追加:', syncInfo.fav.added + syncInfo.open.added,
               '削除:', syncInfo.fav.removed + syncInfo.open.removed,
               '更新:', syncInfo.fav.updated + syncInfo.open.updated);
        log('[お気に入り]', '追加:', syncInfo.fav.added, '削除:', syncInfo.fav.removed, '更新:', syncInfo.fav.updated,
            '\n[閲覧中]', '追加:', syncInfo.open.added, '削除:', syncInfo.open.removed, '更新:', syncInfo.open.updated);
    }

};


var Sync2chUtils = {

    getClientInfo: function(){
        var extension = {
            name: 'Firefox', version: '1.0'
        };

        const ADDON_ID = FoxAge2chUtils.bbs2chVersion == FoxAge2chUtils.B2R_CHAIKA ?
                        CHAIKA_ID : B2R_ID;

        if (fuelApp.extensions) {
            extension = fuelApp.extensions.get(ADDON_ID);
        }else{
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            var temp_ext;

            AddonManager.getAddonByID(ADDON_ID, function(ext){
                temp_ext = ext;
            });

            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (temp_ext === void(0)) {
                thread.processNextEvent(true);
            }

            extension = temp_ext;
        }

        return { name: extension.name, version: extension.version };
    }

};
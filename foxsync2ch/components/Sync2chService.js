Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const DESCRIPTION = 'Sync2chService js component';
const CONTRACTID = '@software.2ch.net/sync2ch-service;1';
const CLASSID = Components.ID("{1C15B29E-52F0-11DE-9836-8EA256D83056}");

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

var gService = null;


function Sync2chService(){
}

Sync2chService.prototype = {

    _startup: function Sync2chService__startup(){
        Components.utils.import("resource://sync2ch/Sync2chCore.js");
        Sync2chCore.init();
    },

    _quit: function Sync2chService__quit(){
    },


    // *************** implements nsIObserver ***************
    observe: function Sync2chService_observe(aSubject, aTopic, aData){
        var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

        switch(aTopic){
            case 'app-startup':
                os.addObserver(this, "profile-after-change", false);
                break;

            case "profile-after-change":
                os.addObserver(this, "quit-application", false);
                this._startup();
                break;

            case "quit-application":
                this._quit();
                os.removeObserver(this, 'quit-application');
                break;
        }
    },


    // *************** XPCOMUtils Component Registration ***************

    classDescription: DESCRIPTION,
    contractID: CONTRACTID,
    classID: CLASSID,
    _xpcom_categories: [{category: "app-startup",
                         service: true,
                         entry: DESCRIPTION,
                         value: CONTRACTID
                        }],
    _xpcom_factory: {
        createInstance: function(aOuter, aIID) {
            if(aOuter != null) throw Cr.NS_ERROR_NO_AGGREGATION;
            if(!gService) gService = new Sync2chService();

            return gService.QueryInterface(aIID);
        }
    },

    // nsISupports
    QueryInterface: XPCOMUtils.generateQI([
        Ci.Sync2chService,
        Ci.nsISupportsWeakReference,
        Ci.nsIObserver,
        Ci.nsISupports
    ])
};


if (XPCOMUtils.generateNSGetFactory) {
    // Firefox >= 4
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([Sync2chService]);
} else {
    // Firefox <= 3.6.*
    var NSGetModule = function(aCompMgr, aFileSpec){
        return XPCOMUtils.generateModule([Sync2chService]);
    };
}
/* Copyright (c) 2006 SecurityCompass
   See the file LICENSE.txt for licensing information. */

/* module PreferenceContainer */

var PreferenceContainerModule = new Object();

const PreferenceContainer_CONTRACTID     = "@SecurityCompass/jsPreferenceContainer;1";
const PreferenceContainer_CID        = Components.ID("{f58028d5-1205-4731-9217-73e29a942355}");
const Cc = Components.classes;
const Ci = Components.interfaces;

function PreferenceContainer() {
    this.specificContainer = null;
    this.prefData = null;
    this.prefBranch = null;
    this.prefService = Components.classes['@mozilla.org/preferences-service;1'].
            getService(Components.interfaces.nsIPrefService);
    this.wrappedJSObject = this;
    this.JSON = {
        /**
         * Converts a JavaScript object into a JSON string.
         *
         * @param aJSObject is the object to be converted
         * @param aKeysToDrop is an optional array of keys which will be
         *                    ignored in all objects during the serialization
         * @return the object's JSON representation
         *
         * Note: aJSObject MUST not contain cyclic references.
         */
        toString: function JSON_toString(aJSObject, aKeysToDrop) {
        // these characters have a special escape notation
            const charMap = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f",
                "\r": "\\r", '"': '\\"', "\\": "\\\\" };
        
        // we use a single string builder for efficiency reasons
                var pieces = [];
        
        // this recursive function walks through all objects and appends their
        // JSON representation (in one or several pieces) to the string builder
                function append_piece(aObj) {
                    if (typeof aObj == "boolean") {
                        pieces.push(aObj ? "true" : "false");
                    }
                    else if (typeof aObj == "number" && isFinite(aObj)) {
            // there is no representation for infinite numbers or for NaN!
                        pieces.push(aObj.toString());
                    }
                    else if (typeof aObj == "string") {
                        aObj = aObj.replace(/[\\"\x00-\x1F\u0080-\uFFFF]/g, function($0) {
              // use the special escape notation if one exists, otherwise
              // produce a general unicode escape sequence
                            return charMap[$0] ||
                                    "\\u" + ("0000" + $0.charCodeAt(0).toString(16)).slice(-4);
                        });
                        pieces.push('"' + aObj + '"')
                    }
                    else if (aObj === null) {
                        pieces.push("null");
                    }
          // if it looks like an array, treat it as such - this is required
          // for all arrays from either outside this module or a sandbox
                    else if (aObj instanceof Array ||
                    typeof aObj == "object" && "length" in aObj &&
                    (aObj.length === 0 || aObj[aObj.length - 1] !== undefined)) {
                        pieces.push("[");
                        for (var i = 0; i < aObj.length; i++) {
                            append_piece(aObj[i]);
                            pieces.push(",");
                        }
                        if (pieces[pieces.length - 1] == ",")
                        pieces.pop(); // drop the trailing colon
                        pieces.push("]");
                    }
                    else if (typeof aObj == "object") {
                        pieces.push("{");
                        for (var key in aObj) {
              // allow callers to pass objects containing private data which
              // they don't want the JSON string to contain (so they don't
              // have to manually pre-process the object)
                            if (aKeysToDrop && aKeysToDrop.indexOf(key) != -1)
                            continue;
              
                            append_piece(key.toString());
                            pieces.push(":");
                            append_piece(aObj[key]);
                            pieces.push(",");
                        }
                        if (pieces[pieces.length - 1] == ",")
                        pieces.pop(); // drop the trailing colon
                        pieces.push("}");
                    }
                    else {
                        throw new TypeError("No JSON representation for this object!");
                    }
                }
                append_piece(aJSObject);
        
                return pieces.join("");
        },
        
        /**
        * Converts a JSON string into a JavaScript object.
        *
        * @param aJSONString is the string to be converted
        * @return a JavaScript object for the given JSON representation
        */
        fromString: function JSON_fromString(aJSONString) {
            if (!this.isMostlyHarmless(aJSONString))
            throw new SyntaxError("No valid JSON string!");
        
            var s = new Components.utils.Sandbox("about:blank");
            return Components.utils.evalInSandbox("(" + aJSONString + ")", s);
        },
        
        /**
        * Checks whether the given string contains potentially harmful
        * content which might be executed during its evaluation
        * (no parser, thus not 100% safe! Best to use a Sandbox for evaluation)
        *
        * @param aString is the string to be tested
        * @return a boolean
        */
        isMostlyHarmless: function JSON_isMostlyHarmless(aString) {
            const maybeHarmful = /[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/;
            const jsonStrings = /"(\\.|[^"\\\n\r])*"/g;
        
            return !maybeHarmful.test(aString.replace(jsonStrings, ""));
        }
    };

}
PreferenceContainer.prototype = {
    load: function(){
        if (this.specificContainer !== null){
            var branch = this.specificContainer.getBranchName();
            var pref = this.specificContainer.getPrefName();
            var rawPref, prefsArray;
            if (this.prefBranch === null){
                this.prefBranch = this.prefService.getBranch(branch);
            }
            rawPref = this.prefBranch.getCharPref(pref);
            dump(rawPref);
            prefsArray = this.JSON.fromString(rawPref);
            this.prefData = new Array();
            for each (var pref in prefsArray) {
                var bag = Cc['@mozilla.org/hash-property-bag;1'].createInstance(Ci.nsIWritablePropertyBag2);
                bag.setPropertyAsAString("string", pref.string);
                bag.setPropertyAsAString("sig", pref.sig);
                this.prefData.push(bag);
            }
            dump("prefData.length=="+this.prefData.length)
        }
    }
    ,
    setSetSpecifiPreferenceContainer: function (specificContainer) {
        if (specificContainer.QueryInterface(Ci.SecCompISpecificPreferenceContainer)) {
            this.specificContainer = specificContainer;
        }
        return true;
    }
    ,
    getContents: function(foo) {
        if (this.prefData === null){
            this.load();
        }
        foo.value = this.prefData.length;
        return this.prefData;
    }
    ,
    addString: function(str, sig){
        if (!str)
            return false;
        var newPref = new Object();
        var isUnique = false;
        isUnique = this.prefData.every(function(element, index, array){return element.getProperty("string") != str}, newPref);
        if (isUnique){
            var newPrefBag = Cc['@mozilla.org/hash-property-bag;1'].createInstance(Ci.nsIWritablePropertyBag2)
            newPrefBag.setPropertyAsAString("string", str);
            newPrefBag.setPropertyAsAString("sig", sig);
            this.prefData.push(newPrefBag);
            this.save();
        }
        return true;
    }
    ,
    remove: function(index){
        this.prefData.splice(index, 1);
        return this.save();
    }
    ,
    save: function() {
        if (this.specificContainer !== null){
            var branch = this.specificContainer.getBranchName();
            var prefName = this.specificContainer.getPrefName();
            dump("\nprefName" + prefName);
            var simplePrefs = new Array();
            for each(var pref in this.prefData){
                var simplePref = new Object();
                simplePref.string = pref.getProperty("string");
                simplePref.sig = pref.getProperty("sig");
                simplePrefs.push(simplePref);
            }
            var rawPref = this.JSON.toString(simplePrefs);
            dump(rawPref);
            this.prefService.getBranch(branch).setCharPref(prefName, rawPref);
            
            return true;
        }
        return false;
    }
    ,
    swap: function (index1, index2){
        var rv = false;
        if (this.prefData[index1] && this.prefData[index2]) {
            [this.prefData[index2], this.prefData[index1]] = [this.prefData[index1], this.prefData[index2]];
            rv = true;
        }
        
        return rv;
    }
    ,
    QueryInterface: function(iid) {
        if (!iid.equals(Ci.SecCompIGenericPreferenceContainer) &&
            !iid.equals(Ci.SecCompIPreferenceContainer) &&
            !iid.equals(nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
}


PreferenceContainerModule.registerSelf =
function (compMgr, fileSpec, location, type)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(PreferenceContainer_CID, 
                                "PreferenceContainer Component",
                                PreferenceContainer_CONTRACTID, 
                                fileSpec, 
                                location,
                                type);
}

PreferenceContainerModule.getClassObject =
function (compMgr, cid, iid) {
    
    if (!iid.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
    if(cid.equals(PreferenceContainer_CID))
        return PreferenceContainerFactory;
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

PreferenceContainerModule.canUnload =
function(compMgr)
{
    return true;
}
    
/* factory object */
var PreferenceContainerFactory = new Object();

PreferenceContainerFactory.createInstance =
function (outer, iid) {
    if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;

    return (new PreferenceContainer()).QueryInterface(iid);
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec) {
    return PreferenceContainerModule;
}


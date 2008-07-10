/*
Copyright 2007 Security Compass

This file is part of Access Me.

Access Meis free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Access Meis distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Access Me.  If not, see <http://www.gnu.org/licenses/>.

If you have any questions regarding Access Meplease contact
tools@securitycompass.com
*/

/* module AttackDetectionRegExpContainer */

var AttackDetectionRegExpContainerModule = new Object();

const AttackDetectionRegExpContainer_CONTRACTID     = "@securitycompass.com/jsAttackDetectionRegExpContainer;1";
const AttackDetectionRegExpContainer_CID        = Components.ID("{532eee66-f87f-4993-885f-c9ab52b7f4c4}");
const Ci = Components.interfaces;
const Cc = Components.classes;

function AttackDetectionRegExpContainer() {
    this.prefContainer = Cc["@SecurityCompass/jsPreferenceContainer;1"].
            createInstance(Ci.SecCompIPreferenceContainer);
    this.prefContainer.QueryInterface(Ci.SecCompIGenericPreferenceContainer).
            setSetSpecifiPreferenceContainer(this);
    this.wrappedJSObject = this;
}

AttackDetectionRegExpContainer.prototype = {

    getContents: function() {
        dump("entering AttackDetectionRegExpContainer::getContents\n")
        dump("returning from AttackDetectionRegExpContainer::getContents\n")
        return this.prefContainer.getContents();
    }
    ,
    addString: function(str, sig){
        return this.prefContainer.addString(str, sig);
    }
    ,
    save: function() {
        return this.prefContainer.save();
    }
    ,
    swap: function (index1, index2){
        return this.prefContainer.swap(index1, index2);
    }
    ,
    getPrefName: function() {
        return "attackParamDetectRegex";
    }
    ,
    getBranchName: function(){
        return "extensions.accessme."; 
    }
    ,
    remove: function(index){
        return this.prefContainer.remove(index);
    }
    ,
    QueryInterface: function(iid) {
        if (!iid.equals(Ci.SecCompIPreferenceContainer) &&
            !iid.equals(Ci.SecCompISpecificPreferenceContainer) &&
            !iid.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    }
}


AttackDetectionRegExpContainerModule.registerSelf =
function (compMgr, fileSpec, location, type)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(AttackDetectionRegExpContainer_CID, 
                                "AttackDetectionRegExpContainer Component",
                                AttackDetectionRegExpContainer_CONTRACTID, 
                                fileSpec, 
                                location,
                                type);
}

AttackDetectionRegExpContainerModule.getClassObject =
function (compMgr, cid, iid) {
    
    if (!iid.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (cid.equals(AttackDetectionRegExpContainer_CID))
        return AttackDetectionRegExpContainerFactory;
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
    
}

AttackDetectionRegExpContainerModule.canUnload =
function(compMgr)
{
    return true;
}
    
/* factory object */
var AttackDetectionRegExpContainerFactory = new Object();
var foo = null;

AttackDetectionRegExpContainerFactory.createInstance =
function (outer, iid) {try {

    if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;
    dump("\n pre instantiating AttackDetectionRegxpContainer");
    if (foo === null)
        foo = new AttackDetectionRegExpContainer();
    dump("\n post instantiating AttackDetectionRegxpContainer");
    return foo.QueryInterface(iid);
}
catch(e){
    dump(e);
}
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec) {
    return AttackDetectionRegExpContainerModule;
}


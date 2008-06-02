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

/**
 * preferenceStringContainer.js
 * requires JSON.
 */
 

/**
 * the PreferenceStringContainer object is an abstract  base class for any kind of
 * object which has deal with an array of strings held in preferences. 
 * (e.g. AttackStringContainer, ResultStringContainer).
 */
function PreferenceStringContainer() {
    var self = this;
    
    this.strings = Array();
    this.prefBranch = null;
    this.prefService = Components.classes['@mozilla.org/preferences-service;1'].
            getService(Components.interfaces.nsIPrefService);

}

dump('creating... preferenceStringContainer object\n');
PreferenceStringContainer.prototype = {
    /**
     * init is responsible for reading and loading a preference into the
     * container
     */
    init: function() {
        
    }
    ,
    getStrings: function(force){
        if (force === true){
            this.init();
        }
        return this.strings;
    }
    ,
    addString: function(string, signature) {
        dump('PreferenceStringContainer::addString: ' + string+ ' ' + signature + '\n');
        if (!string) {
            return false;
        }
        
        var preference = new Object();
        preference.string = string;
        preference.sig = signature;
        if (this.strings.every(checkUnique, preference)){
            this.strings.push(preference);
            dump('PreferenceStringContainer::addString preference == ' +
                 preference + '\n');
            this.save();
            return true;
        }
        else {
            return false;
        }
    }
    ,
    /**
     * save is responsible for taking this.strings and saving it into 
     * preferences.
     */
    save: function() {    
    }
    ,
    swap: function (index1, index2){
        if (typeof(this.strings[index1]) === "undefined" || 
            this.strings[index1] === null || 
            typeof(this.strings[index2]) === "undefined" || 
            this.strings[index2] === null)
        {
            return false;
        }
        
        [this.strings[index2], this.strings[index1]] = 
                [this.strings[index1], this.strings[index2]]
            
        this.save();
        
        return true;
    }
    ,
    observePreference: function() {
        var self = this;
        this.observer = new SecCompObserver("nsPref:changed",
            function(subject, topic, data) {
                dump("\n--------------\npref changing");
                dump("\n---------")
                if(data == self.prefName) {
                    self.modded = true;
                    self.init();
                }
            });
        this.prefBranch.
            QueryInterface(Components.interfaces.nsIPrefBranch2).
            addObserver("", this.observer, false);
    }
    ,
    unload: function(){
        dump("\n----------\npref container unloading\n----------")
        this.prefBranch.
                QueryInterface(Components.interfaces.nsIPrefBranch2).
                removeObserver("", this.observer);
    }
    ,
    export: function(exportFile){
        if (exportFile == null)
            return false;
        var exportDoc = document.implementation.createDocument("", "", null);
        var root = exportDoc.createElement(this.getRootElementName());
        var xmlAttacks = exportDoc.createElement();
        var strings = this.getStrings();
        for each (var string in string){
            var xmlElement = exportDoc.createElement(this.getElementName());
            var xmlString = exportDoc.createElement('string');
            var xmlSig = exportDoc.createElement('signature');
            var txtString = exportDoc.createCDATASection(
                    encodeXML(string.string));
            var txtSig = exportDoc.createTextNode(string.sig);
            xmlString.appendChild(txtString);
            xmlSig.appendChild(txtSig);
            xmlAttack.appendChild(xmlString);
            xmlAttack.appendChild(xmlSig);
            xmlAttacks.appendChild(xmlAttack);
        }
        root.appendChild(xmlAttacks);
        var serializer = new XMLSerializer();
        var xml = serializer.serializeToString(exportDoc);
        dump(xml);dump('\n');

        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(exportFile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
        foStream.write(xml, xml.length);
        foStream.close();
        return true;
    }
    ,
    import: function(importFile) {
        
        var fileContents = FileIO.read(importFile);
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(fileContents, "text/xml");

        if(dom.documentElement.nodeName == "parsererror"){
            alert("error while parsing document, ensure that the document is complete and uncorrupted.");
            return false;
        }
        
        var rootTags = dom.getElementsByTagName(this.getRootElementName());
        if (rootTags.length != 1){
            alert("couldn't find attacks tag. Error while processing document.");
            return false;
        }
        
        var rootTag = rootTags[0];
        var childrenTags = new Array();
        
        for (var i = 0; i < rootTag.childNodes.length; i++){
//             alert("'" + (attackTag.firstChild.firstChild.nodeName  == '#text')+"'");
//            dump("::importAttacks()... (" + attacksTag + "== attacksTag) attacksTag[" + i + "] == " + attacksTag.childNodes[i] + "\n");
            if (this.getElementName() === attacksTag.childNodes[i].nodeName){
                attackTags.push(attacksTag.childNodes[i]);
            }
        }
        if (attackTags.length){
            for each(var attackTag in attackTags){
                var stringTag = null;
                var sigTag = null;
                for each(var tag in attackTag.childNodes){
                    dump("::importAttacks()... (looking for attackString and sig) " + tag.nodeName +  "\n");
                    if (tag.nodeName === "attackString"){
                        dump("got attackString\n");
                        stringTag = tag;
                    }
                    else if (tag.nodeName === "signature"){
                        dump("got sigString\n");
                        sigTag = tag;   
                    }
                }
                if (stringTag === null || sigTag === null){
                    alert("Couldn't import attack. Couldn't find stringAttack or signature tags. Error while processing the document. ");
                    this.makeUI(attackStringContainer.getStrings(), window); // just in case.
                    return false;
                }
                else{
                    if (stringTag.childNodes.length !== 0)
                    {
                        
                        attackStringContainer.addString(
                            decodeXML(stringTag.textContent),
                            sigTag.firstChild.nodeValue);
                    }
                    else {
                        alert("Couldn't import attack. attackString is empty. Error while processing the document. ");
                        this.makeUI(attackStringContainer.getStrings(), window); // just in case.
                        return false;
                    }
                }
            }
        }
        else {
            alert("Couldn't find any attacks. No Attacks imported.");
            return false;            
        }
        
        var errStrings = dom.getElementsByTagName('results');
        if (errStrings.length === 1) {
            var errStrings = errStrings[0];
            var errTags = new Array();
            for each(var errTag in errStrings.childNodes){
                if (errTag.nodeName == 'resultString') {
                    errTags.push(errTag);
                }
            }
            
            if (errTags.length) {
                var errStringContainer = getErrorStringContainer();
                for each(var errTag in errTags) {
                    dump('preference.js::importAttacks errTag.textContent == ' + errTag.textContent + '\n');
                    errStringContainer.addString(decodeXML(errTag.textContent), null);
                }
            }
        }
        this.makeUI(getAttackStringContainer().getStrings(), window, 'existingSQLIstrings');
        this.makeUI(getErrorStringContainer().getStrings(), window, 'existingSQLIerrStrings');
        return true;

    }
};

/**
 * used by addString to ensure that a given (in this.string) is not in the 
 * container
 */
function checkUnique(element, index, array){
    dump("checkunique: " + (this.string) + " " + (element.string) + " \n");
    dump("checkunique: " + (this.string != element.string) + " \n");
    return this.string != element.string;
}

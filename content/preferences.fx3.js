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

/* prefereneces.js 
 * @requires JSON
 * @requires AttackStringContainer
 * @requires util.js
 */

function PreferencesController() {
    this.init();
}

PreferencesController.prototype = {
    init: function(){
        var f = new Object();
        var attackParamDetectRegexs = getAttackParamDetectRegexContainer().wrappedJSObject.getContents(f);
        
        
        if (attackParamDetectRegexs.length) {
            this.makeUI(attackParamDetectRegexs, null,
                    'existingAttackParamDetectRegex');
        }
        else {
            var label = document.getElementById('noregexlbl');
            label.style.visibility = 'visible';
        }
        
        var similarityFactor = document.getElementById('prefSimilarityFactor');
        var similarityTxtBox = document.getElementById('txtSimilarityFactor');
        similarityTxtBox.value = similarityFactor.value/1000;
        
        function similarityFactorChangeListener(e){
            var prefService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
            var prefBranch = prefService.getBranch('extensions.accessme.');
            var pref = prefBranch.setIntPref('similarityRating', similarityTxtBox.value*1000);

        }
        similarityTxtBox.addEventListener('blur', similarityFactorChangeListener, true);
    }
    ,
    /**
     * Regenerates the User Interfaces
     * @param prefs an array of prefs
     * @param aWindow window in which to display the prefs
     * @param listboxID list box 
     */
    makeUI: function(prefs, aWindow, listboxID){
        var theWindow;
        if (typeof(aWindow) === 'undefined' || aWindow === null || !aWindow){
            theWindow = window;
        }
        else {
            theWindow = aWindow;
        }
        
        var listbox = theWindow.document.getElementById(listboxID);
        
        while (listbox.hasChildNodes()) {
            listbox.removeChild(listbox.firstChild);
        }
        
        for (var i = 0; i < prefs.length; i++){
            var listitem = document.createElement('listitem');
            listitem.setAttribute('label', prefs[i].getProperty("string"));
            listitem.setAttribute('value', i);
            listbox.appendChild(listitem);
        }
    }
    ,
    removePassString: function(){
        return this.removeItem(getPassStringContainer(), "existingPassStringRegex"); 
    }
    ,
    removeError: function(){
    }
    ,
    removeDetectRegEx: function(){
        return this.removeItem(getAttackParamDetectRegexContainer(), "existingAttackParamDetectRegex");
    }
    ,
    removeItem: function(container, listboxID){
        var listbox = document.getElementById(listboxID);
        var selectedAttacks = listbox.selectedItems;
        var n = 0;
        for (var i = 0; i < selectedAttacks.length; i++){
            container.remove(selectedAttacks[i].value);
        }
        this.makeUI(container.getContents({}), window, listboxID);
    }
    ,
    exportDetectionRegexs: function() {
        var exportDoc = document.implementation.createDocument("", "", null);
        var root = exportDoc.createElement('exportedDetectionRegexStrings');
        var detectorContainer = getAttackParamDetectRegexContainer();
        for each (var detector in detectorContainer.getContents()) {
            var objectXMLTag = exportDoc.createElement('detectionString');
            var xmlSig = exportDoc.createElement('signature');
            var xmlString = exportDoc.createElement("string");
            var txtString = exportDoc.createCDATASection(
                    encodeXML(detector.getProperty("string")));
            var txtSig = exportDoc.createTextNode(detector.getProperty("sig"));
            xmlString.appendChild(txtString);
            xmlSig.appendChild(txtSig);
            objectXMLTag.appendChild(xmlString);
            objectXMLTag.appendChild(xmlSig);
            root.appendChild(objectXMLTag);
        }
        exportDoc.appendChild(root);
        var serializer = new XMLSerializer();
        var xml = serializer.serializeToString(exportDoc);
        dump(xml);dump('\n');

        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        picker.init(window, "Select File To Export To", nsIFilePicker.modeSave);
        //picker.appendFilters(nsIFilePicker.filterAll|nsIFilePicker.filterXML);
        picker.appendFilter('XML Files', '*.xml');
        picker.appendFilter('All Files', '*');
        picker.defaultExtension - '.xml';
        var resultOfPicker = picker.show();
        if (resultOfPicker == nsIFilePicker.returnCancel){
            return false;
        }
        var exportFile = picker.file;

        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(exportFile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
        foStream.write(xml, xml.length);
        foStream.close();
        return true;
        
    }
    ,
    importDetectionRegexs: function(){
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        picker.init(window, "Select File To Import From", nsIFilePicker.modeOpen);
        //picker.appendFilters(nsIFilePicker.filterAll|nsIFilePicker.filterXML);
        picker.appendFilter('XML Files', '*.xml');
        picker.appendFilter('All Files', '*');
        var resultOfPicker = picker.show();
        if (resultOfPicker == nsIFilePicker.returnCancel){
            return false;
        }
        var importFile = picker.file;
        
        var fileContents = FileIO.read(importFile);
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(fileContents, "text/xml");

        if(dom.documentElement.nodeName == "parsererror"){
            alert("error while parsing document, ensure that the document is complete and uncorrupted.");
            return false;
        }
        
        var parentTags = dom.getElementsByTagName("exportedDetectionRegexStrings");
        if (parentTags.length != 1) {
            alert("couldn't find parents tag. Error while processing document.");
            return false;
        }
        
        var parentTag = parentTags[0];
        var tags = new Array();
        var detectorContainer = getAttackParamDetectRegexContainer();
        
        for (var i = 0; i < parentTag.childNodes.length; i++) {
            if ("detectionString" === parentTag.childNodes[i].nodeName){
                tags.push(parentTag.childNodes[i]);
            }
        }
        
        if (tags.length) {
            for each(var tag in tags) {
                var stringTag = null;
                var sigTag = null;
                for each(var tag in tag.childNodes) {
                    if (tag.nodeName == "string") {
                        stringTag = tag;
                    }
                    else if (tag.nodeName === "signature") {
                        sigTag = tag;   
                    }
                }
                
                if (stringTag == null) {
                    /* @todo it would be nice to fail a bit more gracefully
                     * than this */
                    alert("Couldn't import attack. Couldn't find stringAttack or signature tags. Error while processing the document. ");
                    this.makeUI(detectorContainer.getContents(), window); // just in case.
                    return false;
                }
                else {
                    if (stringTag.childNodes.length !== 0) {
                        detectorContainer.addString(
                                decodeXML(stringTag.textContent), (sigTag?sigTag.textContent:""));
                    }
                    else {
                        alert("Couldn't import attack. attackString is empty. Error while processing the document. ");
                        this.makeUI(detectorContainer.getContents(), window); // just in case.
                        return false;
                    }
                }
            }
        }
        else {
            alert("Couldn't find any attacks. No Attacks imported.");
            return false;            
        }

        this.makeUI(detectorContainer.getContents(), window, 'existingAttackParamDetectRegex');
        return true;
    }
    ,
    movePassStringUp: function(){
        return this.moveItemUp(getPassStringContainer(), "existingPassStringRegex")
    }
    ,
    movePassStringDown: function(){
        return this.moveItemDown(getPassStringContainer(), "existingPassStringRegex")
    }
    ,
    moveErrorStringUp:function() {
//        return this.moveItemUp(getErrorStringContainer(), "errorStrBox")

    }
    ,
    moveErrorStringDown: function(){
//        return this.moveItemDown(getErrorStringContainer(), "errorStrBox")
    }
    ,
    moveDetectRegExStringUp:function() {
        return this.moveItemUp(getAttackParamDetectRegexContainer(), "existingAttackParamDetectRegex")

    }
    ,
    moveDetectRegExStringDown: function(){
        return this.moveItemDown(getAttackParamDetectRegexContainer(), "existingAttackParamDetectRegex")
    }
    ,
    moveItemUp: function(container, listboxID){
        var listbox = document.getElementById(listboxID);
        var selectedIndex = listbox.selectedIndex;
        var selectedItemValue = listbox.selectedItem.value
        var selectedItemLabel = listbox.selectedItem.label
        if (listbox.selectedItem.previousSibling == null) { 
            return false; 
        } 
        var newValue = listbox.selectedItem.previousSibling.value;
        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }

        container.swap(listbox.selectedItem.value, 
            listbox.selectedItem.previousSibling.value);
        container.save();
        
        listbox.ensureIndexIsVisible(selectedIndex  - 1);
        
        listbox.selectedItem.previousSibling.value = selectedItemValue
        
        listbox.removeItemAt(selectedIndex)
        listbox.insertItemAt(selectedIndex-1, selectedItemLabel, newValue)
        
        listbox.selectedIndex = selectedIndex - 1;
        return true;
    }
    ,
    moveItemDown: function(container, listboxID) {
        var listbox = document.getElementById(listboxID);
        var selectedIndex = listbox.selectedIndex;
        var selectedItem = listbox.selectedItem; 
 
        if (selectedIndex + 1 >= listbox.getRowCount()) { 
            return true; 
        }         
                 var selectedItem = listbox.selectedItem; 
 
        if (selectedIndex + 1 >= listbox.getRowCount()) { 
            return true; 
        }         
         
        var selectedItemValue = listbox.selectedItem.value
        var selectedItemLabel = listbox.selectedItem.label;
        var newValue = listbox.selectedItem.nextSibling.value;
        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }

        container.swap(listbox.selectedItem.value, 
            listbox.selectedItem.nextSibling.value);
        container.save();
        
        listbox.ensureIndexIsVisible(selectedIndex  + 1);
        
        listbox.selectedItem.nextSibling.value = selectedItemValue
        
        if (selectedIndex + 2 >= listbox.getRowCount()) { 
             
            listbox.selectedItem = listbox.getItemAtIndex(listbox.getRowCount() -1) 
            this.moveItemUp(container, listboxID) 
            listbox.selectedIndex = listbox.getRowCount() -1 
             
        } 
        else {
            listbox.removeItemAt(selectedIndex)
            listbox.insertItemAt(selectedIndex+1, selectedItemLabel, newValue) 
            listbox.selectedIndex = ++selectedIndex ; 
        } 
         
        listbox.ensureIndexIsVisible(selectedIndex ); 
        
        return true;
    }
    ,
    unload: function(){
    }
};


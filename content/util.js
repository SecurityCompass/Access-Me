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
 * util.js
 * Utility Functions.
 */

/**
 * This takes a string of a piece of encoded XML and decodes it.
 * Specifically, this checks checks for encoded nested ]]> code.
 * Note: No XML parsing or checking is done.
 * @param xmlString
 * @returns a decoded string of a piece of XML (same piece)
 */
function decodeXML(xmlString) {
    
    var regex = ']]]]><![CDATA[';
    var replaced = ']]>';
    
    return xmlString.replace(regex, replaced, 'gm');
    
}

/**
 * This takes a string of a piece of XML and decodes it.
 * Specifically, this checks checks for nested ']]>' code.
 * Note: No XML parsing or checking is done.
 * @param xmlString
 * @returns an encoded string of a piece of XML (same piece)
 */
function encodeXML(xmlString) {
    
    var regex = ']]>';
    var replaced = ']]]]><![CDATA[';
    
    return xmlString.replace(regex, replaced, 'gm');
    
}

/**
 * Takes a string and returns the string with each character encoded in html
 * entities (e.g. &#65; for A).
 */
function encodeString(str){
    var rv = "";
    for each(var letter in str.toString()){
        if (typeof(letter) == "string") {
            rv += '&#' + letter.charCodeAt(0) +  ';';
        }
    }
    return rv;
}

/**
 * This imports attacks from an XML file
 */
function importAttackFromXMLString(fileContents, container) {
    
    var domParser = new DOMParser();
    dump('PreferencesController::importAttacks imported data (post decoding): \n---\n' + fileContents + '\n---\n');
            
    var dom = domParser.parseFromString(fileContents, "text/xml");

    if(dom.documentElement.nodeName == "parsererror"){
        alert("error while parsing document, ensure that the document is complete and uncorrupted.");
        return false;
    }
    
    var attacksTags = dom.getElementsByTagName("attacks");
    if (attacksTags.length != 1){
        alert("couldn't find attacks tag. Error while processing document.");
        return false;
    }
    
    var attacksTag = attacksTags[0];
    var attackTags = new Array();
    var attackStringContainer = (container === undefined) ? getAttackStringContainer() : container;
    
    for (var i = 0; i < attacksTag.childNodes.length; i++){
        
//             alert("'" + (attackTag.firstChild.firstChild.nodeName  == '#text')+"'");
        dump("::importAttacks()... (" + attacksTag + "== attacksTag) attacksTag[" + i + "] == " + attacksTag.childNodes[i] + "\n");
        if ("attack" === attacksTag.childNodes[i].nodeName){
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
                        sigTag.textContent);
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
}

function importAttacksFromXMLFile(importFile, container) {
    var fileContents = FileIO.read(importFile);
    return importAttackFromXMLString(fileContents, container);
}

function getMonthName(monthNumber) {
    var months = new Array();
    months[0]  = "January";
    months[1]  = "February";
    months[2]  = "March";
    months[3]  = "April";
    months[4]  = "May";
    months[5]  = "June";
    months[6]  = "July";
    months[7]  = "August";
    months[8]  = "September";
    months[9]  = "October";
    months[10] = "November";
    months[11] = "December";
    return months[monthNumber];
}

/**
 * This function checks the success whether the work tab's content document
 * match the original tab's content document (in ways that we care about).
 * @returns true if same otherwise false.
 */
function compareContentDocuments(origTabContentDocument, workTabContentDocument) {
    var rv = true; 
    if (workTabContentDocument.forms) {
        if (origTabContentDocument.forms.length ===
            workTabContentDocument.forms.length)
        {
            for (var i = 0; i < origTabContentDocument.forms.length && rv; i++) {
                if (workTabContentDocument.forms[i]){
                    if (workTabContentDocument.forms[i].elements){
                        for (var n = 0; n < origTabContentDocument.forms[i].elements.length && rv; n++){
                            if (workTabContentDocument.forms[i].elements[i]) {
                                if (origTabContentDocument.forms[i].elements[i].type !=
                                workTabContentDocument.forms[i].elements[i].type) {
                                    rv = false;
                                }
                            }
                        }
                    }
                    else {
                        rv = false;
                    }
                }
                else {
                    rv = false;
                }
            }
        }
        else {
            rv = false;
        }
    }
    else {
        rv = false;
    }
    return rv
}

/**
 * get a reference to the main firefox window
 */
function getMainWindow(){
    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);
    return mainWindow;
}

/**
 * get a reference to the document object of the page that is being viewed now
 */
function getMainHTMLDoc(){
    var mainWindow = getMainWindow();
    var elTabBrowser = mainWindow.document.getElementById('content');
    var currentDocument = elTabBrowser.contentDocument;
    return currentDocument;
}
 
 
/**
 * takes an http channel and returns a distinct copy of it. Copies POST, GET,
 * and referer.
 * @param httpChannel an nsIHttpChannel
 * @returns a new nsIHttpChannel on succes, null on failure.
 */
function cloneHttpChannel(channel){
    var httpChannel;
    try {
        httpChannel = channel.QueryInterface(Components.interfaces.
                nsIHttpChannel);
    }
    catch(e){
        return null;
    }
    
    var ioService = Components.classes['@mozilla.org/network/io-service;1']
        .getService(Components.interfaces.nsIIOService);

    var rv = ioService.newChannelFromURI(httpChannel.URI);
    
    var rvAsHttpChannel = rv.QueryInterface(Components.interfaces.nsIHttpChannel);
    if (httpChannel.requestMethod.toLowerCase() == 'post'){

        var uploadChannel = null;
        try {
            uploadChannel = channel.QueryInterface(Components.interfaces.
                    nsIUploadChannel);
            if (uploadChannel && uploadChannel.uploadStream) {
                if (uploadChannel.uploadStream) {
                    var seekableStream = uploadChannel.uploadStream.
                        QueryInterface(Components.interfaces.nsISeekableStream)
                    seekableStream.seek(Components.interfaces.
                            nsISeekableStream.NS_SEEK_SET, 0);
                    var sis =  Components.
                        classes["@mozilla.org/scriptableinputstream;1"].
                        createInstance(Components.interfaces.
                                nsIScriptableInputStream);
                    sis.init(uploadChannel.uploadStream);
                    var postStream= "";
                    while (true) {
                        var str = sis.read(512);
                        if (str) {
                            postStream += str;
                        }
                        else {
                            break;
                        }
                    }
                    postStream = postStream.split('\r\n\r\n')[1];
                    var inputStream = Components.
                        classes['@mozilla.org/io/string-input-stream;1'].
                        createInstance(Components.interfaces.nsIStringInputStream);
                        inputStream.setData(postStream, postStream.length);
                    
                    rv.QueryInterface(Components.interfaces.nsIUploadChannel).
                            setUploadStream(inputStream,
                            'application/x-www-form-urlencoded', -1);
                    rvAsHttpChannel.requestMethod = 'POST';
                    
                    //var seekableStream = uploadChannel.uploadStream.
                    //    QueryInterface(Components.interfaces.nsISeekableStream)
                    seekableStream.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);
                }
            }
        }
        catch (e) {
            Components.utils.reportError(e);
        }
    }

    return rv;

}

/**
 * Creates a new http channel from a session history entry. Including POST data.
 * @param nsISHEntry an nsISHistoryEntry
 */
function createHttpChannelFromSHEntry(nsISHEntry) {
    var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    var httpChannel = ioService.newChannelFromURI(nsISHEntry.URI);
    httpChannel = httpChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
    
    if (nsISHEntry.postData){
        var uploadChannel = httpChannel.QueryInterface(Components.interfaces.nsIUploadChannel);
        uploadChannel.setUploadStream(nsISHEntry.postData,  'application/x-www-form-urlencoded', -1)
        httpChannel.requestMethod = "POST";
    }
    
    httpChannel.referrer = nsISHEntry.referrerURI;
    return httpChannel;
}

/**
 * Creates an exact copy of a Request including a copy of the POST
 * data (if available)
 * @param origRequest the request we're copying
 * @param origURI optional. If the request is missing the URI then this URI
 *                will be used.
 */
function createHttpChannelFromHttpChannel(origRequest, origURI) {
    var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    var uriToCloneFrom = origRequest.originalURI == null? origRequest.URI :origRequest.originalURI;
    var httpChannel;
    if (uriToCloneFrom != null) {
        httpChannel = ioService.newChannelFromURI(uriToCloneFrom);
    }
    else {
        httpChannel = ioService.newChannelFromURI(origURI);
    }
    
    httpChannel = httpChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
    
    if (origRequest.requestMethod == "POST") {
        var uploadChannel = origRequest.QueryInterface(Components.interfaces.nsIUploadChannel);
        var uploadStream = uploadChannel.uploadStream.QueryInterface(Components.interfaces.nsIScriptableInputStream);
        var uploadStreamAsSeekable = uploadStream.
                QueryInterface(Components.interfaces.nsISeekableStream);
        var origUploadStreamLocation = uploadStreamAsSeekable.tell();
        var clonedUploadStream =Components.
                classes['@mozilla.org/io/string-input-stream;1'].
                createInstance(Components.interfaces.nsIStringInputStream);
        var lengthOfUploadStream;
        var newUploadChannel = httpChannel.QueryInterface(Components.interfaces.nsIUploadChannel);
                
        uploadStreamAsSeekable.
                seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);
        lengthOfUploadStream = uploadStream.available();
                
        clonedUploadStream.setData(uploadStream.read(uploadStream.available()));
        
        uploadStreamAsSeekable.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, origUploadStreamLocation);
        
        newUploadChannel.setUploadStream(clonedUploadStream, 'application/x-www-form-urlencoded', -1);
        
        httpChannel.requestMethod = "POST";
    }
    
    return httpChannel;
}
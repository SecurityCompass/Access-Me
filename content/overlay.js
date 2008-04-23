/*
Copyright 2007 Security Compass

This file is part of SQL Inject Me.

Access Meis free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Access Meis distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with SQL Inject Me.  If not, see <http://www.gnu.org/licenses/>.

If you have any questions regarding Access Meplease contact
tools@securitycompass.com
*/


function AccessMeOverlay() {
    dump('\nAccessMeOverlay::ctor()');
    var self = this;
    this.firstRun = true;
    this.historyListener = new SecCompHistoryListener();
    this.historyListener.OnHistoryNewEntry = function(aNewURI) {self.onNewPage(aNewURI)}
    this.progressListener = new SecCompProgressListener(function(aWebProgress, aRequest, aFlag, aStatus){self.gotRequest(aWebProgress, aRequest, aFlag, aStatus)},
            Components.interfaces.nsIWebProgressListener.STATE_START,
            // we could use stop, but earlier is faster :grin:
            Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT |
            Components.interfaces.nsIWebProgressListener.STATE_IS_NETWORK |
            Components.interfaces.nsIWebProgressListener.STATE_IS_REQUEST |
            Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW);
    /* all these or's are because I'm not that sure which thing we're supposed
      to be listening on */
}
AccessMeOverlay.prototype = {
    onLoad: function() {
        
        
    }
    ,
    onUnload: function() {

        
    }
    ,
    start: function() {
        if (this.firstRun) {
            
        }
        //document.getElementById('content').selectedBrowser.sessionHistory.addSHistoryListener(this.historyListener);
        gBrowser.selectedBrowser.addProgressListener(this.progressListener,
                Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
    }
    ,
    gotRequest: function (aWebProgress, aRequest, aFlag, aStatus) {
        if (aRequest.name.substring(0,4) !== 'http'){
            return; //we don't care about not http
        }
        dump('\nfoo '+ aRequest.name);
        var hasChannel = false;
        try {
            hasChannel = aRequest.QueryInterface(Components.interfaces.nsIChannel);
        }
        catch(e){
            Components.utils.reportError(e);
        }
        dump('\n hasChannel === ' + hasChannel);
        
        var hasHTTPChannel = false;
        try {
            hasHTTPChannel = aRequest.QueryInterface(Components.interfaces.nsIHttpChannel);
        }
        catch(e){
            Components.utils.reportError(e);
        }
        dump('\n hasHTTPChannel === ' + hasHTTPChannel);
        
        var hasUploadChannel= false;
        try {
            hasUploadChannel = aRequest.QueryInterface(Components.interfaces.nsIUploadChannel);
        }
        catch(e){
            Components.utils.reportError(e);
        }
        dump('\n hasUploadChannel === ' + hasUploadChannel);
        if (aRequest.QueryInterface(Components.interfaces.nsIUploadChannel).uploadStream != null) {
            var nsSIS = Components.classes["@mozilla.org/scriptableinputstream;1"]
                .createInstance(Components.interfaces.nsIScriptableInputStream);
            nsSIS.init(aRequest.QueryInterface(Components.interfaces.nsIUploadChannel).uploadStream);
            dump('\n size == ' + nsSIS.available());
            var ata = "";
            while(true) {
                var d = nsSIS.read(256)
                if (d)
                    ata += d;
                else
                    break;
            }
            dump('\n data: ' + ata);
            var upStream = aRequest.QueryInterface(Components.interfaces.nsIUploadChannel).uploadStream;
            var seekStream = upStream.QueryInterface(Components.interfaces.nsISeekableStream);
            seekStream.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);
                
        }
        else {
            dump('\n no size');
        }
        dump("\n aRequest.requestMethod" + aRequest.requestMethod);

        
    }
    ,
    recordRequestParameters: function(httpChannel) {

    }
    ,
    recordResponse: function(httpChannel) {
        
    }
    ,
    /**
     * Called when we have moved to a new page.
     * Doesn't take parameters because the data we need is only available in
     * the SessionHistory object anyway.
     */
    onNewPage: function(aNewURI) {
        dump('\nGot a new page');
        var sessionHistory = getBrowser().selectedBrowser.sessionHistory.QueryInterface(Components.interfaces.nsISHistory);
        var webNav = sessionHistory.QueryInterface(Components.interfaces.nsIWebNavigation);
        var curEntry = sessionHistory.getEntryAtIndex(0, false);
        
        dump(' title is:' + curEntry.title);
    }
};

var accessMeOverlay = new AccessMeOverlay();

window.addEventListener('load', function(){accessMeOverlay.onLoad()}, false);
window.addEventListener('unload', function(){accessMeOverlay.onUnload()}, false);

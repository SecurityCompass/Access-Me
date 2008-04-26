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
    //dump('\nAccessMeOverlay::ctor()');
    var self = this;
    this.firstRun = true;
    this.tabSelectListener = function(event){ dump('\n' + event.target);
            dump('\n' + event.originalTarget);}
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
    this.browser = null;
    this.started = false;
    this.lastRequest = null;
}
AccessMeOverlay.prototype = {
    onLoad: function() {
        
        gBrowser.selectedBrowser.addProgressListener(this.progressListener,
                Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
        gBrowser.tabContainer.addEventListener('TabSelect', this.tabSelectListener, false);
        this.browser = gBrowser.selectedBrowser;

    
        
    }
    ,
    onUnload: function() {
        gBrowser.selectedBrowser.removeProgressListener(this.progressListener,
                Components.interfaces);
        gBrowser.tabContainer.removeEventListener('TabSelect', this.tabSelectListener);
        
    }
    ,
    start: function() {
        this.started = true;
        if (this.firstRun === false) {
            this.firstRun = true;
        }
        
        var testManager = getTestManager(this);
        
        if (this.lastRequest) {
            this.analyzeRequest(null, this.lastRequest, null, null);
        }
        
        
        
    }
    ,
    gotRequest: function (aWebProgress, aRequest, aFlag, aStatus) {
        if (aRequest.name.substring(0,4) !== 'http'){
            return; //we don't care about not http
        }
        
        this.lastRequest = aRequest;
        
        if (this.started){
            this.analyzeRequest(aWebProgress, aRequest, aFlag, aStatus);
        }
        
    }
    ,
    analyzeRequest: function (aWebProgress, aRequest, aFlag, aStatus) {
        var req = aRequest.QueryInterface(Components.interfaces.nsIRequest);
        var webProgress = aWebProgress.QueryInterface(Components.interfaces.nsIWebProgress);
        var get = req.name;
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        var uri = ioService.newURI(req, null, null);
        
        

        
    }
    ,
    listenForRequests: function (browser) {
                
    }
    ,
    recordRequestParameters: function(aRequest) {

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
        //dump('\nGot a new page');
        var sessionHistory = getBrowser().selectedBrowser.sessionHistory.QueryInterface(Components.interfaces.nsISHistory);
        var webNav = sessionHistory.QueryInterface(Components.interfaces.nsIWebNavigation);
        var curEntry = sessionHistory.getEntryAtIndex(0, false);
        
        //dump(' title is:' + curEntry.title);
    }
};

var accessMeOverlay = new AccessMeOverlay();

window.addEventListener('load', function(){accessMeOverlay.onLoad()}, false);
window.addEventListener('unload', function(){accessMeOverlay.onUnload()}, false);

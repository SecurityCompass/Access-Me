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
    this.tabSelectListener =
            function(event) {
                dump('\n' + event.target);
                dump('\n' + event.originalTarget);
                try {
                    self.browser.removeProgressListener(self.progressListener);
                }
                catch(e){
                    Components.utils.reportError('did removal not work?' +e);
                }
                event.target.linkedBrowser.addProgressListener(self.progressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
                self.browser = event.target.linkedBrowser;
            }
    
    /**
     * used to listen for requests
     */
    this.progressListener = new SecCompProgressListener(
            function(aRequest, aURI){self.gotRequest(aRequest, aURI)},
            Components.interfaces.nsIWebProgressListener.STATE_START,
            // we could use stop, but earlier is faster :grin:
            Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT |
            Components.interfaces.nsIWebProgressListener.STATE_IS_NETWORK |
            Components.interfaces.nsIWebProgressListener.STATE_IS_REQUEST |
            Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW);
    /**
     * used to listen for the data from the requests
     */
    this.rawResponseListener = null; 
    
    this.rawResponse = null;
    /* all these or's are because I'm not that sure which thing we're supposed
      to be listening on */
    this.browser = null;
    this.started = false;
    this.lastOperation = null;
    
    this.testManager = null;
}

AccessMeOverlay.prototype = {
    onLoad: function() {
        var self = this;
        gBrowser.selectedBrowser.addProgressListener(this.progressListener,
                Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
        gBrowser.tabContainer.addEventListener('TabSelect',
                self.tabSelectListener, false);
        this.browser = gBrowser.selectedBrowser;
        
    }
    ,
    onUnload: function() {
        try {
            gBrowser.selectedBrowser.removeProgressListener(this.progressListener,
                    Components.interfaces);
        }
        catch(e){
            Components.utils.
                    reportError('This sometimes happens... due' +
                    'to the tab listener unregestring this first.' + e);
        }
        gBrowser.tabContainer.removeEventListener('TabSelect',
                this.tabSelectListener, false);
    }
    ,
    runTest: function(){
        
        if (this.lastOperation !== null) {
            dump('\n going to run test...');
            var testsStarted;
            var attackBasedOnOperation = this.lastOperation
            if (this.testManager === null) {
                this.testManager = getTestManager(this);
            }
            this.displayWorkInProgressState();
            testsStarted = this.testManager.runTest(attackBasedOnOperation);
            if ( testsStarted === false){
                this.displayNoTestState();
            }
        }
        else {
            dump('\ncan\'t run test');
            this.displayNoTestState();
        }
    }
    ,
    switchToPauseButton: function(){
        var caster = document.getElementById('accessme-action');
        caster.setAttribute('oncommand', 'accessMeOverlay.pause()');
        caster.setAttribute('label', 'Pause');
        
    }
    ,
    switchToStartButton: function(){
        var caster = document.getElementById('accessme-action');
        caster.setAttribute('oncommand', 'accessMeOverlay.start()');
        caster.setAttribute('label', 'Resume');
    }
    ,
    pause: function(){
        this.started = false;
        this.switchToStartButton();
    }
    ,
    clearResults: function(){
        this.testManager.clearResults();
    }
    ,
    start: function() {
        if (this.started === false) {
            this.started = true;
            this.switchToPauseButton();
            this.runTest();
        }
    }
    ,
    openHomePage: function (event){
        openUILink("http://www.securitycompass.com", event, false, true, null);
    }
    ,
    gotRequest: function (aRequest, aURI) {
        if (aURI.scheme.indexOf('http') == -1 ) {
            return; //we don't care about not http
        }
        var self = this;
        try{
            aRequest.QueryInterface(Components.interfaces.nsIHttpChannel);
        }
        catch(e) {
            alert("This page cannot be tested. This is likely due to Mozilla's bug 436836 (please see our FAQ for details). We will issue an update with the fix as soon as it is available.");
            Components.utils.reportError("AccessMeOverlay::gotRequest() " + e);
            return;
        }
        dump('\ngot request: ' + aURI.prePath + aURI.path);
        this.lastOperation = null;
        this.lastOperation = new Object();
        this.lastOperation.uid = Math.floor(Date.now() * Math.random())
        this.lastOperation.request = aRequest;
        this.lastOperation.uri = aURI;
        
        this.rawResponseListener = new StreamListener(
            function(streamListener){
                dump('\ngot raw data');
                self.lastOperation.rawResponse = streamListener.data;
                
            },
            null);
        
        var httpChannelCopy = cloneHttpChannel(aRequest);
        httpChannelCopy.asyncOpen(this.rawResponseListener, httpChannelCopy);
        
        dump('\nchanging lastOp' + aURI);
        
    }
    ,
    analyzeRequest: function (aWebProgress, aRequest, aFlag, aStatus) {
        
        var req = aRequest.QueryInterface(Components.interfaces.nsIRequest);
        var webProgress = aWebProgress.
                QueryInterface(Components.interfaces.nsIWebProgress);
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
    ,
    generatingReport: function() {
        // do nothing yet.
    }
    ,
    postTest: function() {
        // do nothing right now.
    }
    ,
    finishedTest: function() {

    }
    ,
    doneTestSet: function() {
                //do nothing right now.
        var resultState = getTestManager().resultsManager.state;
        
        if (resultState === ResultsManager.prototype.STATE_PASS) {
            this.displayPassState();
        }
        else {
            this.displayerErrorState();
        }
    }
    ,
    displayerErrorState: function(){
        var statusIcon = document.getElementById('accessme-test-status');
        statusIcon.className = 'error';
        statusIcon.label='Errors';
    }
    ,
    displayPassState: function() {
        var statusIcon = document.getElementById('accessme-test-status');
        statusIcon.className = 'pass';
        statusIcon.label='Passed';
    }
    ,
    displayWorkInProgressState: function() {
        var statusIcon = document.getElementById('accessme-test-status');
        statusIcon.className = 'wip';
        statusIcon.label= 'Testing';
    }
    ,
    displayNoTestState: function(){
        var statusIcon = document.getElementById('accessme-test-status');
        statusIcon.className = 'notest';
        statusIcon.label= 'No Tests';
    }
    ,
    showReport: function(){
        if (this.testManager != null &&
            this.testManager.resultsManager != null)
        {
            this.testManager.resultsManager.showResults(this.testManager);
        }
        else {
            var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
            prompts.alert(null, "Can't Generate Reports", "Please start Access Me and run some tests before trying to view results.");
        }
    }
};

var accessMeOverlay = new AccessMeOverlay();

window.addEventListener('load', function(){accessMeOverlay.onLoad()}, false);
window.addEventListener('unload', function(){accessMeOverlay.onUnload()}, false);

/*
Copyright 2008 Security Compass

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
 * TestManager
 * The TestManager is responsible for making sure that tests are run properly.
 * It does not actually run the tests, just preps them. The TestRunnerContainer
 * is responsible for running the tests.
 */

/**
 * TestManager ctor
 */
function TestManager(){
    
    /**
     * an array of vulnerable fields, used in heuristic testing
     */
    this.vulnerableFields = new Array();
    this.controller = null;
    this.resultsManager = null;
    this.waitingForHeuristicTests = false;
    this.testType = null;
    this.resultsStillExpected = 0;
    
}

TestManager.prototype = {
    /**
     * Runs tests on the passed Request.
     * @param aRequest a request
     * @returns whether tests started
     */
    runTest: function (aRequest) {
        
        return this.runThoroughTest(aRequest);
    }
    ,
    /**
     * This is a function that AttackRunner requires its resultsmanager to have
     */
    addSourceListener: function(sourceListener, attackRunner) {
        
    }
    ,
    /**
     * called by testRunners to report their results
     * @param browser a browser instance with the results
     * @param 
     */
    evaluate: function(browser, attackRunner) {
        
    }
    ,
    /**
     * called by a streamlistener to report the results of a source test
     * @param streamListener the streamListener that is reporting the results
     */
    evaluateSource: function(streamListener) {
        
        var resultData = streamListener.data;
        var testData = streamListener.attackRunner.testData;
        
        if (resultData.indexOf(testData.string) !== -1) {
            var vulnerableField = streamListener.attackRunner.field;
            var isVulnerablFieldAlreadyLogged = false;
            if (this.vulnerableFields.length > 0) {
                for each (var value in this.vulnerableFields) {
                    var areFormIndexsSame = value.formIndex === vulnerableField.formIndex;
                    if (areFormIndexsSame) {
                        var areFieldsSame = value.index === vulnerableField.index;
                        if (areFieldsSame) {
                            value.vulnerableChars += testData.string[testData.string.length-1];
                            isVulnerablFieldAlreadyLogged = true;
                            break;
                        }
                    }
                }
            }
            
            if (isVulnerablFieldAlreadyLogged === false) {
                streamListener.attackRunner.field.vulnerableChars = testData.string[testData.string.length-1];
                this.vulnerableFields.push(streamListener.attackRunner.field);
            }
            
        }
        
        this.controller.finishedTest();
        
        this.resultsStillExpected--;
    }
    ,
    /**
     * called when a set of tests is finished but testing is not done. E.g.
     * after a page has been tested but the browser is still in testing mode
     */
    doneTestSet: function(){
        this.controller.doneTestSet();        
    }
    ,
    /**
     * runs tests on the request.
     * @param aRequest a request
     */
    runThoroughTest: function(aRequest) {
        
        var parameters = this.analyzeRequest(aRequest);
        var testRunnerContainer = getTestRunnerContainer(1, this);
        var detectorContainerContents = getAttackParamDetectRegexContainer().getContents({});
        var httpMethodsToAttack = ['HEAD', 'SECCOMP'];
        var detectors = new Array();
        var attackThis = false;
        var rc = true; 
        
        for each (var detector in detectorContainerContents) {
            //if it's a regexp then store it as one, if not then we'll use it
            //as a string
            try {
                detectors.push(new RegExp(detector.getProperty("string"), "gim"))
            }
            catch(e){
                detectors.push(detector);
            }
            
        }
        
        testRunnerContainer.clear();
        
        if (this.resultsManager == null) {
            this.resultsManager = new ResultsManager(this.controller);
        }
        
        for (var paramName in parameters.get) {
            var attackThis = false;
            for each (var detector in detectors) {
                if ( (detector.test && detector.test(paramName)) ||
                    paramName.indexOf(detector.toString()) !== -1)
                {
                    attackThis=true;
                    break; // one is true is enough for us.
                }
            }
            
            if (attackThis === true){
                var attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_GET, parameters, paramName, this.resultsManager, "GET");
                testRunnerContainer.addTestRunner(attackRunner);
                for each (httpmethod in httpMethodsToAttack) {
                    attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_GET |  AttackRunner.prototype.ATTACK_VERB, parameters, paramName, this.resultsManager, httpmethod);
                    testRunnerContainer.addTestRunner(attackRunner);
                }
            }
        }
        for (var paramName in parameters.post) {
            var attackThis = false;
            for each (var detector in detectors) {
                if ( (detector.test && detector.test(paramName)) ||
                    paramName.indexOf(detector.toString()) !== -1)
                {
                    attackThis=true;
                    break; // one is true is enough for us.
                }
            }
            
            if (attackThis === true){
                var attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_POST, parameters, paramName, this.resultsManager, "POST");
                testRunnerContainer.addTestRunner(attackRunner);
                for each (httpmethod in httpMethodsToAttack) {
                    attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_POST | AttackRunner.prototype.ATTACK_VERB, parameters, paramName, this.resultsManager, httpmethod);
                    testRunnerContainer.addTestRunner(attackRunner);
                }
            }
        }
        
        for (var paramName in parameters.cookies) {
            var attackThis = false;
            for each (var detector in detectors) {
                if ( (detector.test && detector.test(paramName)) ||
                    paramName.indexOf(detector.toString()) !== -1)
                {
                    attackThis=true;
                    break; // one is true is enough for us.
                }
            }
            
            if (attackThis === true){
                var attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_COOKIES, parameters, paramName, this.resultsManager, parameters.request.requestMethod);
                testRunnerContainer.addTestRunner(attackRunner);
                for each (httpmethod in httpMethodsToAttack) {
                    var attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_COOKIES | AttackRunner.prototype.ATTACK_VERB, parameters, paramName, this.resultsManager, httpmethod);
                    testRunnerContainer.addTestRunner(attackRunner);
                }
            }
        }
        
        /* Whether or not there's a session we want to attack anyway */
        for each (httpmethod in httpMethodsToAttack) {
            var attackRunner = new AttackRunner(AttackRunner.prototype.ATTACK_VERB, parameters, null, this.resultsManager, httpmethod);
            testRunnerContainer.addTestRunner(attackRunner);
        }
        
        if (testRunnerContainer.testRunners.length >0 ){
            this.resultsManager.state = ResultsManager.prototype.STATE_UNKNOWN;
            testRunnerContainer.start();
            return true;
        }
        else {
            return false;
        }
    }
    ,
    /**
     * this is called by the testRunnerContainer when all tests are definitely
     * complete.
     */
    doneTesting: function() {
        dump('\nTestManager::DoneTesting is called.');
        var self = this;
        function checkAgain() {
            self.doneTesting();
        }

        if (this.resultsManager.allResultsLogged === false){
            dump('\nnot done yet...');
            window.setTimeout(checkAgain, 100);
            //Components.utils.reportError('results not all logged yet');
            return
        }
        dump('\ndone now.')
        getTestRunnerContainer().clearWorkTabs();
        this.controller.doneTestSet();
        
    }
    ,
    /**
     * postReport is called after the report is generated
     */
    postReport: function() {
        this.controller.postTest();
    }
    ,
    /**
     * clears the object and makes it ready for use for a new set of tests.
     */
    clear: function() {
        this.resultsManager = null;
        
        this.vulnerableFields.splice(0,this.vulnerableFields.length);
        
    }
    ,
    /**
     * Called when an AttackRunner cannot test because it is in an error state.
     */
    cannotRunTests: function() {
        getTestRunnerContainer().stop();
        getTestRunnerContainer().clearWorkTabs();
        
        var resultsManager = null;
        if (this.resultsManager) {
            resultsManager = this.resultsManager;
        }
        else {
            resultsManager = new ResultsManager(this.controller);
        }
        resultsManager.showResults(this, "There was an error while testing this site. This was likely due to <a href='https://bugzilla.mozilla.org/show_bug.cgi?id=420025'>Mozilla bug 420025</a> which only affects Fx2. We're working on making Access Mework with FireFox 3. Please help us track this bug by either <a href='mailto:bugs@securitycompass.com?subject=Triggered bug 420025'>emailing us</a> the url to this site or commenting on <a href='https://bugzilla.mozilla.org/show_bug.cgi?id=420025'>the bug</a>. We apologize for the inconvenience.");
        this.controller.postTest();
        
        Components.utils.reportError(
                'The loading of this page in a work tab as not successful: ' +
                getMainHTMLDoc().documentURI);
    }
    ,
    /**
     * Analyzes a request and returns all the parameters and cookies
     * related to it
     * @todo Shouldn't be using objects as hashes here. this is a case where
     *  receiving prototype as a key could screw a lot of things up.
     */
    analyzeRequest:function(operation) {
        var aRequest = operation.request;
        var getParameters = operation.uri.path.indexOf("?") !== -1 ?
                operation.uri.path.substr(operation.uri.path.indexOf("?")+1).split("&") :
                (new Array());
        var rc = new Object();
        rc.request = operation.request;
        rc.lastOperation=operation;
        
        rc.get = new Object();  
        
        for each (var param in getParameters) {
            var [key, val] = param.split('=');
            rc.get[key] = val;
        }
        var uploadChannel = null;
        try {
            uploadChannel = aRequest.QueryInterface(Components.interfaces.
                    nsIUploadChannel);
            if (uploadChannel && uploadChannel.uploadStream) {
                var seekableStream = uploadChannel.uploadStream.QueryInterface(Components.interfaces.nsISeekableStream)
                seekableStream.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);
                if (uploadChannel.uploadStream) {
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
                    dump('\npostStream' + postStream);
                    var postParameters = postStream.split("\r\n\r\n")[1].split("&");
                    dump('\npostParameters' + postParameters);
                    rc.post = new Object();
                    for each(var param in postParameters) {
                        var [key, val] = param.split('=');
                        rc.post[key] = val;
                    }
                }
            }
        }
        catch (e) {
            // we don't care if it's not an upload channel just need to know
            // if there's POST stuff or not.
            // aparently not.
            uploadChannel = null;
            Components.utils.reportError(e);
        }
        
        
        var httpChannel = aRequest.QueryInterface(Components.interfaces.nsIHttpChannel);
        var requestCookies = new Array();
        var responseCookies = new Array();
        try {
            requestCookies= httpChannel.getRequestHeader("Cookie").split("; ");
        }
        catch (e){
            //likely no cookies. That's ok.
            Components.utils.reportError("likely no cookies. That's ok." + e); //just in case.
        }
        
        try {
            responseCookies = httpChannel.getResponseHeader("Set-Cookie").split("; ");
        }
        catch (e){
            //likely no cookies. That's ok.
            Components.utils.reportError("likely no cookies. That's ok." + e); //just in case.
        }
        
        //according to the Netscape Cookie and rfc 2109 cookie names are ;
        //seperated. Ofcourse sites can also use other chars which only they
        //understand. I'm looking at you, Google and your : second delimeter.
        if ((requestCookies.length +  responseCookies.length) > 0) {
            rc.cookies = new Object();
            for each (var cookie in requestCookies.concat(responseCookies)){
                var [name, value] = cookie.split('=');
                rc.cookies[name] = value;
            }
        }
        
        
        return rc;
    }
    ,
    clearResults: function(){
        this.resultsManager.clearResults();
    }
}

/**
 * The getInstance method for the TestManager singleton
 */
function getTestManager(controller, resultsManager) {
    if (typeof(xssme__testmanager__) == 'undefined' ||
        !xssme__testmanager__)
    {
        xssme__testmanager__  = new TestManager();
    }
    // @todo: there has to be a better way...
    if (controller) {
        xssme__testmanager__.controller = controller;
    }
    
    if (resultsManager) {
        xssme__testmanager__.resultsManager = resultsManager;
    }
    
    return xssme__testmanager__;
}


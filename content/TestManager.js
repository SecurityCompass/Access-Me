/*
Copyright 2008 Security Compass

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
     */
    runTest: function (aRequest) {
        
        this.runThoroughTest(aRequest);
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
     * Runs the heuristic tests.
     * @param testType the type of test.
     * @param fieldsToTest the fields to test.
     */
    runHeuristicTest: function(testType, fieldsToTest) {
        
        var testChars = this.controller.getHeuristicTestChars();
        var self = this;
        var testRunnerContainer = getTestRunnerContainer();
        
        testRunnerContainer.clear();
        
        for each (var c in testChars) {
            
            for each (var field in fieldsToTest) {
                
                var testRunner = new AttackRunner();
                
                var testData = new Object();
                testData.string = testRunner.uniqueID.toString() + c.toString();
                
                this.resultsStillExpected++;
                
                testRunnerContainer.addTestRunner(testRunner,
                        null,
                        field.formIndex,
                        field,
                        testData,
                        self);
                
            }
        }
        
        getTestRunnerContainer(getMainWindow().document.
                getElementById('content').mTabs.length, self);
        
        if (testRunnerContainer.keepChecking === false) {
            testRunnerContainer.keepChecking = true;
        }
        
        testRunnerContainer.start();
        
    }
    ,
    /**
     * runs tests on the request.
     * @param aRequest a request
     */
    runThoroughTest: function(aRequest) {
        
        var parameters = this.analyzeRequest(aRequest);
        
        for (var paramName in parameters.get) {
            var attackRunner = new AttackRunner(AttackRunner.ATTACK_GET, parameters, paramName);
            //add to test Runner Container
        }
        
        for (var paramName in parameters.post) {
            var attackRunner = new AttackRunner(AttackRunner.ATTACK_POST, parameters, paramName);
            //add to test Runner Container
        }
        
        for (var paramName in parameters.cookies) {
            var attackRunner = new AttackRunner(AttackRunner.ATTACK_COOKIES, parameters, paramName);
            //add to test Runner Container
        }
        
        //Start TestRunnerContainer.
        
    }
    ,
    /**
     * this is called by the testRunnerContainer when all tests are definitely
     * complete.
     */
    doneTesting: function() {
        var self = this;
        function checkAgain() {
            self.doneTesting();
        }
        if (this.waitingForHeuristicTests === true) {
        
            if (this.resultsStillExpected === 0) {
                this.waitingForHeuristicTests = false;
                if (this.vulnerableFields.length > 0) {
                    this.waitingForHeuristicTests = false;
                    function doRunThoroughTests(){
                        getTestRunnerContainer().clearWorkTabs();
                        self.controller.warningDialog.startThoroughTesting(self.vulnerableFields.length, self.testType);
                        self.runThoroughTest(self.testType, self.vulnerableFields);
                    }
                    window.setTimeout(doRunThoroughTests, 0);
                }
                else {
                    this.resultsManager = new ResultsManager(self.controller)
                    this.resultsManager.showResults(this);
                    getTestRunnerContainer().clearWorkTabs();
                    this.controller.postTest();
                }
            }
            else {
                window.setTimeout(checkAgain, 1);
            }
            
        }
        else if (this.controller) {
            if (this.resultsManager.allResultsLogged === false){
                dump('\nnot done yet...');
                window.setTimeout(checkAgain, 100);
                //Components.utils.reportError('results not all logged yet');
                return
            }
            dump('\ndone now.')
            getTestRunnerContainer().clearWorkTabs();
            this.controller.generatingReport();
            this.resultsManager.showResults(this);
            
        }
        
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
     */
    analyzeRequest:function(aRequest) {
        var strURL = aRequest.name;
        var getParameters = strURL.substr(strURL.indexOf("?")).split("&");
        var rc = new Object();
        rc.get = new Object();        
        
        for each (var param in getParameters) {
            var [key, val] = param.split('=');
            rc.get[key] = val;
        }
        var uploadChannel = null;
        try {
            uploadChannel = aRequest.QueryInterface(Components.interfaces.
                    nsIUploadChannel);
            if (uploadChannel.uploadStream) {
                rc.post = new Object();
                var postStream= "";
                while (true) {
                    var str = uploadChannel.uploadStream.read(512);
                    if (str) {
                        postStream += str;
                    }
                    else {
                        break;
                    }
                }
                var postParameters = postStream.split="&";
                for each(var param in postParameters) {
                    var [key, val] = param.split('=');
                    rc.post[key] = val;
                }
            }
        }
        catch (e) {
            // we don't care if it's not an upload channel just need to know
            // if there's POST stuff or not.
            // aparently not.
            uploadChannel = null;
        }
        
        
        var strURLWithoutProtocol = strURL.substr(7);
        var strRequstDomain = strURLWithoutProtocol.substring(0,
                strURLWithoutProtocol.indexOf('/'));
        
        var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
                        .getService(Components.interfaces.nsICookieManager);
        var iter = cookieManager.enumerator;
        
        while (iter.hasMoreElements()){
            var cookie = iter.getNext().QueryInterface(Components.interfaces.nsICookie);

            if (cookie) {
                /* below could be done with regex... /.*\.?+strRequstDomain$/
                  but creating a regex object N times might be a pain.
                  Oh well. */
                var indexOfDomain = strRequstDomain.lastIndexOf(cookie.host);
                if (indexOfDomain != -1) {
                    var isTail = (indexOfDomain == 0 ||
                            strRequstDomain.charAt(indexOfDomain) === '.')
                    if (isTail) {
                        if (rc.cookies === undefined) {
                            rc.cookies = new Object();
                        }
                        rc.cookies[cookie.name] = cookie.value;
                    }
                }
            }
        }
        return rc;
    }
}

/**
 * The getInstance method for the TestManager singleton
 */
function getTestManager(controller) {
    if (typeof(xssme__testmanager__) == 'undefined' ||
        !xssme__testmanager__)
    {
        xssme__testmanager__  = new TestManager();
    }
    // @todo: there has to be a better way...
    if (controller) {
        xssme__testmanager__.controller = controller;
    }
    
    return xssme__testmanager__;
}


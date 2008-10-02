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
 * ResultsManager.js
 * @requires FieldResult.js
 * @requires Result.js
 * @requires AttackHttpResponseObserver
 */

/**
 * The Results Manager is 
 */
function ResultsManager(extensionManager) {
    this.evaluators = new Array();
    this.errors = 0
    this.warnings = 0
    this.pass = 0
    this.attacks = new Array();
    this.httpresponseObservers = new Array(); //parallel to this.attacks
    this.sourceListeners = new Array(); //members are asynchronous.
    this.sourceEvaluators = new Array();
    this.extensionManager = extensionManager;
    this.allResultsLogged = false;
    //this.testPageURL = getMainWindow().document.getElementById('content').webNavigation.currentURI.spec;
    this.results = "";
    
    /**
     *  This is a dynamically allocated 2d array. The first dimension is the
     *  index of the form. The second dimension is the index of the field that
     *  is being tested
     */
    this.fields = new Object();
    
    //this.addSourceEvaluator(fail);
    //this.addSourceEvaluator(checkSrcForErrorString);
    //this.addSourceEvaluator(checkSrcForPassString);
    this.addSourceEvaluator(checkForServerResponseCode);
    this.addSourceEvaluator(checkStringSimilarity);

    /**
     * the current state of the results.
     * This is used to keep track 
     */
    this.state = this.STATE_UNKNOWN;
    

}

ResultsManager.prototype = {
    addResults: function(resultsWrapper){
        if (resultsWrapper.results.length === 0) {
            return;
        }
        var parameters = resultsWrapper.parameters;
        var urlTested = parameters.request.URI.prePath +
                parameters.request.URI.path.
                substring(0, parameters.request.URI.path.indexOf("?"));
        /* if there is no field array for this form then create it*/
        if (this.fields[urlTested] === undefined) {
            this.fields[urlTested] = new Object(); 
        }
        
        if (this.fields[urlTested][resultsWrapper.nameParamToAttack] === undefined) {
            this.fields[urlTested][resultsWrapper.nameParamToAttack] = new Object();
        }
        if (this.fields[urlTested][resultsWrapper.nameParamToAttack][resultsWrapper.results[0].attackRunner.uniqueID] === undefined) {
            this.fields[urlTested][resultsWrapper.nameParamToAttack][resultsWrapper.results[0].attackRunner.uniqueID] = new FieldResult(parameters, resultsWrapper.nameParamToAttack);
        }
        this.fields[urlTested][resultsWrapper.nameParamToAttack][resultsWrapper.results[0].attackRunner.uniqueID].addResults(resultsWrapper.results);
        var noErrors = true;
        
        for each(var r in resultsWrapper.results){
            if (r.type !== RESULT_TYPE_PASS){
                noErrors = false;
                this.state = this.STATE_ERROR;
                break;
            }
        }
        if (noErrors && this.state !== this.STATE_ERROR){
            this.state = this.STATE_PASS;
        }
        
        this.extensionManager.finishedTest();
        
    }
    ,
    evaluate: function(browser, attackRunner){
        
        this.attacks.splice(this.attacks.indexOf(attackRunner), 1);
        
        for each (var evaluator in this.evaluators){
            
            var results = evaluator(browser);
            
            dump('resultsManager::evaluate attackRunner::testData'+attackRunner.testData.length+'\n');
            for each(var result in results) {
                result.testData = attackRunner.testData;
                result.fieldIndex = attackRunner.fieldIndex;
                result.formIndex = attackRunner.formIndex;
            }
            var resultsWrapper = new Object();
            resultsWrapper.results = results;
            resultsWrapper.field = attackRunner.field;
            
            this.addResults(resultsWrapper);
            
        }
        
    }
    ,  
    addEvaluator: function(evaluator){
        this.evaluators.push(evaluator);
    }
    ,
    hasResults: function(){
        return (this.errors.length !==  0 || 
                this.warnings.length !== 0 || 
                this.pass.length !== 0);
    }
    ,
    getNumTestsRun: function(){
        var results = [this.errors, this.warnings , this.pass];
        var rv = 0;
        
        for each (var resultContainer in results){
            for each (var resultLevel in resultContainer){
                for each (var result in resultLevel){
                    if (result !== null && result !== undefined){
                        rv++;
                    }
                }
            }
        }
        
        return rv;
        
    }
    ,
    getNumTestsPassed: function(){
        var rv = 0;
        for each (var resultLevel in this.pass){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    getNumTestsWarned: function(){
        var rv = 0;
        for each (var resultLevel in this.warnings){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    getNumTestsFailed: function(){
        var rv = 0;
        for each (var resultLevel in this.errors){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    sortResults: function (){
        var errors = new Array();
        var errorsWithWarnings = new Array();
        var errorsWithWarningsAndPasses = new Array();
        var warnings = new Array();
        var warningsWithPasses = new Array();
        var passes = new Array();
        for each (var url in this.fields){
            for each(var attack in url ) {
                for each (var fieldResult in attack) {
                    if (fieldResult.state & fieldresult_has_error &&
                        !(fieldResult.state & fieldresult_has_warn ||
                          fieldResult.state & fieldresult_has_pass))
                    {
                        errors.push(fieldResult);
                    }
                    else if (fieldResult.state & fieldresult_has_error &&
                             fieldResult.state & fieldresult_has_warn &&
                             !(fieldResult.state & fieldresult_has_pass))
                    {
                        errorsWithWarnings.push(fieldResult);
                    }
                    else if (fieldResult.state & fieldresult_has_error &&
                             fieldResult.state & fieldresult_has_warn &&
                             fieldResult.state & fieldresult_has_pass)
                    {
                        errorsWithWarningsAndPasses.push(fieldResult);
                    }
                    else if (fieldResult.state & fieldresult_has_warn &&
                             !(fieldResult.state & fieldresult_has_pass))
                    {
                        warnings.push(fieldResult);
                    }
                    else if (fieldResult.state & fieldresult_has_warn &&
                             fieldResult.state & fieldresult_has_pass)
                    {
                        warningsWithPasses.push(fieldResult);
                    }
                    else {
                        passes.push(fieldResult);
                }   }
            }
        }
        
        return errors.concat(errorsWithWarnings, errorsWithWarningsAndPasses,
                warnings, warningsWithPasses, passes);
        
    }
    ,
    count: function(){
        var numTestsRun = 0; 
        var numPasses = 0; 
        var numWarnings = 0;
        var numFailes = 0;
        for each (var form in this.fields) {
            for each (var attack in form) {
                for each (var fieldResult in attack){
                    numTestsRun++;
                    switch(fieldResult.getResultState().state) {
                        case RESULT_TYPE_PASS:
                            numPasses++;
                            break;
                        case RESULT_TYPE_WARNING:
                            numWarnings++;
                            break;
                        case RESULT_TYPE_ERROR:
                            numFailes++;
                            break;
                    }
                }
            }
        }
        return [numTestsRun, numFailes, numWarnings, numPasses];
    }
    ,
    registerAttack:function(attackRunner) {
        this.attacks.push(attackRunner);
    }
    ,
    addObserver: function(attackRunner, attackHttpResponseObserver){
        
        /*
         * This will cause problems if the attackRunner 
         */
        this.httpresponseObservers[this.attacks.indexOf(attackRunner)] = 
                attackHttpResponseObserver;
    }
    ,
    /**
     * This will cause problems if the attackRunner has been evaluated before
     * this is called. However it evaluate is called on (or after) 
     * DOMContentLoaded which should happen after a response code has been 
     * received.
     */
    gotChannelForAttackRunner: function( nsiHttpChannel, attackHttpResponseObserver){
        var attackRunner = attackHttpResponseObserver.attackRunner;
        var observerService = Components.
                classes['@mozilla.org/observer-service;1'].
                getService(Components.interfaces.nsIObserverService);
        var results = checkForServerResponseCode(nsiHttpChannel)
        if (results != null){
            dump('resultmanager::gotChannelForAttackRunner results: ' + results + '\n');
            for each(var result in results){
                result.testData = attackRunner.testData;
                result.field = attackRunner.field;
            }
            var resultsWrapper = new Object();
            resultsWrapper.results = results;
            resultsWrapper.field = attackRunner.field;
            
            observerService.removeObserver(attackHttpResponseObserver, 
                    AttackHttpResponseObserver_topic);
                    
            this.addResults(resultsWrapper);
            
        }
        else {
            Components.utils.reportError('Failed to get http status code.');
        }
        dump('resultmanager::gotChannelForAttackRunner done.\n');
    }
    ,
    /**
     * 
     */
    addSourceListener:function(sourceListener, attackRunner){
        this.sourceListeners.push(sourceListener);
    }
    ,
    addSourceEvaluator: function(sourceEvaluator){
        this.sourceEvaluators.push(sourceEvaluator);
    }
    ,
    evaluateSource: function(streamListener){
        
        var attackRunner = streamListener.attackRunner;
        var qIndex;
        for each(var sourceEvaluator in this.sourceEvaluators){
            var results = sourceEvaluator(streamListener);
            for each (var result in results) {
                qIndex = attackRunner.parameters.request.URI.path.indexOf("?");
                result.urlTested = attackRunner.parameters.request.URI.prePath +
                        attackRunner.parameters.request.URI.path.
                        substring(0, qIndex === -1 ?
                                attackRunner.parameters.request.URI.path.length :
                                qIndex);
                result.parameters = attackRunner.parameters;
                result.nameParamToAttack = attackRunner.nameParamToAttack;
                result.typeOfAttack = attackRunner.typeOfAttack;
                result.attackRunner = attackRunner;
                result.evaluator = sourceEvaluator;

            }
            var resultsWrapper = new Object();
            resultsWrapper.results = results;
            resultsWrapper.parameters = attackRunner.parameters;
            resultsWrapper.nameParamToAttack = attackRunner.nameParamToAttack;
            this.addResults(resultsWrapper);
        }
        var index = this.sourceListeners.indexOf(streamListener);
        this.sourceListeners.splice(index, 1);
        if (this.sourceListeners.length === 0 &&
            getTestRunnerContainer().testRunners.length === 0)
        {
            dump('\nall results now logged');
            this.allResultsLogged = true;
            getTestManager().doneTesting();
        }
        getTestRunnerContainer().freeTab(attackRunner.tabIndex);
        
    }
    ,
    STATE_UNKNOWN: 0
    ,
    STATE_ERROR: RESULT_TYPE_ERROR
    ,
    STATE_PASS: RESULT_TYPE_PASS
    ,
    /**
     * clears all the results
     */
    clearResults: function() {
        this.fields = null;
        this.fields = new Object();
    }
    ,
    hasResults: function() {
        return this.fields.length > 0;
    }
};


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
 * accessmeevaluators.js
 * This file holds a number of JS evaluators 
 * @require Results.js
 * @require ErrorStringContainer.js
 */


/**
 * Checks the source of a page for stored error strings
 */
function checkSrcForPassString(streamListener) {

    var passStringContainer = getPassStringContainer();
    var results = new Array();
    var doc = streamListener.data;
    var stringEncoder = getHTMLStringEncoder();
    dump("\nStart freeze...");
    for each (var passes in passStringContainer.getStrings()){
        var result;
        try {
            var regexp = new RegExp(passes.string);
            if (regexp.test(doc)){
                result = new Result(RESULT_TYPE_PASS, 100, "Pass string found: '" + stringEncoder.encodeString(passes.string) + "'");
            }
            else {
                result = new Result(RESULT_TYPE_ERROR, 100, "Pass string not found: '" + stringEncoder.encodeString(passes.string) + "'");
            }
        }
        catch (e){
            if (doc.indexOf(passes.string) !== -1) {
                result = new Result(RESULT_TYPE_PASS, 100, "Pass string found: '" + stringEncoder.encodeString(passes.string) + "'");
            }
            else {
                result = new Result(RESULT_TYPE_ERROR, 100, "Pass string not found: '" + stringEncoder.encodeString(passes.string) + "'");
            }
        }
        
        results.push(result);
    }
    dump("\nEnd freeze...");

    
    return results;
}

/**
 * Checks the source of a page for stored error strings
 */
function checkSrcForErrorString(streamListener) {

    var errorContainer = getErrorStringContainer();
    var results = new Array();
    var doc = streamListener.data;
    var stringEncoder = getHTMLStringEncoder();
    dump("\nStart freeze...");
    for each (var error in errorContainer.getStrings()){
        var result;
        try {
            var regexp = new RegExp(error.string);
            if (regexp.test(doc)){
                result = new Result(RESULT_TYPE_ERROR, 100, "Error string found: '" + stringEncoder.encodeString(error.string) + "'");
            }
            else {
                result = new Result(RESULT_TYPE_PASS, 100, "Error string not found: '" + stringEncoder.encodeString(error.string) + "'");
            }
        }
        catch (e){
            if (doc.indexOf(error.string) !== -1) {
                result = new Result(RESULT_TYPE_ERROR, 100, "Error string found: '" + stringEncoder.encodeString(error.string) + "'");
            }
            else {
                result = new Result(RESULT_TYPE_PASS, 100, "Error string not found: '" + stringEncoder.encodeString(error.string) + "'");
            }
        }
        
        results.push(result);
    }
    dump("\nEnd freeze...");

    
    return results;
}

function checkForServerResponseCode(streamListener){
    var stringEncoder = getHTMLStringEncoder();
    var nsiHttpChannel = streamListener.attackRunner.channel.QueryInterface(Components.interfaces.nsIHttpChannel);
    try{
        if ((nsiHttpChannel.responseStatus === undefined || nsiHttpChannel.responseStatus === null)){
            return null;   
        }
        else {
            var result;
            var responseCode = nsiHttpChannel.responseStatus;
            var displayString = stringEncoder.encodeString(responseCode.toString()) + " " +
                    stringEncoder.encodeString(nsiHttpChannel.responseStatusText);
            if (responseCode == 200) {
                result = new Result(RESULT_TYPE_WARNING, 100, "Got access to a resource that should be protected. Server response code: " + displayString + ". ");
            }
            else {
                result = new Result(RESULT_TYPE_PASS, 100, "Did not access protected resource. Server response code: " + displayString + ". ");
            }
        }
        return [result];
    }
    catch(err){
        Components.utils.reportError(err);
        return false;
    }
}

/**
 * Check for string similarity source evaluator.
 * This implementation use's dice's coefficent. Alternative options could be
 * Jaccard Similarity/Jaccard/Tanimoto Coefficient or the q-gram
 * Great information at http://www.dcs.shef.ac.uk/~sam/stringmetrics.html
 */
function checkStringSimilarity(streamListener){
    var attackedTokenized = streamListener.data.replace("<", " ", "gmi").
            replace(">", " ", "gmi").split(/\W/);
    var origTokenized = streamListener.attackRunner.parameters.lastOperation.
            rawResponse.replace("<", " ", "gmi").replace(">", " ", "gmi").
            split(/\W/);
    
    var uniqueAttackedTokens = new Object(), numAttackedTokensCount = 0;
    var uniqueOriginalTokens = new Object(), numOrigTokensCount = 0;
    var allTokens = new Object(), commonCount=0;
    var prefService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch('extensions.accessme.');
    var pref = prefBranch.getIntPref('similarityRating')/100000;
    var rv = null;

    
    for each (var token in origTokenized) {
        uniqueOriginalTokens[token] = 1;
        allTokens[token] = 1;
    }
    
    for each (var token in attackedTokenized) {
        uniqueAttackedTokens[token] = 1;
        allTokens[token] = 1;
    }
    
    for (var token in allTokens) {
        if (uniqueAttackedTokens[token] === 1 &&
            uniqueOriginalTokens[token] === 1)
        {
            commonCount++
        }
    }
    
    for (var token in uniqueOriginalTokens){
        numOrigTokensCount++;
    }
    
    for (var token in uniqueAttackedTokens){
        numAttackedTokensCount++;
    }
    
    
    var diceCoefficient = (2*commonCount) /
            (numAttackedTokensCount + numOrigTokensCount);
    
    
    if (diceCoefficient >= pref) {
        rv = new Result(RESULT_TYPE_ERROR, 100, "The attacked page is dangerously similar to the original page. It is " + parseInt(diceCoefficient*100000)/1000 + "% similar. ");
    }
    else {
        rv = new Result(RESULT_TYPE_PASS, 100, "The attacked page is not very similar to the original page. It is " + parseInt(diceCoefficient*100000)/1000  + "% similar. ");
    }
    
    return [rv];
}

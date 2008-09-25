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
 * AttackRunner.js
 * @requires ResultsManager
 * @requires TabManager
 * @requires AttackHttpResponseObserver
 */

/**
 * @class AttackRunner
 */
function AttackRunner(typeOfAttack, parameters, nameParamToAttack,
        resultsManager, method)
{

    this.className = "AttackRunner";
    
    /**
     * a reference to the nsIHttpChannel being used by this
     */
    this.channel = null;
    
    /**
     * uniqueID is important for heuristic tests which need a random string in
     * order to find the char they sent
     */
    this.uniqueID = Math.floor(Date.now() * Math.random());
    /**
     * type of attack to do
     */
    this.typeOfAttack = typeOfAttack;
    /**
     * the parameters for the connection
     */
    this.parameters = parameters;
    
    /**
     * the param to attack
     */
    this.nameParamToAttack = nameParamToAttack;
    
    /**
     * the results manager
     */
    this.resultsManager = resultsManager;
    
    /**
     * cookie modifying Observer
     */
    this.cookieModifyingObserver = null;
    
    /**
     * the http method to use (Get/Post/Head/etc)
     */
    this.httpMethod = method;
    
    
    this.fieldIndex = -1;
    this.field = new Object();
    this.field.index = -1;
    this.field.name = this.nameParamToAttack;
    this.field.formIndex = -1;
    this.field.formName = this.typeOfAttack;
    
}

AttackRunner.prototype = {
    /**
     * When the attack will affect GET params
     */
    ATTACK_GET: 1<<     0
    ,
    /**
     * When the attack will affect POST params
     */
    ATTACK_POST: 1<<    1
    ,
    /**
     * When the attack will affect cookie params
     */
    ATTACK_COOKIES: 1<< 2
    ,
    /**
     * Attack is based on sending wrong and/or inaccurate HTTP Verbs
     */
    ATTACK_VERB: 1<<    3
    ,
    submitForm: function(browser, formIndex){
        var forms = browser.webNavigation.document.forms;
        var formFound = false;
        for (var i = 0; i < forms.length && !formFound; i++){
            if (i == formIndex){
                dump('submitting form ... ' + i + ' ' + (i == formIndex) +
                        '\n');
                if (forms[i].target) forms[i].target = null;
                forms[i].submit();
                formFound = true;
            }
            //debug code..
            else {
                dump('this form is not it... ' + i + ' ' +
                     (i == formIndex) + '\n');  
            }
        }
        return formFound;
    }
    ,
    do_test: function()
    {
        var self = this; //make sure we always have a reference to this object
        var formData = null;
                
        dump('\ndoing source test...');
        this.do_source_test();
        
    }
    ,
    do_source_test:function() {
        var httpChannel = this.parameters.request.
                QueryInterface(Components.interfaces.nsIHttpChannel);
        var self = this;
        var streamListener = new StreamListener(
                function(sl){
                    self.resultsManager.evaluateSource(sl);
                },
                this);
        this.resultsManager.addSourceListener(streamListener);

        var ioService = Components.classes['@mozilla.org/network/io-service;1']
                .getService(Components.interfaces.nsIIOService);
        
        var moddedURI = null;
        var uri = null;
        var postStream = null;
        var cookies = null;
        var typeOfAttack = this.typeOfAttack;
        
        /* setup the attack.
         * attack type is based on a combination of bitwise ors so you can have
         * a POST and VERB attack. THis is also why I don't else here.
         */
        if (this.typeOfAttack & this.ATTACK_GET) {
                moddedURI = httpChannel.URI.prePath + httpChannel.URI.path.substring(0, (httpChannel.URI.path.indexOf('?') == -1 ? httpChannel.URI.path.length: httpChannel.URI.path.indexOf('?')));
                for (var key in this.parameters.get) {
                    if (key == this.nameParamToAttack) {
                        break;
                    }
                    moddedURI += key + "=" + this.parameters.get[key] + "&";
                }
        }
        if (this.tyepOfAttack & this.ATTACK_POST) {
                moddedURI = httpChannel.URI.prePath + httpChannel.URI.path.substring(0, (httpChannel.URI.path.indexOf('?') == -1 ? httpChannel.URI.path.length: httpChannel.URI.path.indexOf('?')));
                for (var key in this.parameters.post) {
                    if (key == this.nameParamToAttack) {
                        break;
                    }
                    moddedURI += key + "=" + this.parameters.get[key] + "&";
                }
        }
        if (this.typeOfAttack & this.ATTACK_COOKIES) {
            /* @todo this setup should be rewritten to use bitwise attack type
             * better
             */
                if (this.parameters.request.requestMethod == 'POST') {
                    postStream = Components.
                            classes['@mozilla.org/io/string-input-stream;1'].
                            createInstance(Components.interfaces.
                            nsIStringInputStream);
                    var modifiedPost = "";
                    
                    for (var key in this.parameters.post) {
                        modifiedPost += key + "=" + this.parameters.post[key] + "&";
                    }
                    postStream.setData(modifiedPost, modifiedPost.length);
                    
                }
                cookies ="";
                for (var key in this.parameters.cookies) {
                    if (key == this.nameParamToAttack) {
                        continue;
                    }
                    cookies += key + "=" +this.parameters.cookies[key] + "; ";
                }
        }
        if (this.typeOfAttack & this.ATTACK_VERB) {
            
        }
        
        if (moddedURI !== null) {
            uri = ioService.newURI(moddedURI , null, null);
        }

        this.channel = ioService.newChannelFromURI((uri?uri:httpChannel.URI)).
                QueryInterface(Components.interfaces.nsIHttpChannel);
        
        this.channel.referrer = httpChannel.referrer;
        
        this.cookieModifyingObserver =
                new SecCompObserver('http-on-modify-request', ModifyCookies);
        this.responseCookieRemovingObserver = new
                SecCompObserver('http-on-examine-response',
                clearResponseCookieHeaders);
                
        var observerService = Components.
                classes["@mozilla.org/observer-service;1"].
                getService(Components.interfaces.nsIObserverService);
                
        observerService.addObserver(this.cookieModifyingObserver,
                this.cookieModifyingObserver.topic, false);
        observerService.addObserver(this.responseCookieRemovingObserver,
                this.responseCookieRemovingObserver.topic, false);
                
        this.channel.requestMethod = this.httpMethod;
        
        this.channel.asyncOpen(streamListener, null);
        
        
        /**
         * used to modify the request's cookies.
         */
        function ModifyCookies (subject, topic, data) {
            var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            dump("\ncomparing channel to subject" + self.channel + " " + httpChannel);
            if ( httpChannel && (httpChannel == self.channel) ) {
                if (cookies === null)
                    cookies = httpChannel.getRequestHeader("Cookie")
                
                // This seems silly but it's actually what lets us do parallel
                // requests since we need to screw around with cookies and
                // cookies are (usually) shared from a central store. And we
                // want to make sure that the cookies are the same as in the
                // previous request.
                dump('\ngoing to set cookies: ' + cookies);
                self.channel.setRequestHeader("cookie", cookies, false);
                observerService.removeObserver(self.cookieModifyingObserver,
                        self.cookieModifyingObserver.topic);
            }
        }
        
        /**
         * used to modify the response's cookies
         */
        function clearResponseCookieHeaders(subject, topic, data) {
            var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            dump("\ncomparing channel to subject" + self.channel + " " + httpChannel);
            if (httpChannel && (httpChannel == self.channel)) {
                httpChannel.setResponseHeader("set-cookie", "", false);
                observerService.removeObserver(self.responseCookieRemovingObserver, self.responseCookieRemovingObserver.topic);
            }
        }
    }
}

function callEvaluate(browser, attackRunner, resultsManager) {
    var results = resultsManager.evaluate(browser, attackRunner);
    for each (result in results){
        tabManager.addFieldData(result);
    }
    getTestRunnerContainer().freeTab(attackRunner.tabIndex);
}
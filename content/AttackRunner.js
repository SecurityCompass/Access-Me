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
        resultsManager)
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
    
    this.fieldIndex = -1;
    this.field = new Object();
    this.field.index = -1;
    this.field.name = this.nameParamToAttack;
    this.field.formIndex = -1;
    this.field.formName = this.typeOfAttack;
    
}

AttackRunner.prototype = {
    ATTACK_GET: 1
    ,
    ATTACK_POST: 2
    ,
    ATTACK_COOKIES: 3
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
        var mainBrowser = getMainWindow().getBrowser();
        var currentTab = mainBrowser.selectedTab;

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
        var streamListener = new StreamListener(self.resultsManager, this);
        this.resultsManager.addSourceListener(streamListener);

        // the IO service
        var ioService = Components.classes['@mozilla.org/network/io-service;1']
                .getService(Components.interfaces.nsIIOService);
        var uri = null;
        var postStream = null;
        var cookies = null;
        
        //setup
        switch (this.typeOfAttack) {
            case this.ATTACK_GET:
                var moddedURI = httpChannel.URI.prePath +
                        httpChannel.URI.path.substring(0,
                        httpChannel.URI.path.indexOf('?'));
                for (var key in this.parameters.get) {
                    if (key == this.nameParamToAttack) {
                        break;
                    }
                    moddedURI = key + "=" + this.parameters.get[key] + "&";
                }
                uri = ioService.newURI(moddedURI , null, null);
                break;
            case this.ATTACK_POST:
                postStream = Components.
                    classes['@mozilla.org/io/string-input-stream;1'].
                    createInstance(Components.interfaces.nsIStringInputStream);
                var modifiedPost = "";
                
                for (var key in this.parameters.post) {
                    if (key == this.nameParamToAttack) {
                        continue;
                    }
                    modifiedPost = key + "=" + this.parameters.post[key] + "&";
                }
                
                postStream.setData(modifiedPost, modifiedPost.length);
                
                break;
            case this.ATTACK_COOKIES:
                cookies ="";
                for (var key in this.parameters.cookies) {
                    if (key == this.nameParamToAttack) {
                        continue;
                    }
                    cookies += key + "=" +this.parameters.cookies[key] + "; ";
                }
                break;
            default:
                Components.utils.reportError('Unknown type of attack');
                //@todo reporting is probably not enough here.
                break;
        }
        
        this.channel = ioService.newChannelFromURI((uri?uri:httpChannel.URI)).
                QueryInterface(Components.interfaces.nsIHttpChannel);
        
        this.channel.referrer = httpChannel.referrer;
        
        this.cookieModifyingObserver =
                new SecCompObserver('http-on-modify-request', ModifyCookies);
                
        var observerService = Components.
                classes["@mozilla.org/observer-service;1"].
                getService(Components.interfaces.nsIObserverService);
                
        observerService.addObserver(this.cookieModifyingObserver,
                this.cookieModifyingObserver.topic, false);
        
        if (postStream){
            this.channel.QueryInterface(Components.interfaces.nsIUploadChannel).
                    setUploadStream(postStream, 
                    'application/x-www-form-urlencoded', -1);
            this.channel.requestMethod = 'POST';
        }
        
        this.channel.asyncOpen(streamListener, null);
        
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
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
 * This function checks whether the context menu needs to be dispalyed and then
 * makes sure that that is the state of the context menu
 */

function checkContextMenu() {
    var prefService = Components.classes['@mozilla.org/preferences-service;1'].
            getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch('extensions.accessme.');
    var showContextMenu = true; //default
    dump('::checkContextMenu branch.prefHasUserValue(\'showcontextmenu\') == ');
    dump(branch.prefHasUserValue('showcontextmenu'));
    dump('\n');
    if (branch.prefHasUserValue('showcontextmenu')) {
        showContextMenu = branch.getBoolPref('showcontextmenu');
    }

    var contextMenu = document.getElementById('accessmecontextmenu');
    dump('::checkContextMenu contextMenu == ' + contextMenu + '\n');
    dump('::checkContextMenu showcontextmenu == ');
    dump(showContextMenu +'\n');
    contextMenu.setAttribute('collapsed', !showContextMenu);
}

function AccessMeGotRequest(subject, topic, data) {
    var httpChannel = subject.QueryInterface(Components.interfaces.
            nsIHttpChannel);
    accessMeOverlay.recordRequestParameters(httpChannel);
}

function AccessMeGotResponse(subject, topic, data) {
    var httpChannel = subject.QueryInterface(Components.interfaces.
            nsIHttpChannel);
    accessMeOverlay.recordResponse(httpChannel);
}

function dumpHeader(aHeader, aValue) {
    dump('\n dumpHeader::' + aHeader + " === " + aValue);
}

function AccessMeOverlay() {
    dump('\nAccessMeOverlay::ctor()');
    this.firstRun = true;
    this.requestObserver = new SecCompObserver('http-on-modify-request',
            AccessMeGotRequest);
    this.responseObserver = new SecCompObserver('http-on-examine-response',
            AccessMeGotResponse);
    this.requestParameters = null;
    this.response = null;
    this.headerVisitor = new SecCompVisitor(dumpHeader);
}

AccessMeOverlay.prototype = {
    onLoad: function() {
        dump('\nAccessMeOverlay::onLoad');
        var observerService = Components.
                classes["@mozilla.org/observer-service;1"].
                getService(Components.interfaces.nsIObserverService);
        dump('\nsdfasdf');
        
        Components.reportError(this.requestObserver.topic);
        
        observerService.addObserver(this.requestObserver,
                this.requestObserver.topic, false);
        observerService.addObserver(this.reponseObserver,
                this.responseObserver.topic, false);
    }
    ,
    onUnload: function() {
        dump('\nAccessMeOverlay::onUnload');
        var observerService = Components.
                classes["@mozilla.org/observer-service;1"].
                getService(Components.interfaces.nsIObserverService);
        
        observerService.removeObserver(this.requestObserver,
                this.requestObserver.topic);
        observerService.removeObserver(this.responseObserver,
                this.responseObserver.topic);
        
    }
    ,
    start: function() {
        if (this.firstRun) {
            
        }
    }
    ,
    recordRequestParameters: function(httpChannel) {
        dump('\ndumping out headers:');
        httpChannel.visitRequestHeaders(this.headerVisitor);
        var is = httpChannel.open();
        var sis = Components.classes["@mozilla.org/scriptableinputstream;1"]
            .createInstance(Components.interfaces.nsIScriptableInputStream);
        sis.init(is);
        dump('\nhere\'s some text: ' + sis.read(is.available()));
        
    }
    ,
    recordResponse: function(httpChannel) {
        
    }
    
};

var accessMeOverlay = new AccessMeOverlay();

window.addEventListener('load', function(){accessMeOverlay.onLoad()}, false);
window.addEventListener('unload', function(){accessMeOverlay.onUnload()}, false);

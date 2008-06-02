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

const STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
const STATE_IS_WINDOW = Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW;
const STATE_IS_DOCUMENT = Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT;

const LISTEN_ON_WINDOW = 1;
const LISTEN_ON_DOCUMENT = 2;

function SecCompProgressListener(funcToCall, listenOn, listenWhen) {
    
    this.func = funcToCall
    this.listenOn = listenOn != null ? listenOn : STATE_IS_WINDOW;
    this.listenWhen = listenWhen === undefined ?
            Components.interfaces.nsIWebProgressListener.STATE_STOP :
            listenWhen;
    //dump('created a listener... mode is ' + listenOn + '\n');
    this.interfaceName = "nsIWebProgressListener";
};

SecCompProgressListener.prototype =
{
    QueryInterface: function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
        {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
        return null;
    }
    ,
    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus)
    {
        //dump('got a state change. aFlag is ' + aFlag.toString(16) + '\n');
        //dump('got a state change. we are listening on ' + 
        //        this.listenOn.toString(16) + '\n');


    }
    ,
    onLocationChange: function(aProgress, aRequest, aURI)
    {
        //if ((aFlag & this.listenWhen) && (aFlag & this.listenOn)) {
            this.func(aRequest, aURI);
        //}
    }
    ,
    // For definitions of the remaining functions see XULPlanet.com
    onProgressChange: function() {return 0;},
    onStatusChange: function() {return 0;},
    onSecurityChange: function() {return 0;},
    onLinkIconAvailable: function() {return 0;}
};

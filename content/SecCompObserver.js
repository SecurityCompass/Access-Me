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
 * PrefObserver.js
 * This provides a class that can be used to watch arbitrary preferences and do
 * artibrary things based on them.
 * This assumes will act on all preferences being watched (that is all children
 * of this preference as well as the preference itself).
 */

function SecCompObserver(topic, functionToCall){
    this.funcToCall = functionToCall;
    this.topic = topic;
    
}

SecCompObserver.prototype = {
    observe: function(subject, topic, data) {
        dump('\nSecCompObserver::Observe topic == ' + topic + '\n');
        if (topic == this.topic) {
            this.funcToCall(subject, topic, data);
        }
    }
    ,
    QueryInterface : function(aIID) {
        if (aIID.equals(Components.interfaces.nsIObserver) ||
            aIID.equals(Components.interfaces.nsISupports) )
        {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
};
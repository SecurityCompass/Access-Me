/*
Copyright 2008 Security Compass

This file is part of Access Me

Access Me is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Access Me is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Access Me.  If not, see <http://www.gnu.org/licenses/>.

If you have any questions regarding Access Me please contact
tools@securitycompass.com
*/

/**
 * An implementation of nsIHttpHeaderVisitor.
 * Calls a function with the header information
 */
function SecCompVisitor(aFunction) {
    this.aFunction = aFunction;
}

SecCompVisitor.prototype = {
    visitHeader: function(aHeader, aValue){
        this.aFunction(aHeader, aValue);
    }
    ,
    QueryInterface: function(aIID) {
        if (aIID.equals(Components.interfaces.nsIHttpHeaderVisitor)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
}
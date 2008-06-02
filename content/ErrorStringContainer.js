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
 * ErrorStringContainer.js
 * @requires PreferenceStringContainer.js
 */
function ErrorStringContainer(){
    this.prefName = 'errorstrings'
    this.init();
    this.observePreference();
        
}
ErrorStringContainer.prototype = new PreferenceStringContainer();
dump('creating... ErrorStringContainer object\n');
ErrorStringContainer.prototype.init = function (){    
        
    var attackStrings;
        
    this.prefBranch = this.prefService.getBranch('extensions.accessme.');
    attackStrings = this.prefBranch.getCharPref('errorstrings');
    this.strings = JSON.fromString(attackStrings);
    
};

ErrorStringContainer.prototype.save = function() {
        dump('ErrorStringContainer::save this.strings ' +this.strings + '\n');
        dump('ErrorStringContainer::save typeof(this.strings) ' +typeof( this.strings )+ '\n');
        this.prefBranch.setCharPref('errorstrings', JSON.toString(this.strings));
}

ErrorStringContainer.prototype.QueryInterface = function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupports)){
        return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

function getErrorStringContainer(){
    
    if (typeof(errorStringContainer) === 'undefined' || !errorStringContainer) {
        errorStringContainer = new ErrorStringContainer();
    }
    
    return errorStringContainer;
}

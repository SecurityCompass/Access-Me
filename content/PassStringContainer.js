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
GNU General Public Licensefor more details.

You should have received a copy of the GNU General Public License
along with Access Me.  If not, see <http://www.gnu.org/licenses/>.

If you have any questions regarding Access Meplease contact
tools@securitycompass.com
*/

/**
 * PassStringContainer.js
 * @requires PreferenceStringContainer.js
 */
function PassStringContainer(){
    this.prefName = 'passstrings'
    this.init();
    this.observePreference();
}
PassStringContainer.prototype = new PreferenceStringContainer();
dump('creating... PassStringContainer object\n');
PassStringContainer.prototype.init = function (){    
        
    var attackStrings;
        
    this.prefBranch = this.prefService.getBranch('extensions.accessme.');
    attackStrings = this.prefBranch.getCharPref('passstrings');
    this.strings = JSON.fromString(attackStrings);
    
};

PassStringContainer.prototype.save = function() {
        dump('PassStringContainer::save this.strings ' +this.strings + '\n');
        dump('PassStringContainer::save typeof(this.strings) ' +typeof( this.strings )+ '\n');
        this.prefBranch.setCharPref('passstrings', JSON.toString(this.strings));
}

PassStringContainer.prototype.QueryInterface = function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupports)){
        return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

function getPassStringContainer(){
    
    if (typeof(accessme_passStringContainer__) === 'undefined' || !accessme_passStringContainer__) {
        accessme_passStringContainer__= new PassStringContainer();
    }
    
    return accessme_passStringContainer__;
}

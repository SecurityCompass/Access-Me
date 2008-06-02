/*
Copyright 2008 Security Compass

This file is part of Access Me

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
 * requires preferenceStringContainer.js
 */


/**
 *this object is responsible for dealing with the Attack Strings.
 */
function AttackParamDetectRegexContainer() {
    this.prefName = 'attackParamDetectRegex';
    this.init();
    this.observePreference();

}
AttackParamDetectRegexContainer.prototype = new PreferenceStringContainer();
dump('creating... AttackParamDetectRegexContainer object\n');
AttackParamDetectRegexContainer.prototype.init = function (){    
        
    var detectionRegexs;
    
    this.prefBranch = this.prefService.getBranch('extensions.accessme.');
    this.prefDefaultBranch = this.prefService.getDefaultBranch('extensions.accessme.')
    detectionRegexs = this.prefBranch.getCharPref('attackParamDetectRegex');
    this.strings = JSON.fromString(detectionRegexs);
        
};
AttackParamDetectRegexContainer.prototype.save = function() {
    this.prefBranch.setCharPref('attackParamDetectRegex', JSON.toString(this.strings));
}
AttackParamDetectRegexContainer.prototype.QueryInterface = function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupports)){
        return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
}


function getAttackParamDetectRegexContainer(){
    //if (typeof(accessme_attackParamDetectRegexContainer) === 'undefined' || !accessme_attackParamDetectRegexContainer){
    //    accessme_attackParamDetectRegexContainer = new AttackParamDetectRegexContainer();
    dump('asdsgsdgewtewetwetwa');
    return Components.classes["@securitycompass.com/jsAttackDetectionRegExpContainer;1"].getService(Components.interfaces.SecCompIPreferenceContainer);
}

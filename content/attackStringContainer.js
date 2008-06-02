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
 * AttackStringContainer.js
 * requires preferenceStringContainer.js
 */


/**
 *this object is responsible for dealing with the Attack Strings.
 */
function AttackStringContainer() {
    this.init();
}
AttackStringContainer.prototype = new PreferenceStringContainer();
dump('creating... AttackStringContainer object\n');
AttackStringContainer.prototype.init = function (){    
        
        var attackStrings;
        
        this.prefBranch = this.prefService.getBranch('extensions.accessme.');
        this.prefDefaultBranch = this.prefService.getDefaultBranch('extensions.accessme.')
        attackStrings = this.prefBranch.getCharPref('attacks');
        this.strings = JSON.fromString(attackStrings);

        
    };
AttackStringContainer.prototype.save = function() {
    this.prefBranch.setCharPref('attacks', JSON.toString(this.strings));
    
}


function getAttackStringContainer(){
    if (typeof(attackStringContainer) === 'undefined' || !attackStringContainer){
        attackStringContainer = new AttackStringContainer();
    }
    return attackStringContainer;
}

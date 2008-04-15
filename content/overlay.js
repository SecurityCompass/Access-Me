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
    
function XssOverlay() {}

AccessMeOverlay.prototype = {
    contextMenuObserver: null
    ,
    onLoad: function() {
        
        var prefService = Components.classes['@mozilla.org/preferences-service;1'].
                getService(Components.interfaces.nsIPrefService);
        
        var branch = prefService.getBranch('');
    
        var observableBranch = branch.
                QueryInterface(Components.interfaces.nsIPrefBranch2);
        
        this.contextMenuObserver = new Xss_PrefObserver(checkContextMenu);
        
        checkContextMenu();
        
        dump('mainwindow::onLoad contextMenuObserver ==' + this.contextMenuObserver +'\n');
        
        
        observableBranch.addObserver('extensions.accessme.showcontextmenu', this.contextMenuObserver, false);
    }
    ,
    onUnload: function() {
        var prefService = Components.classes['@mozilla.org/preferences-service;1'].
        getService(Components.interfaces.nsIPrefService);
        
        var branch = prefService.getBranch('');
        
        var observableBranch = branch.
                QueryInterface(Components.interfaces.nsIPrefBranch2);
        
        observableBranch.removeObserver('extensions.accessme.showcontextmenu', this.contextMenuObserver)
    }
};

var accessMeOverlay = new AccessMeOverlay();

window.addEventListener('load', accessMeOverlay.onLoad, false);
window.addEventListener('unload', accessMeOverlay.onUnload, false);

/*
Copyright 2008 Security Compass

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

function SidebarBuilder(){
    
    this.toBeAdded = new Array();
    var prefService = Components.classes['@mozilla.org/preferences-service;1'].
            getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch('extensions.accessme.');
    
    this.time = branch.getIntPref('sidebarbuildingstop');
    this.isRunning = true;
}

SidebarBuilder.prototype = {
    setup: function(){
        this.isRunning = true;
        this.toBeAdded = new Array();
    }
    ,
    start: function(self){
        if (!self) {
            self = this;
        }
        if (self.toBeAdded.length > 0 && self.isRunning) {
            
            var parent, child, postFunc;
            
            [parent, child, postFunc] = self.toBeAdded.shift();
            
            dump('\nAdding '+child+' -> '+parent);
            
            parent.appendChild(child);
            
            if (postFunc) postFunc(parent, child);
            
            setTimeout(self.start, self.time, self);
            
        }
        
        
    }
    ,
    add: function(parent, child, postFunc) {
        this.toBeAdded.push([parent,child, postFunc]);
    }
    ,
    stop: function() {
        this.isRunning = false;
        this.toBeAdded = null;
    }
}

function getSidebarBuilder() {
    if (typeof(__xssme_sidebar_builder__) == 'undefined' ||
        !__xssme_sidebar_builder__)
    {
        __xssme_sidebar_builder__ = new SidebarBuilder();
    }
    return __xssme_sidebar_builder__;
}

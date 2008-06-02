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


function SecCompHistoryListener() {
    //nothing
}

SecCompHistoryListener.prototype =  {
    /* below comments have been taken directly from Mozilla's
     * nsISHistoryListener.idl. */
    /**
     * Called when a new document is added to session history. New documents are
     * added to session history by docshell when new pages are loaded in a frame
     * or content area, for example via nsIWebNavigation::loadURI()
     * 
     * @param aNewURI     The URI of the document to be added to session history.
     */
    OnHistoryNewEntry: function (aNewURI){
        //do nothing
    }
    ,
    /**
     * Called when navigating to a previous session history entry, for example
     * due to a nsIWebNavigation::goBack() call.
     *
     * @param aBackURI    The URI of the session history entry being navigated to.
     * @return            Whether the operation can proceed.
     */
    OnHistoryGoBack: function(aBackURI) {
      
    }
    ,
    /**
     * Called when navigating to a next session history entry, for example
     * due to a nsIWebNavigation::goForward() call.
     *
     * @param aForwardURI   The URI of the session history entry being navigated to.
     * @return              Whether the operation can proceed.
     */
    OnHistoryGoForward: function(aForwardURI) {
      
    }
    ,
    /** 
     * Called when the current document is reloaded, for example due to a
     * nsIWebNavigation::reload() call.
     *
     * @param aReloadURI    The URI of the document to be reloaded.
     * @param aReloadFlags  Flags that indicate how the document is to be 
     *                      refreshed. See constants on the nsIWebNavigation
     *                      interface.
     * @return              Whether the operation can proceed.
     *
     * @see  nsIWebNavigation
     */
    onHistoryReload: function (aReloadURI, aReloadFlags) {
        
    }
    ,
    /**
     * Called when navigating to a session history entry by index, for example,
     * when nsIWebNavigation::gotoIndex() is called.
     *
     * @param aIndex        The index in session history of the entry to be loaded.
     * @param aGotoURI      The URI of the session history entry to be loaded.
     * @return              Whether the operation can proceed.
     */
    OnHistoryGotoIndex: function (aIndex, aGotoURI) {
        
    }
    ,
    /**
     * Called when entries are removed from session history. Entries can be
     * removed from session history for various reasons, for example to control
     * the memory usage of the browser, to prevent users from loading documents
     * from history, to erase evidence of prior page loads, etc.
     *
     * To purge documents from session history call nsISHistory::PurgeHistory()
     *
     * @param aNumEntries   The number of entries to be removed from session history.
     * @return              Whether the operation can proceed.
     */
    OnHistoryPurge: function(aNumEntries) {
        
    }
    ,
    QueryInterface: function(aIID){
        if (aIID.equals(Components.interfaces.nsISHistoryListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference))
        {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
};

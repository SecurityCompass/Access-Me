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

function onOk() {
    var stringTxtBox = document.getElementById('DetectRegExtxtbox');
    var sigTxtBox = document.getElementById('sigtxtbox');
    var attackParamDetectRegexContainer = window.arguments[0];
    var prefController = window.arguments[1];
    var prefWindow = window.arguments[2];
    
    
    if (!stringTxtBox.value.length)
    {
        alert("Please enter an attack string");
        stringTxtBox.select();
        return false;
    }
    else {
        var regex = null;
        try {
         regex = new RegExp(stringTxtBox.value, "gim");
        }
        catch (e) {
            alert("Please enter a vailid regular expression. " + e);
            return false;
        }
    }
    if (!sigTxtBox.value.length){
        alert("Please enter a signature to identify you by.");
        sigTxtBox.select();
        return false;
    }
    
    
    if (attackParamDetectRegexContainer.addString(stringTxtBox.value, sigTxtBox.value)){
        prefController.makeUI(attackParamDetectRegexContainer.getContents({}), prefWindow, 
                'existingAttackParamDetectRegex');
        return true;
    }
    else{
        alert("couldn't add your attack string");
        return false;
    }
    
}

function onCancel(){
    
    return true;
}
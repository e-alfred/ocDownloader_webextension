/**
 * ownCloud - ocDownloader
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Xavier Beurois <www.sgc-univ.net>
 * @copyright Xavier Beurois 2015
 */

var Manifest = browser.runtime.getManifest ();
var NeededAPIVersion = Manifest.version;

function StartsWith (String, LookingFor, Position)
{
   	Position = Position || 0;
   	return String.indexOf (LookingFor, Position) === Position;
}

function EndsWith (String, LookingFor)
{
    return String.indexOf (LookingFor, String.length - LookingFor.length) !== -1;
}

function NotifyMe (Message)
{
	browser.notifications.create ('ocDownloader',
	{
		type: 'basic',
		title: 'ocDownloader',
    	iconUrl: '../img/icon-64.png',
      	message: Message
    }, function (iD)
	{
		setTimeout (function (){
	  		browser.notifications.clear ('ocDownloader', function ()
			{
				return;
			});
		}, 4000);
	});
}

function MakeOCURL (URL, Method)
{
	if (!EndsWith (URL, '/'))
	{
		URL += '/';
	}
	URL = URL + 'index.php/apps/ocdownloader/api/' + Method + '?format=json';
	
	return URL.substr (0, URL.indexOf(':')) + '://' + URL.substr (URL.indexOf('/') + 2);
}

function ValidURL (URLString)
{
	return /^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(URLString);
}

function SaveConnectionData ()
{
	var URL = document.getElementById ('ocurltf').value.trim ();
	var Username = document.getElementById ('usernametf').value.trim ();
	var Passwd = document.getElementById ('passwdtf').value.trim ();
	
	if (URL.length > 0 && Username.length > 0 && Passwd.length > 0)
	{
		document.getElementById ('messagep').textContent = '';
		document.getElementById ('messagep').style.display = 'none';
		
		if (!ValidURL (document.getElementById ('ocurltf').value) || !(StartsWith (document.getElementById ('ocurltf').value, 'http') || StartsWith (document.getElementById ('ocurltf').value, 'https')))
		{
			document.getElementById ('messagep').textContent = browser.i18n.getMessage ('InvalidURL');
			document.getElementById ('messagep').style.display = 'block';
		}
		else
		{
			document.getElementById ('messagep').textContent = browser.i18n.getMessage ('Datasaved');
			document.getElementById ('messagep').style.display = 'block';
			
			browser.storage.local.set ({
				'OCUrl': URL,
				'Username': Username,
				'Passwd': Passwd
			}, function (){
				var XHR = new XMLHttpRequest ();
				XHR.open ('POST', MakeOCURL (URL, 'version'), true);
				XHR.setRequestHeader ('OCS-APIREQUEST', 'true');
				XHR.setRequestHeader ('Content-type', 'application/x-www-form-urlencoded');
				XHR.setRequestHeader ('Authorization', 'Basic ' + btoa(Username + ':' + Passwd));
				XHR.onreadystatechange = function ()
				{
					if (XHR.readyState == 4)
					{
						try
						{
					    	var OCS = JSON.parse (XHR.responseText);
							console.log (XHR.responseText);
							
							if (XHR.status == 200)
							{
								if (OCS.RESULT)
								{
									NotifyMe (browser.i18n.getMessage ('VersionOK'));
								}
								else
								{
									NotifyMe (browser.i18n.getMessage ('VersionNOK'));
								}
							}
							else
							{
								NotifyMe (browser.i18n.getMessage ('Unabletoreachyourserver'));
							}
						}
						catch (E)
						{
							NotifyMe (browser.i18n.getMessage ('NoresponsefromocDownloaderonyourserverPleasecheckthesettings'));
							console.log (E.message);
						}
				  	}
				}
				XHR.send('AddonVersion=' + NeededAPIVersion);
			});
		}
	}
}

// Execute when loading extension html page
window.onload = function ()
{
	browser.storage.local.get (['OCUrl', 'Username', 'Passwd'], function (Items)
	{
		document.getElementById ('ocurltf').placeholder = browser.i18n.getMessage ('ownCloudURL');
		document.getElementById ('ocurltflbl').textContent = browser.i18n.getMessage ('ownCloudURL');
		
		document.getElementById ('usernametf').placeholder = browser.i18n.getMessage ('Username');
		document.getElementById ('usernametflbl').textContent = browser.i18n.getMessage ('Username');
		
		document.getElementById ('passwdtf').placeholder = browser.i18n.getMessage ('Password');
		document.getElementById ('passwdtflbl').textContent = browser.i18n.getMessage ('Password');
		
		if (Items.OCUrl != undefined)
		{
			document.getElementById ('ocurltf').value = Items.OCUrl;
		}
		
		if (Items.Username != undefined)
		{
			document.getElementById ('usernametf').value = Items.Username;
		}
		
		if (Items.Passwd != undefined)
		{
			document.getElementById ('passwdtf').value = Items.Passwd;
		}
	});
	
	document.getElementById ('savebtn').value = browser.i18n.getMessage ('Save');
	document.getElementById ('savebtn').addEventListener("click", SaveConnectionData);
}
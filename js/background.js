/**
 * ownCloud - ocDownloader
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Xavier Beurois <www.sgc-univ.net>
 * @copyright Xavier Beurois 2015
 */

function EndsWith (String, LookingFor)
{
    return String.indexOf (LookingFor, String.length - LookingFor.length) !== -1;
}

function NotifyMe (Message)
{
	chrome.notifications.create ('ocDownloader',
	{
		type: 'basic',
		title: 'ocDownloader',
    	iconUrl: '../img/icon-64.png',
      	message: Message
    }, function (iD)
	{
		setTimeout (function (){
	  		chrome.notifications.clear ('ocDownloader', function ()
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

function OnClickHandler (Info, Tab)
{
	chrome.storage.local.get (['OCUrl', 'Username', 'Passwd'], function (Items)
	{
		var XHR = new XMLHttpRequest ();
		XHR.open ('POST', MakeOCURL (Items.OCUrl, 'add'), true);
		XHR.setRequestHeader ('OCS-APIREQUEST', 'true');
		XHR.setRequestHeader ('Content-type', 'application/x-www-form-urlencoded');
		XHR.setRequestHeader ('Authorization', 'Basic ' + btoa(Items.Username + ':' + Items.Passwd));
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
						if (!OCS.ERROR)
						{
							NotifyMe (chrome.i18n.getMessage ('Downloadlaunchedonyourserver') + ': ' + OCS.FILENAME);
						}
						else
						{
							NotifyMe (chrome.i18n.getMessage (OCS.MESSAGE));
						}
					}
					else
					{
						NotifyMe (chrome.i18n.getMessage ('Unabletoreachyourserver'));
					}
				}
				catch (E)
				{
					NotifyMe (chrome.i18n.getMessage ('NoresponsefromocDownloaderonyourserverPleasecheckthesettings'));
					console.log (E.message);
				}
		  	}
		}
		XHR.send('URL=' + encodeURIComponent (Info.linkUrl));
	});
}

chrome.contextMenus.create ({
	'title': chrome.i18n.getMessage('DownloadWithocDownloader'),
	'contexts': ['link']
});

chrome.contextMenus.onClicked.addListener (OnClickHandler);

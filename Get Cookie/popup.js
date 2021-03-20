var listAccount = [];
var currentCookie = "";
var currentUid = "";

function loadCurrentCookie() {
	chrome.tabs.getSelected(null, function (tab) { // null defaults to current window
		var currentUrl = tab.url;
		if (currentUrl.indexOf('chrome://newtab') > -1 || currentUrl.indexOf('quangcaouidfb') > -1) {
			currentUrl = "https://www.facebook.com";
		}
		$('#CurrentCookieUrl').html(extractHostname(currentUrl));
		chrome.cookies.getAll({
			"url": currentUrl
		}, function (cookie) {
			var result = "";
			var _cuser = false;
			for (var i = 0; i < cookie.length; i++) {


				if (cookie[i].name == "c_user") {
					_cuser = true;
					currentUid = cookie[i].value;
				}
				if (_cuser) {
					result += cookie[i].name + "=" + cookie[i].value + "; ";
				}
			}
			result += "useragent=" + btoa(navigator.userAgent).replace('=', '%3D').replace('=', '%3D').replace('=', '%3D') + "; ";


			document.getElementById('cookieresult').value = (currentUid + '|password|' + result).trim();
			currentCookie = result;
			chrome.tabs.getSelected(null, function (tab) {
				chrome.tabs.executeScript(tab.id, {
					code: 'localStorage["z_uuid"]',
				}, function (results) {
					if (results != undefined && results != null && results != '') {
						currentCookie += "z_uuid=" + results + "; ";
						document.getElementById('cookieresult').value = currentCookie;
					}
				});
			});
			if (currentUrl.indexOf('facebook') > -1 &&
				document.getElementById('auto_save_fbaccount').checked &&
				currentCookie.indexOf('xs=') > -1 &&
				currentCookie.indexOf('c_user=') > -1) {
				document.getElementById('btncookiesave').click();
			}
		});
		if (currentUrl.indexOf('facebook') > -1) {
			document.getElementById('DivCurrentFacebookId').style.display = "block";
			chrome.tabs.executeScript(tab.id, {
				code: 'var fid= "";function getuid(){' +
					'try{var arr= document.getElementById("entity_sidebar").getElementsByTagName("a"); for(var i=0; i<arr.length;i++){ var href = arr[i].getAttribute("href")+" ";if(href.indexOf("photos")>-1){ return href.split("/")[1]; }}}catch(ex){}' +
					'try{var arr= document.getElementById("headerArea").getElementsByTagName("div"); for(var i=0; i<arr.length;i++){ var href = arr[i].getAttribute("id")+" ";if(href.indexOf("headerAction_")>-1){ return href.split("_")[1]; }}}catch(ex){}' +
					'try{return JSON.parse(document.getElementById("pagelet_timeline_main_column").getAttribute("data-gt")).profile_owner;}catch(ex){}' +
					'try{return document.getElementsByName("ft_ent_identifier")[0].value;}catch(ex){}' +
					'}   getuid();' //argument here is a string but function.toString() returns function's code
			}, function (results) {
				document.getElementById('CurrentFacebookId').value = results[0];
			});
		} else {
			document.getElementById('DivCurrentFacebookId').style.display = "none";
		}
	});
}

function extractHostname(url) {
	var hostname;
	//find & remove protocol (http, ftp, etc.) and get hostname

	if (url.indexOf("://") > -1) {
		hostname = url.split('/')[2];
	} else {
		hostname = url.split('/')[0];
	}

	//find & remove port number
	hostname = hostname.split(':')[0];
	//find & remove "?"
	hostname = hostname.split('?')[0];

	return hostname;
}

function extractRootDomain(url) {
	var domain = extractHostname(url),
		splitArr = domain.split('.'),
		arrLen = splitArr.length;

	//extracting the root domain here
	//if there is a subdomain 
	if (arrLen > 2) {
		domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
		//check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
		if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
			//this is using a ccTLD
			domain = splitArr[arrLen - 3] + '.' + domain;
		}
	}
	return domain;
}
loadCurrentCookie();
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete') {
		chrome.tabs.getSelected(null, function (tab2) { // null defaults to current window
			if (tab2.id == tabId) {
				loadCurrentCookie();
			}
		});
	}
})
document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('cookieresult').onclick = function () {
		document.getElementById('cookieresult').select();
	};
	document.getElementById('CurrentFacebookId').onclick = function () {
		document.getElementById('CurrentFacebookId').select();
	};
	document.getElementById('btncookieimport').onclick = function () {
		var cookie = document.getElementById('cookieresult').value;
		if (cookie == '') {
			chrome.tabs.getSelected(null, function (tab) {
				var code = 'alert("Please enter cookie to import!");';
				chrome.tabs.executeScript(tab.id, {
					code: code
				});
			});
			return;
		}
		importCookie(cookie);

	};
	if ((localStorage.getItem("autosavefbacc") + "" == "0")) {
		document.getElementById('auto_save_fbaccount').checked = false;
	} else {
		document.getElementById('auto_save_fbaccount').checked = true;
	}


	if (localStorage.getItem("listaccount") === null) {
		//...
	} else {
		listAccount = JSON.parse(localStorage.listaccount);
	}
	for (var i = 0; i < listAccount.length; i++) {
		addNewAccItem(listAccount[i]);
	}
	$('#btncookiesave').click(function () {
		var cookieList = document.getElementById('cookieresult').value.split('\n');
		if (cookieList.length > 1) {
			for (var i = 0; i < cookieList.length; i++) {
				var cookie = cookieList[i];
				var arr = cookie.split("|");
				if (arr.length > 1) {
					for (var k = 0; k < arr.length; k++) {
						try {
							if (arr[k].indexOf('c_user') > -1) {
								cookie = arr[k];
							}
						} catch (ex) {

						}
					}
				}
				const regex = /c_user=(\d+)/g;
				var m;
				var uid = '';
				while ((m = regex.exec(cookie)) !== null) {
					uid = m[1]
				}
				if (uid != '') {
					var acc = {
						uid: uid,
						name: uid,
						cookie: cookie,
						token: ''
					};
					var isExist = false;
					for (var j = 0; j < listAccount.length; j++) {
						if (listAccount[j].uid == acc.uid) {
							listAccount[j] = acc;
							isExist = true;
						}
					}
					if (!isExist) {
						listAccount.push(acc);
						addNewAccItem(acc)
					}
				}
			}
			localStorage.listaccount = JSON.stringify(listAccount);
		} else {
			chrome.tabs.getSelected(null, function (tab) {
				chrome.tabs.executeScript(tab.id, {
					code: 'var name= "";try{name=document.getElementById("userNav").getElementsByTagName("a")[1].getAttribute("title");}catch(ex){}' +
						'if(name==undefined || name==""){const regex = /"NAME":"(.*?)"/g;const str = document.documentElement.innerHTML;var m=regex.exec(str); name=m[1];} name' //argument here is a string but function.toString() returns function's code
				}, function (results) {
					var name = results[0];
					var x = name;
					var r = /\\u([\d\w]{4})/gi;
					x = x.replace(r, function (match, grp) {
						return String.fromCharCode(parseInt(grp, 16));
					});
					x = unescape(x);
					name = x;
					var acc = {
						uid: currentUid,
						name: name,
						cookie: currentCookie,
						token: ''
					};
					var isExist = false;
					for (var j = 0; j < listAccount.length; j++) {
						if (listAccount[j].uid == acc.uid) {
							listAccount[j] = acc;
							isExist = true;
						}
					}
					if (!isExist) {
						listAccount.push(acc);
						addNewAccItem(acc)
					}
					localStorage.listaccount = JSON.stringify(listAccount);
				});
			});
		}

	})
	$("#btncookielogout").click(function () {
		removeAllCookies(function () {
			chrome.tabs.getSelected(null, function (tab) {
				var code = 'window.location.reload();';
				chrome.tabs.executeScript(tab.id, {
					code: code
				});
			});
		});
	})
	$('#btnExportCookie').click(function () {
		var filename = 'cookies.txt'; // You can use the .txt extension if you want
		var cookies = "";
		for (var j = 0; j < listAccount.length; j++) {
			cookies = cookies + listAccount[j].cookie + "\r\n";
		}
		var link = document.createElement('a');
		var mimeType = 'text/plain';
		link.setAttribute('download', filename);
		link.setAttribute('target', '_blank');
		link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(cookies));
		link.click();
	})
	$('#btngetqr').click(function () {
		var cc = $('#cookieresult').val();
		if (!$('#imgqrcode').is(":hidden")) {
			cc = cc.replace(/presence=.*?;/gm, "");
			cc = cc.replace(/x-referer=.*?;/gm, "");
			if (cc.length > 1000) {
				cc = cc.match(/(c_user=.*?;)/gm) + " " + cc.match(/(xs=.*?;)/gm);
			}
		}
		$('#imgqrcode').attr("src", "https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=" + encodeURI(cc) + "&chld=L|1&choe=UTF-8")
		$('#imgqrcode').show();
	})
	$('#auto_save_fbaccount').change(function () {
		localStorage.setItem("autosavefbacc", document.getElementById('auto_save_fbaccount').checked ? "1" : "0");
		if (document.getElementById('auto_save_fbaccount').checked && currentCookie != "") {
			document.getElementById('btncookiesave').click();
		}
	})
});

function addNewAccItem(acc) {
	var div = $("<div id='acc_" + acc.uid + "' class='acc' uid='" + acc.uid + "'>" + acc.uid + " - <span class='fullname'>" + decodeURI(acc.name.replace(/\\/g, "\\")) + "</span> <span class='delete' uid='" + acc.uid + "'>X</span></div>");
	$("#list_account").append(div);
	console.log(div)
	$('#acc_' + acc.uid).click(function () {
		for (var j = 0; j < listAccount.length; j++) {
			if (listAccount[j].uid == acc.uid) {
				importCookie(listAccount[j].cookie)

				chrome.tabs.getSelected(null, function (tab) {
					if (tab.url.indexOf('chrome://') > -1) {
						chrome.tabs.update(tab.id, {
							url: "https://www.facebook.com"
						});
					}
				});

			}
		}
	});
	$('#acc_' + acc.uid + " .delete").click(function () {
		var uid = $(this).attr("uid");
		for (var j = 0; j < listAccount.length; j++) {
			if (listAccount[j].uid == uid) {
				listAccount.splice(j, 1);
				$(this).parent().remove();
				localStorage.listaccount = JSON.stringify(listAccount);
			}
		}
		return false;
	});
}

function importCookie(cookie) {
	var arr = cookie.split("|");
	if (arr.length > 2) {
		for (var i = 0; i < arr.length; i++) {
			try {
				if (arr[i].indexOf('c_user') > -1) {
					cookie = arr[i];
				}
			} catch (ex) {

			}
		}
	}
	removeAllCookies(function () {
		var ca = cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			try {
				var name = ca[i].split('=')[0].trim();
				var val = ca[i].split('=')[1].trim();;
				chrome.cookies.set({
					url: "https://www.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://web.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://m.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://mbasic.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://developers.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://upload.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://mobile.facebook.com",
					name: name,
					value: val
				});
				chrome.cookies.set({
					url: "https://business.facebook.com",
					name: name,
					value: val
				});

			} catch (ex) {
				console.log(ex);
			}
		}
		chrome.tabs.getSelected(null, function (tab) {
			var code = 'window.location.reload();';
			chrome.tabs.executeScript(tab.id, {
				code: code
			});
		});
	});

}

var removeAllCookies = function (callback) {
	if (!chrome.cookies) {
		chrome.cookies = chrome.experimental.cookies;
	}
	var removeCookie = function (cookie) {
		var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
		chrome.cookies.remove({
			"url": url,
			"name": cookie.name
		});
	};
	chrome.cookies.getAll({
		domain: "facebook.com"
	}, function (all_cookies) {
		var count = all_cookies.length;
		for (var i = 0; i < count; i++) {
			removeCookie(all_cookies[i]);
		}
		callback();
	});
	return "COOKIES_CLEARED_VIA_EXTENSION_API";
};
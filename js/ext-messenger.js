/*
*                                 Expert Goggles Extension Messenger
*   ext_messenger.js is Expert Goggles's middle-man code. It can be considered the background
*   scripts' driver, listening for messages from the content scripts and deciding what to do
*   next based on what was detected on a given page.
*/

//-------------------------------------------------------------------------------------------------
// Communication Functions
//-------------------------------------------------------------------------------------------------

/*
*   sendToUI() forwards info accumulated from the interceptor and parser scripts to the UI to
*   use in sidebar guide generation. Checks for the necessary fields are performed elsewhere.
*   Parameter: info -- An object with at least type, guideURL, and tab fields populated.
*/

function sendToUI(info)
{
    info.from = "ext_messenger";

    //Using the tab ID where a vis. was detected, forward the parsed info to that tab.
    try{chrome.tabs.sendMessage(info.tab, info);}
    catch(error){console.log("Error in messaging to UI: " + error);}
}

/*
*   The notifyUnsupported() function updates the extension's Page Action (what appears when the
*   extension's icon is clicked) to alert the user to the extension's state. It is called when
*   either D3 code was detected but unparsed, or iframes were detected on a webpage, blocking
*   a potential parse. Checks for necessary fields are performed elsewhere.
*   Parameter: info -- An object with at least tab, type, and iframeList fields populated.
*/

function notifyUnsupported(info)
{
    //Get the URL for the Red Error Icon
    var icon = chrome.runtime.getURL("public/assets/error-icon.png");

    //Using the tab ID from the interceptor script, update the page action on that tab.
    chrome.pageAction.setPopup({popup: "html/err-popup.html", tabId: info.tab});
    chrome.pageAction.show(info.tab);
    chrome.pageAction.setIcon({tabId: info.tab, path: icon});

    //Create a message to that popup page w/ iframe URLs and whether D3 source code was present.
    var message = {"iframeList": info.iframeList, "d3type": info.type};
    chrome.extension.onConnect.addListener(function(port){ port.postMessage(message); });
}

//-------------------------------------------------------------------------------------------------
// Main Execution
//-------------------------------------------------------------------------------------------------

var db_connector = new databaseConnector();
var parser = new parser();

//Other than initial set-up, the background is reactive.
//This establishes a listener for intra-extension communication.

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
    //Append sender info to message
    message.tab = sender.tab.id; //Tab identifier of sender
    message.visURL = sender.tab.url; //URL of sender

    //The only messages the UI sends to DBConn are user-made error reports.
    if(message.from == "ui_generator")
        db_connector.makeErrorReport(message.URL);
    //The injector sends out info to parse
    else if(message.from == "injector")
    {

        if(message.funcList.length == 0) //If there was no D3 code, we only get iframeList.
        {
            message.type = "none";
            notifyUnsupported(message); //Use the page action to possibly circumvent iframes.
        }
        else //Otherwise, we attempt to parse the visualization type.
        {
            message.type = parser.parseType(message.funcList);
            if(message.type == "unsupported") //If we failed to parse, create an error page action.
                notifyUnsupported(message);
            else //Otherwise, grab the datavizcatalog URL, save history to db, and forward to UI.
            {
                message.guideURL = parser.getGuideURL(message.type);
                db_connector.saveToHistory(message);
                sendToUI(message);
            }
        }
    }
});
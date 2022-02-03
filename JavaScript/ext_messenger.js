//-------------------------------------------------------------------------------------------------
// Internal Fields
//-------------------------------------------------------------------------------------------------

var db_connector; //Holds the database connection object
var parser; //Holds the parser object.

//-------------------------------------------------------------------------------------------------
// Communication Functions
//-------------------------------------------------------------------------------------------------

//The sendToUI() function takes an Object parameter and messages it to the UI Content Script.

function sendToUI(info)
{
    info.from = "ext_messenger";

    //Using the tab ID of the initial interceptor message, forward to the UI Script on that tab.
    try{chrome.tabs.sendMessage(info.tab, info);}
    catch(error){console.log("Error in messaging to UI: " + error);}
}

//The notifyUnsupported() function updates the extension's Page Action (what appears when the
//extension's icon is clicked) to alert the user to the extension's state. It is called when
//either D3 code was detected but unparsed, or iframes were detected on a webpage, blocking
//a potential parse.

function notifyUnsupported(info)
{
    //Get the URL for the Red Error Icon
    var icon = chrome.runtime.getURL("Assets/error_icon.png");

    //Using the tab ID from the Parser, set that tab's icon and on-click popup to the error state.
    chrome.pageAction.setPopup({popup: "HTML/error_popup.html", tabId: info.tab});
    chrome.pageAction.show(info.tab);
    chrome.pageAction.setIcon({tabId: info.tab,path: icon});

    //Create a message to that popup page w/ iframe URLs and whether D3 source code was present.
    var message = {"iframeList": info.iframeList, "d3type": info.type};
    chrome.extension.onConnect.addListener(function(port){ port.postMessage(message); });
}

//-------------------------------------------------------------------------------------------------
// Main Execution
//-------------------------------------------------------------------------------------------------

//Instantiate the database connector and parser "classes."
db_connector = new databaseConnector();
parser = new parser();

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
        if(message.funcList.length == 0) //If there was no D3, we only get a message for iframes
            notifyUnsupported(message);
        else //Otherwise, we parse its type
        {
            message.type = parser.parseType(message);
            if(message.type == "unsupported")
                notifyUnsupported(message);
            else
            {
                message.guideURL = parser.getGuideURL(message.type);
                db_connector.saveToHistory(message);
                sendToUI(message);
            }
        }
    }
});
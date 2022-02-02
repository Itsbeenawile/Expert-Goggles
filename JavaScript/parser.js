/**
*                              Expert Goggles Visualization Type Parser
*   parser.js is a content script (run on every page) that has the job of determining the type
*   of visualizations that are encountered. When it loads, it first queries db_connector.js for
*   the info loaded from supported_types.json, which contains function-to-type mappings. Then,
*   it awaits a list of D3 function calls from the interceptor (injected by injector.js). When
*   that is received, it runs the list against its parsing logic to determine what vis. type is
*   most likely. It then appends that info into an object, and forwards that to db_connector.js
*   to make a guide query.
*/

//-------------------------------------------------------------------------------------------------
// Internal Fields
//-------------------------------------------------------------------------------------------------

var db_connector; //Holds the database connection object
var supportedTypes; //Will hold the mappings loaded from supported_types.json
var isTest = false; //Boolean indicating whether parser is running in a unit test environment.

//-------------------------------------------------------------------------------------------------
// Helper and Communication Functions
//-------------------------------------------------------------------------------------------------

//The populateTypes() function loads the supported_types.json file, which contains the mappings
//for visualization type parsing.

async function populateTypes()
{
    return fetch(chrome.extension.getURL("Assets/supported_types.json"))
           .then((response) => response.json())
           .then((responseJson) => {return responseJson;});
}

//Since the await keyword can only be used inside of async functions, waitForJson is used
//to get the output of populateTypes()

async function waitForJson() {supportedTypes = await populateTypes();}

//The sendToUI() function takes an Object parameter and messages it to the UI Content Script.

function sendToUI(info)
{
    info.from = "parser";

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
// Type Parsing Logic
//-------------------------------------------------------------------------------------------------

//The parseType() function is the meat of the parser. It runs the list of D3 function calls
//against supportedTypes.json to try and determine the most likely visualization type. If
//there are no D3 function calls, "none" is returned. If it cannot determine the type,
//"unsupported" is returned. parseType() calls sendToDB() when it is finished parsing.
//Parameter: parseInfo -- The message from the Interceptor, containing a list of D3 functions
//                        and iframe information.

function parseType(info)
{
    //Bookkeeping for parsing
    var possType; //Holds the most likely type. Overwritten as logic progresses.
    var prevNumMatches = 0; //Stores the highest number of function-call matches so far.
    var prevDeviation = 7; //Stores lowest deviation (matches vs. total marker functions). Max 7.
    var matches = []; //Holds array of equally likely type matches.

    //Default: unsupported, gets overwritten if a type matches.
    possType = "unsupported";

    //For each supported vis. type in supportedTypes.json...
    for(var jsonEntry = 0; jsonEntry < supportedTypes.length; jsonEntry++)
    {
        //Track the number of function call matches for the current entry.
        var numMatches = 0;
        var currEntry = supportedTypes[jsonEntry];

        //Run the intercepted D3 functions against marker function list.
        for(var currFunc = 0; currFunc < currEntry.functions.length; currFunc++)
        {
            if(info.funcList.includes(currEntry.functions[currFunc]))
                numMatches++; //Count Matches
        }

        //Track Deviation: # of marker functions available for that type - # of matches.
        var deviation = currEntry.length - numMatches;

        //If deviation is lower than previous lowest deviation...
        if(deviation < prevDeviation)
        {
            //Current Entry becomes the most likely answer.
            //Overwrite prevDeviation, numMatches, and array of likely matches.
            prevDeviation = deviation;
            prevNumMatches = numMatches;
            matches = [];
            matches.push(currEntry.type);
        }
        //If deviation is a tie with previous lowest deviation, # of function matches tiebreaks.
        else if(deviation == prevDeviation)
        {
            if(numMatches > prevNumMatches)
            {
                matches = [];
                prevNumMatches = numMatches;
                matches = [];
                matches.push(currEntry.type);
            }
            else if(numMatches == prevNumMatches)
                matches.push(currEntry.type);
        }
    }//End of supportedTypes.json for loop.

    //If there is only 1 most likely match, that is our parsed type.
    //Otherwise, we failed to parse. Leave type "unsupported."
    if(matches.length == 1)
        possType = matches[0];

    //If it's not the unit test environment, append type to info.
    if(!isTest)
    {
        info.type = possType;
        console.log("Parsed type on tab " + info.tab + " to be " + info.type);

        if(info.type == "unsupported")
            notifyUnsupported(info);
        else
            sendToUI(info);
    }
    //If it is the test environment, return the type so Unit Test can work with the info directly.
    else
        return possType;
}

//-------------------------------------------------------------------------------------------------
// Main Execution
//-------------------------------------------------------------------------------------------------

//Load the Supported Types JSON File on Start
waitForJson();

//Instantiate the database connector "class"
db_connector = new databaseConnector();

//Check if we're running in the Unit Test environment. That page has a marker div.
var check = document.getElementById("ExpertGogglesTestMarker");
if(check)
    isTest = true;

//Other than initial set-up, the parser is reactive.
//This establishes a listener for intra-extension communication.

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
    //Append sender info to message
    message.tab = sender.tab.id; //Tab identifier of sender
    message.URL = sender.tab.url; //URL of sender

    //The only messages the UI sends to DBConn are user-made error reports.
    if(message.from == "ui_generator")
        db_connector.makeErrorReport(message.URL);
    //The injector sends out info to parse
    else if(message.from == "injector")
    {
        if(message.funcList.length == 0) //If there was no D3, we only get a message for iframes
            notifyUnsupported(message);
        else //Otherwise, we parse its type
            parseType(message);
    }
});
/**
*                                   Expert Goggles Database Connector
*   db_connector.js is the extension's middle-man code. It runs in the background.html page, and
*   handles communication between the extension's content scripts. When the browser is started,
*   it connects to the extension's firestore database, receiving an anonymous sign-in user ID.
*   Then, it awaits a message from the parser.js content script, with the determined type of an
*   encountered D3 visualization. It then queries the database for the associated guide, and
*   forwards that information to the ui_generator.js content script.
*
*   Additionally, as the middle-man communicator, db_connector.js receives error reports from
*   parser.js or ui_generator.js, and either files an error report to the database, or updates the
*   extension's page action to be relevant to the extension's context.
*/

"use strict";

//-------------------------------------------------------------------------------------------------
// Internal Fields
//-------------------------------------------------------------------------------------------------

var myD3 = {}; //See D3InfoObj.js to see the fields passed between the pieces.
var supportedTypes; //A JSON list of supported types and their associated D3 function calls.
var uid; //The Anonymous Sign-in ID of the current user

//The extension's configuration for connecting to Firebase
const firebaseConfig =
{
    apiKey: "AIzaSyDn0mMMvIOzNz3JqzGmB9H0x6QCWJSiSac",
    authDomain: "expert-goggles.firebaseapp.com",
    projectId: "expert-goggles",
    storageBucket: "expert-goggles.appspot.com",
    messagingSenderId: "717484817976",
    appId: "1:717484817976:web:a58598a63973dcf2a630cd"
};

//Initialize Firebase connection w/ that config, then save connections to the 3 Database tables.
firebase.initializeApp(firebaseConfig);
const vis_db = firebase.firestore().collection("Visualization Guides"); //Visualization Guides
const error_db = firebase.firestore().collection("Error Reports"); //Error Reports
const his_db = firebase.firestore().collection("User History"); //First layer of User History Table

//-------------------------------------------------------------------------------------------------
// Database Connection Functions
//-------------------------------------------------------------------------------------------------

//The fetchGuide() function runs a query to the Firestore database for the type currently set in
//the myD3 internal field. In order to avoid a race condition with communication functions,
//fetchGuide() then calls both saveToHistory() and sendToUI() after the guide is fetched.

async function fetchGuide()
{
    console.log("Received a guide request from the Parser for " + myD3.type);

     //Type of visualization to query a guide for.
    var type = myD3.type;

    //Run the query for that type against visualization table and receive raw output
    const query = await vis_db.doc(type).get();

    if(query.empty) //If we somehow queried for an unsupported type...
    {
        //...Update the type field, call notifyUnsupported(), creating an error page action.
        myD3.type = "unsupported";
        notifyUnsupported();
    }
    else //If the query was successful...
    {
        //...append the guide to myD3, forward it to the UI, log the URL to User History
        console.log("Fetched a guide for " + type + ", forwarding to UI and logging to History.");
        myD3.guide = query.data();
        sendToUI(myD3);
        saveToHistory(myD3);
    }
}

//The makeErrorReport() logs a user-reported error to the Error Reports table on
//the remote database. The data includes a URL to the reported page, timestamp
//of the most recent report, and an incremented number of reports made on that page.

function makeErrorReport()
{
    console.log("Received an Error Report from the UI.");

    //Update or Create an Error Report for that URL
    error_db.doc(myD3.url.hashCode()).set
    ({
        URL: myD3.url,
        Most_Recent_Report: firebase.firestore.Timestamp.now(),
        Num_Reports: firebase.firestore.FieldValue.increment(1)
    }, {merge: true})
    .catch((error) =>
    {
        console.log("Error - could not upload error report. We'd ask you to report this but, ya know...", error);
    });
}

//The saveToHistory() function creates an entry to the User History table. The information
//is stored in a collection named after the user's firebase ID, and includes the type of
//visualization detected, the URL where it was encountered, and a timestamp of the most
//recent encounter. A history report is made whenever a D3 visualization is identified
//and the guide is successfully fetched from the Database.
//Parameter: sentObj -- An object with fields containing the necessary info.

function saveToHistory(sentObj)
{
    //Check we have necessary fields
    if(!uid || !sentObj.url || !sentObj.type)
    {
        console.log("Attempted to save history without necessary info.");
        return;
    }

    //Set the doc specified by the URL hash (to avoid duplicates)
    //Use the user's specific history table.
    his_db.doc(uid).collection("history").doc(sentObj.url.hashCode()).set
    ({
        url: sentObj.url,
        last_accessed: firebase.firestore.Timestamp.now(),
        vis_type: sentObj.type
    })
    .catch((error) => { console.error("Error making User History Report: ", error);} );
}

//-------------------------------------------------------------------------------------------------
// Extension Communication Functions
//-------------------------------------------------------------------------------------------------

//The sendToUI() function takes an Object parameter and messages it to the UI Content Script.
//The object sent should only ever be structured like D3InfoObj.js

function sendToUI(sentObj)
{
    sentObj.from = "db_connector";

    //Using the tab ID of the guide request from the Parser, forward to the UI Script on that tab.
    try{chrome.tabs.sendMessage(myD3.tab, sentObj);}
    catch(error){console.log("Error in messaging to UI: " + error);}
}

//The notifyUnsupported() function updates the extension's Page Action (what appears when the
//extension's icon is clicked) to alert the user to the extension's state. It is called when
//either D3 code was detected but unparsed, or iframes were detected on a webpage, blocking
//a potential parse.

function notifyUnsupported()
{
    //Get the URL for the Red Error Icon
    var icon = chrome.runtime.getURL("Assets/error_icon.png");

    //Using the tab ID from the Parser, set that tab's icon and on-click popup to the error state.
    chrome.pageAction.setPopup({popup: "HTML/error_popup.html", tabId: myD3.tab});
    chrome.pageAction.show(myD3.tab);
    chrome.pageAction.setIcon({tabId: myD3.tab,path: icon});

    //Create a message to that popup page w/ iframe URLs and whether D3 source code was present.
    var message = {"iframeList": myD3.iframeList, "d3type": myD3.type};
    chrome.extension.onConnect.addListener(function(port){ port.postMessage(message); });
}

//-------------------------------------------------------------------------------------------------
// Helper Functions
//-------------------------------------------------------------------------------------------------

//The populateTypes() function loads the SupportedTypes.json file, which contains the mappings
//for visualization type parsing. This information is forwarded to the Parser script on each
//page. This avoids having to reload the JSON file on every webpage.

async function populateTypes()
{
    return fetch(chrome.extension.getURL("Assets/supported_types.json"))
           .then((response) => response.json())
           .then((responseJson) =>
           {
                return responseJson;
           });
}

//Since the await keyword can only be used inside of async functions, waitForJson is used
//to get the output of populateTypes()

async function waitForJson() {supportedTypes = await populateTypes();}

//-------------------------------------------------------------------------------------------------
// Main Execution
//-------------------------------------------------------------------------------------------------

//Load the Supported Types JSON File on Start
waitForJson();

//Invoke Firebase's Anonymous Sign-in
firebase.auth().signInAnonymously()
    .catch((error) =>
    {
        console.log("Anonymous Sign in Failed: " + error.message);
    });

//Listen for when Anonymous Sign-in completes.
firebase.auth().onAuthStateChanged((user) =>
{
    if(user) //If sign-in was successful, store the ID
    {
        uid = user.uid;
        console.log("Anonymous Sign-in Successful.");
    }
    //If something causes a log-out, note that to the background console.
    else{console.log("Error in Anonymous User Tracking: User is signed out.");}
});

//Other than initial set-up, DBConn.js is reactive.
//This establishes a listener for intra-extension communication.

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
    //Gather Necessary Info from the message
    myD3 = message; //In most cases, message is a D3InfoObj
    myD3.tab = sender.tab.id; //Tab identifier of sender
    myD3.url = sender.tab.url; //URL of sender

    //The decision tree calls different functions based on the sender and the message.
    if(myD3.from == "ui_generator")
    {
        //The only messages the UI sends to DBConn are user-made error reports.
        makeErrorReport();
    }
    else if(myD3.from == "parser_init")
    {
        //"parser_init" is the request for the supportedTypes JSON info by the Parser on start.
        sendResponse({"supportedTypes": supportedTypes});
    }
    else if(myD3.from == "parser")
    {
        //"parser" is the general output from the parsing logic.

        if(myD3.type == "none") //If there was no D3...
        {
            //...and there were no iframes, show the default page action and do nothing else
            if(myD3.iframeList.length == 0)
                chrome.pageAction.show(myD3.tab);
            //...but there were iframes, create an error popup to allow workaround
            else
                notifyUnsupported();
        }
        //If there was D3 code but it was unparsed, also create the error popup
        else if(myD3.type == "unsupported")
            notifyUnsupported();
        else //Otherwise, FetchGuide retrieves a guide from the DB, appends it to myD3, and forwards it
            fetchGuide();
    }
});








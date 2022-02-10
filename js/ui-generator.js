/**
*                                   Expert Goggles UI Generation
*   ui_generator.js represents the scripts for the Extension's UI Generation. It listens for info
*   from the db_connector.js, then generates a floating prompt to the user, trying to place it near
*   the detected visualization on the page. When the prompt is clicked, it splits the page with a
*   sidebar holding the visualization guide that was sent to it from the database connector.
*/

"use strict";

//-------------------------------------------------------------------------------------------------
// Internal Fields
//-------------------------------------------------------------------------------------------------

var sbOpened = -1; //-1 if the Sidebar is not currently showing, 1 if so.
var sidebar = null; //Holds a sidebar div element.

//-------------------------------------------------------------------------------------------------
// Functions
//-------------------------------------------------------------------------------------------------

//toggleSidebar() toggles the sidebar opened and closed. If it's called when the sidebar isn't
//created, it does nothing.
function toggleSidebar()
{
    //Check that the sidebar exists.
    if(sidebar === null)
        return;

    //If the sidebar is closed, open it
    if(sbOpened < 0)
    {
        document.body.style.marginRight = "285px";
        sidebar.style.width = "275px";
        sidebar.style["padding-left"] = "5px";
        sidebar.style["padding-right"] = "5px";
    }
    else //Otherwise, hide it.
    {
        document.body.style.marginRight = "0px";
        sidebar.style.width = "0px";
        sidebar.style["padding-left"] = "0px";
        sidebar.style["padding-right"] = "0px";
    }

    sbOpened *= -1;
}

//createPrompt() generates a floating prompt on the page. It tries to append it near
//the parent element of an SVG element (the likely place of a D3 visualization). If
//that doesn't work, it appends directly to body. toggleSidebar() is set as the onclick
//function of the prompt.

function createPrompt()
{
    //Try to find an svg to place the prompt by
    var d3 = document.getElementsByTagName("svg")[0];
    if(d3 === null)
        d3 = document.body; //If that didn't work, we'll try appending straight to body
    else
        d3 = d3.parentElement; //If it did, we'll grab the SVG's container.

    //Create and append the prompt.
    var prompt = document.createElement("div");
    prompt.innerHTML = "Expert Goggles:<br>Click for a guide.";
    prompt.classList.add("expertGogglesPrompt");
    prompt.id = "ExpertGoggles";
    d3.appendChild(prompt);

    //Set toggleSidebar() as the onclick function.
    window.onclick = function(event)
    {
        if(event.target.id == "ExpertGoggles")
            toggleSidebar();
    }
}

//reportError() handles the case of a user reporting an incorrect parse, via the sidebar
//report button. It messages the error to DBConn, then changes the contents of the sidebar.

function reportError()
{
    //Message the report to DBConn.js
    var message = {"from": "ui_generator"};
    try{chrome.runtime.sendMessage(message);}
    catch(err) {console.log(err);}

    //Clear Sidebar Contents
    sidebar.innerHTML = "";

    //Repopulate the sidebar: Sorry Title
    var sorry = document.createElement("div");
    var outerDiv = document.createElement("div");
    outerDiv.style["text-align"] = "center";
    sorry.innerHTML = "Sorry!<br><br>";
    sorry.classList.add("guideTitle");
    outerDiv.appendChild(sorry);
    sidebar.appendChild(outerDiv);

    //Repopulate the sidebar: Thanks for the feedback.
    var thanks = document.createElement("div");
    thanks.classList.add("bodyDiv");
    thanks.innerHTML = "We are constantly working to improve Expert Goggles.<br><br>"
                     + "Your feedback will help us do that. Thank you!<br><br>"
                     + "A report has been filed with this URL so we can diagnose the issue.<br>";
    sidebar.appendChild(thanks);
}

//generateSidebar() generates a sidebar div element and populates it with the guide received
//from DBConn.js. The div is stored in the sidebar internal field.

function generateSidebar(info)
{
    //Create the div and style it.
    var sb = document.createElement("div");
    sb.classList.add("expertGogglesSidebar");

    //Take the Object Passed by the Database and Generate the Guide:

    //Import Datavizcatalogue guide into iframe
    var iframe = document.createElement("iframe");
    iframe.src = info.guideURL;
    iframe.sandbox = "allow-top-navigation-by-user-activation";
    iframe.classList.add("iframeSet");
    sb.appendChild(iframe);

    /* Commented Out Until UI Rework
    //Report Error Button
    var buttonDiv = document.createElement("div");
    var button = document.createElement("button");
    button.innerHTML = "Report a parsing error.";
    buttonDiv.classList.add("titlediv");
    buttonDiv.appendChild(button);
    sb.appendChild(buttonDiv);
    button.onclick = function(){ reportError(); };*/

    return sb;
}

//-------------------------------------------------------------------------------------------------
// Main Execution
//-------------------------------------------------------------------------------------------------


//UIGen.js is reactive: All execution depends on receiving a guide from DBConn
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
    //Make sure we didn't accidentally intercept an incorrect message
    if(message.from != "ext_messenger")
        return;

    //Use the received info to generate the sidebar, then create the prompt.
    try
    {
        sidebar = generateSidebar(message);
        document.body.appendChild(sidebar);
        createPrompt();
    }
    catch(error) { console.log(error); }
});
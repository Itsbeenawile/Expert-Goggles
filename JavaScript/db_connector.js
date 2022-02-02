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

//Encapsulate database connection code inside a "class" called from the parser
function databaseConnector()
{

    //---------------------------------------------------------------------------------------------
    // Initial Setup
    //---------------------------------------------------------------------------------------------

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

    //Initialize Firebase connection w/ that config, then save connections to the DB tables.
    firebase.initializeApp(firebaseConfig);
    const error_db = firebase.firestore().collection("Error Reports");
    const his_db = firebase.firestore().collection("User History");

    //Use Firebase's Anonymous Sign-in on instantiation
    var uid;
    firebase.auth().signInAnonymously()
        .catch((error) => { console.log("Anonymous Sign in Failed: " + error.message); });

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

    //---------------------------------------------------------------------------------------------
    // Helper Functions
    //---------------------------------------------------------------------------------------------

    /**
    *   hashCode() is a private helper function to generate string hashcodes. It is used because
    *   URLs are a necessary identifier for our Firestore configuration, but '/' is disallowed
    *   in Firestore IDs.
    *
    *   Credits (modified code): Bob Jenkins (http://www.burtleburtle.net/bob/hash/doobs.html)
    *   Parameter: ks -- a keystring to hash.
    *   Returns: A string with a hash unique to the parameter.
    */

    var hashCode = function(ks)
    {
        let hash = 0;
        let keyString = String(ks);

        for(let charIndex = 0; charIndex < keyString.length; ++charIndex)
        {
            hash += keyString.charCodeAt(charIndex);
            hash += hash << 10;
            hash ^= hash >> 6;
        }
        hash += hash << 3;
        hash ^= hash >> 11;

        //4,294,967,295 is FFFFFFFF, the maximum 32 bit unsigned integer value, used as a mask.
        return (((hash + (hash << 15)) & 4294967295) >>> 0).toString(16);
    }

    //---------------------------------------------------------------------------------------------
    // Database Connection Functions
    //---------------------------------------------------------------------------------------------

    /*
    *   The makeErrorReport() logs a user-reported error to the Error Reports table on the remote
    *   database. The data includes a URL to the reported page, timestamp of the most recent
    *   report, and an incremented number of reports made on that page.
    *   Parameter: URL -- the URL of the page where an error was reported.
    */

    this.makeErrorReport = function(URL)
    {
        console.log("Received an Error Report from the UI.");

        //Update or Create an Error Report for that URL
        error_db.doc(hashCode(URL)).set
        ({
            URL: URL,
            Most_Recent_Report: firebase.firestore.Timestamp.now(),
            Num_Reports: firebase.firestore.FieldValue.increment(1)
        }, {merge: true})
        .catch((error) =>
        {
            console.log("Error - could not upload error report. We'd ask you to report this but, "
                       +"ya know...", error);
        });
    }

    /*
    *   The saveToHistory() function creates an entry to the User History table. The information
    *   is stored in a collection named after the user's firebase ID, and includes the type of
    *   visualization detected, the URL where it was encountered, and a timestamp of the most
    *   recent encounter. A history report is made whenever a D3 vis. type is parsed.
    *   Parameter: info -- An object with at least URL and type fields for the report.
    */

    this.saveToHistory = function(info)
    {
        //Check we have necessary fields
        if(!uid || !info.URL || !info.type)
        {
            console.log("Attempted to save history without necessary info.");
            return;
        }

        //Set the doc specified by the URL hash (to avoid duplicates)
        //Use the user's specific history table.
        his_db.doc(uid).collection("history").doc(hashCode(info.URL)).set
        ({
            URL: info.URL,
            last_accessed: firebase.firestore.Timestamp.now(),
            vis_type: info.type
        })
        .catch((error) => { console.error("Error making User History Report: ", error);} );
    }

    //Return the encapsulated object
    return this;
}








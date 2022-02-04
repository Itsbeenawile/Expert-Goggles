/*
*                                   Expert Goggles Database Connector
*   db_connector.js defines a database connection object that encapsulates the functions for making
*   queries or updates to the extension's Firestore database. It includes the extension's firebase
*   configuration, connections to the User History and Error Reports tables, and functions for
*   updating both.
*/

"use strict";

function databaseConnector()
{

    //---------------------------------------------------------------------------------------------
    // Initial Setup
    //---------------------------------------------------------------------------------------------

    //The extension's configuration for connecting to Firebase.
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

    //Use Firebase's Anonymous Sign-in to obtain a unique user ID.
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
        else{console.log("Error in Anonymous User Tracking: User is not signed in.");}
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
    *   Parameter: keyString -- a string to hash.
    *   Returns: A string with a hash unique to the parameter.
    */

    var hashCode = function(keyString)
    {
        let hash = 0;
        let ks = String(keyString);

        for(let charIndex = 0; charIndex < ks.length; ++charIndex)
        {
            hash += ks.charCodeAt(charIndex);
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
    *   Parameter: URL -- A string of the URL where an error was reported.
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
        }, {merge: true}) //Merge: true allows incrementing instead of overwrite
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
    *   Parameter: info -- An object with at least visURL and type fields for the report.
    */

    this.saveToHistory = function(info)
    {
        //Ensure we have the necessary fields.
        if(!uid || !info.visURL || !info.type)
        {
            console.log("Attempted to make history report without necessary info.");
            return;
        }

        //his_db.doc(uid) references the current user's history collection.
        //doc(hashCode(info.visURL)) uses the URL as a key to avoid duplicate entries.
        his_db.doc(uid).collection("history").doc(hashCode(info.visURL)).set
        ({
            URL: info.visURL,
            last_accessed: firebase.firestore.Timestamp.now(),
            vis_type: info.type
        })
        .catch((error) => { console.error("Error making User History Report: ", error);} );
    }

    //Return all of the above encapsulated into an object. Requires 'new' keyword.
    return this;
}








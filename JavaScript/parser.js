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

function parser()
{

    //-------------------------------------------------------------------------------------------------
    // Internal Fields
    //-------------------------------------------------------------------------------------------------

    var supportedTypes; //Will hold the mappings loaded from supported_types.json

    //-------------------------------------------------------------------------------------------------
    // Helper Functions
    //-------------------------------------------------------------------------------------------------

    //The populateTypes() function loads the supported_types.json file, which contains the mappings
    //for visualization type parsing.

    var populateTypes = async function()
    {
        return fetch(chrome.extension.getURL("Assets/supported_types.json"))
               .then((response) => response.json())
               .then((responseJson) => {return responseJson;});
    }

    //Since the await keyword can only be used inside of async functions, waitForJson is used
    //to get the output of populateTypes()

    var waitForJson = async function() {supportedTypes = await populateTypes();}

    //Since type parsing directly returns a type string, the getGuideURL() function returns the
    //dataVizCatalog URL associated with that type

    this.getGuideURL = function(type)
    {
        let findEntry = supportedTypes.filter(entry => entry.type == type);
        return findEntry[0].URL;
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

    this.parseType = function(info)
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

        return possType;
    }

    //-------------------------------------------------------------------------------------------------
    // Main Execution
    //-------------------------------------------------------------------------------------------------

    //Load the Supported Types JSON File on Start
    waitForJson();

    return this;
}

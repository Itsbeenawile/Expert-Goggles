/**
*                              Expert Goggles Visualization Type Parser
*   parser.js defines a parser object that encapsulates the code necessary for visualization type
*   parsing. When instantiated, it loads the function-to-type mappings from supported_types.json,
*   then provides public-facing functions to parse a vis. type from a function list, and to supply
*   the corresponding URL to a datavizcatalog.com guide.
*/

function parser()
{
    //Load the supported_types.json file on instantiation
    var supportedTypes;
    waitForJson();

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
    //datavizcatalog.com URL associated with that type

    this.getGuideURL = function(type)
    {
        let findEntry = supportedTypes.filter(entry => entry.type == type);
        return findEntry[0].URL;
    }

    //-------------------------------------------------------------------------------------------------
    // Type Parsing Logic
    //-------------------------------------------------------------------------------------------------

    /*
    *   The parseType() function is the meat of the parser. It runs the list of D3 function calls
    *   against supported_types.json to try and determine the most likely visualization type. If it
    *   cannot determine the type, "unsupported" is returned.
    *   Parameter: info -- An object with at least the funcList field populated.
    *   Returns: A string containing the parsed vis. type, or "unsupported" if parse fails.
    */

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

    //Return all of the above encapsulated into an object. Requires 'new' keyword.
    return this;
}

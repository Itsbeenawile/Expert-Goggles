const expect = window.chai.expect;
const mocha = window.mocha;

//Loading functions to load the test-input.json file
async function getInput()
{
    //Fetch the test-input and return it.
    return fetch("../test-input.json")
           .then((response) => response.json())
           .then((responseJson) => {return responseJson;});
}

//Since the await keyword can only be used inside of async functions, waitForJson is used
//to get the output of populateTypes()

async function loadAndRun()
{
    testInput = await getInput();
    testParser();
}

function testParser()
{
    //Run the test on all inputs loaded from test-input.json
    describe("Running Parser Output Tests:", () =>
    {
        for(var index in testInput)
        {
            let entry = testInput[index];
            it("Input from  " + entry.URL + " should resolve to " + entry.Type + ".", () =>
            {
                expect(parser.parseType(entry.Functions)).to.equal(entry.Type);
            });
        }
    });
}

var testInput;
loadAndRun();
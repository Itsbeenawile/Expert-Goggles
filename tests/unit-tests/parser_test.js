const expect = window.chai.expect;
const mocha = window.mocha;

//Create an array to hold test input
let testObjs = [];

//Manually create test input according to visualizations encountered around the web.

testObjs.push( {"Area Chart":
["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "tsv", "area", "extent", "max", "axisBottom",
 "axisLeft", "format"]});

testObjs.push( {"Bar Chart":
["format", "linear", "0", "ordinal", "range", "axis", "select", "qualify", "csv", "dispatch", "rebind", "max",
 "transition"]});

testObjs.push( {"Box Plot":
["csv", "dispatch", "rebind", "functor", "select", "qualify", "ascending", "quantile", "range", "linear", "0",
 "format"]});

testObjs.push( {"Candlestick Chart":
["csv", "timeParse", "select", "min", "max", "scaleLinear", "scaleQuantize", "scaleBand", "range", "axisBottom",
 "axisLeft", "format", "zoom"]});

testObjs.push( {"Circle Packing Chart":
["select", "format", "pack", "json", "hierarchy"]});

testObjs.push( {"HeatMap":
["scaleSequential", "json", "select", "rgb"]});

testObjs.push( {"Histogram":
["select", "histogram", "ordinal", "linear", "0", "axis", "rebind", "range", "format", "min", "max", "bisect",
 "qualify", "transition"]});

testObjs.push( {"Line Chart":
["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "line", "tsv", "extent", "axisBottom",
 "axisLeft", "format"]});

testObjs.push( {"Pie Chart":
["select", "scaleOrdinal", "pie", "arc", "csv"]});

testObjs.push( {"Scatter Plot":
["linear", "0", "category10", "ordinal", "select", "qualify", "csv", "dispatch", "rebind", "keys", "merge",
 "extent", "axis", "range", "format", "transition"]});

testObjs.push( {"Sequences Sunburst":
["category20c", "ordinal", "select", "qualify", "partition", "hierarchy", "rebind", "arc", "json", "dispatch",
 "selectAll"]});

testObjs.push( {"Stacked Area Chart":
["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "scaleOrdinal", "stack", "area", "tsv",
 "extent", "axisBottom", "axisLeft", "format"]});

testObjs.push( {"Stacked Bar Chart":
["format", "ordinal", "range", "linear", "0", "category10", "axis", "select", "qualify", "tsv", "dispatch",
 "rebind", "stack", "permute", "max", "transition"]});

testObjs.push( {"Stream Graph":
["format", "scale", "linear", "0", "rebind", "axis", "area", "select", "qualify", "tsv", "dispatch", "extent",
 "min", "max", "bisect", "day" , "transition", "range"]});

testObjs.push( {"TreeMap":
["select", "interpolateRGB", "scaleOrdinal", "format", "treemap", "json", "hierarchy", "treemapResquarify",
 "selectAll", "timeout"]});

//Run the test on all inputs in testObjs
describe("Running parser output tests.", () =>
{
    for(var i in testObjs)
    {
        let name = Object.keys(testObjs[i])[0];
        let funcList = (testObjs[i])[name];
        it("Should correctly parse " + name + ".", () =>
        {
            expect(parser.parseType(funcList)).to.equal(name);
        });
    }
});
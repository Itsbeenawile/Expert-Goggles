// Create objects which contain list of d3 functions, confirm that parser reads functions and reaches correct conclusion

const chai = window.chai;
const expect = chai.expect;

const visLineChart = { };
visLineChart.funcList = ["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "line", "tsv", "extent", "axisBottom", "axisLeft", "format"];
visLineChart.sender = "ExpertGoggles";
visLineChart.iframeList = [];

const visAreaChart = { };
visAreaChart.funcList = ["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "area", "tsv", "extent", "max", "axisBottom", "axisLeft", "format"];
visAreaChart.sender = "ExpertGoggles";
visAreaChart.iframeList = [];

const visBarChart = { };
visBarChart.funcList = ["format", "linear", "0", "ordinal", "range", "axis", "select", "qualify", "csv", "dispatch", "rebind", "max", "transition"];
visBarChart.sender = "ExpertGoggles";
visBarChart.iframeList = [];

const visBoxPlot = { };
visBoxPlot.funcList = ["csv", "dispatch", "rebind", "functor", "select", "qualify", "acending", "quantile", "range", "linear", "0", "format"];
visBoxPlot.sender = "ExpertGoggles";
visBoxPlot.iframeList = [];

const visCirclePackingChart = { };
visCirclePackingChart.funcList = ["select", "format", "pack", "json", "hierarchy"];
visCirclePackingChart.sender = "ExpertGoggles";
visCirclePackingChart.iframeList = [];

const visDifferenceChart= { };
visDifferenceChart.funcList = ["format", "scale", "linear", "0", "rebind", "axis", "area", "select", "qualify", "tsv", "dispatch", "extent", "min", "max", "bisect", "day" , "transition", "range"];
visDifferenceChart.sender = "ExpertGoggles";
visDifferenceChart.iframeList = [];

const visHeatmap = { };
visHeatmap.funcList = ["scaleSequential", "json", "select", "rgb"];
visHeatmap.sender = "ExpertGoggles";
visHeatmap.iframeList = [];

const visHistogram = { };
visHistogram.funcList = ["select", "histogram", "ordinal", "linear", "0", "axis", "rebind", "range", "format", "min", "max", "bisect", "qualify", "transition"];
visHistogram.sender = "ExpertGoggles";
visHistogram.iframeList = [];

const visPieChart = {};
visPieChart.funcList = ["select", "scaleOrdinal", "pie", "arc", "csv"];
visPieChart.sender = "ExpertGoggles";
visPieChart.iframeList = [];

const visScatterPlot = {};
visScatterPlot.funcList = ["linear", "0", "category10", "ordinal", "select", "qualify", "csv", "dispatch", "rebind", "keys", "merge", "extent", "axis", "range", "format", "transition"];
visScatterPlot.sender = "ExpertGoggles";
visScatterPlot.iframeList = [];

const visSequencesSunburst = {};
visSequencesSunburst.funcList = ["category20c", "ordinal", "select", "qualify", "partition", "hierarchy", "rebind", "arc", "json", "dispatch", "selectAll"];
visSequencesSunburst.sender = "ExpertGoggles";
visSequencesSunburst.iframeList = [];

const visStackedAreaChart = {};
visStackedAreaChart.funcList = ["select", "timeParse", "scaleTime", "timeFormat", "scaleLinear", "scaleOrdinal", "stack", "area", "tsv", "extent", "axisBottom", "axisLeft", "format"];
visStackedAreaChart.sender = "ExpertGoggles";
visStackedAreaChart.iframeList = [];

const visStackedBarChart = {};
visStackedBarChart.funcList = ['format', 'ordinal', 'range', 'linear', '0', 'category10', 'axis', 'select', 'qualify', 'tsv', 'dispatch', 'rebind', 'stack', 'permute', 'max', 'transition'];
visStackedBarChart.sender = "ExpertGoggles";
visStackedBarChart.iframeList = [];

const visTreemap = {};
visTreemap.funcList = ["select", "interpolateRGB", "scaleOrdinal", "format", "treemap", "json", "hierarchy", "treemapResquarify", "selectAll", "timeout"];
visTreemap.sender = "ExpertGoggles";
visTreemap.iframeList = [];

describe('All guide types should be properly recognized', () => {
    it('Line Charts should be recognized', () => {
        expect(parseType(visLineChart)).to.equal('Line Chart')
    })
    it('Area Charts should be recognized', () => {
       expect(parseType(visAreaChart)).to.equal('Area Chart')
    })
    it('Bar Charts should be recognized', () => {
        expect(parseType(visBarChart)).to.equal('Bar Chart')
     })
     it('Box Plots should be recognized', () => {
        expect(parseType(visBoxPlot)).to.equal('Box Plot')
     })
     it('Circle Packing Charts should be recognized', () => {
        expect(parseType(visCirclePackingChart)).to.equal('Circle Packing Chart')
     })
     it('Difference Chart should be recognized', () => {
        expect(parseType(visDifferenceChart)).to.equal('Difference Chart')
     })
     it('Heatmap should be recognized', () => {
        expect(parseType(visHeatmap)).to.equal('HeatMap')
     })
     it('Histogram should be recognized', () => {
        expect(parseType(visHistogram)).to.equal('Histogram')
     })
     it('Pie Chart should be recognized', () => {
        expect(parseType(visPieChart)).to.equal('Pie Chart')
     })
     it('Scatter Plot should be recognized', () => {
        expect(parseType(visScatterPlot)).to.equal('Scatter Plot')
     })
     it('Sequences Sunburst should be recognized', () => {
        expect(parseType(visSequencesSunburst)).to.equal('Sequences Sunburst')
     })
     it('Stacked Area Chart should be recognized', () => {
        expect(parseType(visStackedAreaChart)).to.equal('Stacked Area Chart')
     })
     it('Stacked Bar Chart should be recognized', () => {
        expect(parseType(visStackedBarChart)).to.equal('Stacked Bar Chart')
     })
     it('Treemap should be recognized', () => {
        expect(parseType(visTreemap)).to.equal('TreeMap')
     })
})
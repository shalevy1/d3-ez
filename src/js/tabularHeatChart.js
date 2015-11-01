/**
 * Tabular Heat Chart
 *
 * @example
 * var myChart = d3.ez.tabularHeatChart();
 * d3.select("#chartholder")
 *     .datum(data)
 *     .call(myChart);
 */
d3.ez.tabularHeatChart = function module() {
    // SVG container (Populated by 'my' function)
    var svg;

    // Default Options (Configurable via setters)
    var width = 600;
    var height = 600;
    var margin = {top: 40, right: 40, bottom: 40, left: 40};
    var transition = {ease: "bounce", duration: 500};
    var classed = "tabularHeatChart";
    var colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];

    // Data Options (Populated by 'init' function)
    var domain = null;
    var minValue = 0;
    var maxValue = 0;
    var numCols = 0;
    var numRows = 0;
    var gridSize = 0;
    var colNames = [];

    var rowNames = [];
    var colorScale = undefined;

    // Dispatch (Custom events)
    var dispatch = d3.dispatch("customHover");

    function init(data) {
        // Group and Category Names
        colNames = data.map(function(d) { return d.key; });
        numCols = colNames.length;

        /*
         The following bit of code is a little dirty! Its purpose is to identify the complete list of row names.
         In some cases the first (index 0) set of values may not contain the complete list of key names.
         This typically this happens in 'matrix' (site A to site B) type scenario, for example where no data
         would exist where both site A is the same as site B.
         The code therefore takes the list of keys from the first (index 0) set of values and then concatenates
         it with the last (index max) set of values, finally removing duplicates.
         */
        var a =[];
        var b =[];
        data.map(function(d) { return d.values; })[0].forEach(function(d, i) {
            a[i] = d.key;
        });
        data.map(function(d) { return d.values; })[numCols-1].forEach(function(d, i) {
            b[i] = d.key;
        });
        rowNames = b.concat(a.filter(function (element) {
            return b.indexOf(element) < 0;
        }));
        numRows = rowNames.length;

        gridSize = Math.floor((width - (margin.left + margin.right)) / d3.max([numCols, numRows]));

        // Calculate the Max Value
        var values = [];
        d3.map(data).values().forEach(function(d) {
            d.values.forEach(function(d) {
                values.push(d.value);
            });
        });
        // maxValue = d3.quantile(values, 0.95) + 5;
        minValue = d3.min(values);
        maxValue = d3.max(values);

        domain = [ minValue, maxValue ];

        // Colour Scale
        colorScale = d3.scale.quantile()
            .domain(domain)
            .range(colors);
    }

    function my(selection) {
        selection.each(function(data) {
            // Initialise Data
            init(data);

            // Create SVG element (if it does not exist already)
            if (!svg) {
                svg = d3.select(this)
                    .append("svg")
                    .classed("d3ez", true)
                    .classed(classed, true);

                var container = svg.append("g").classed("container", true);
                container.append("g").classed("x-axis axis", true);
                container.append("g").classed("y-axis axis", true);
                container.append("g").classed("cards", true);
            }

            // Update the outer dimensions
            svg.transition().attr({width: width, height: height});

            // Update the inner dimensions
            svg.select(".container")
                .attr({transform: "translate(" + margin.left + "," + margin.top + ")"});

            var deck = svg.select(".cards").selectAll(".deck")
                .data(data);

            deck.enter().append("g")
                .attr("class", "deck")
                .attr("transform", function(d, i) {
                    return "translate(0, " +  ((colNames.indexOf(d.key)) * gridSize) + ")";
                });
            deck.transition()
                .attr("class", "deck");

            var cards = deck.selectAll(".card")
                .data(function(d) {
                    // Map row, column and value to new data array
                    var ret = [];
                    d3.map(d.values).values().forEach(function(v, i) { ret[i] = {row: d.key, column: v.key, value: v.value} });
                    return ret;
                });

            cards.enter().append("rect")
                .attr("x", function(d) { return (rowNames.indexOf(d.column)) * gridSize; })
                .attr("y", 0)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("class", "card")
                .attr("width", gridSize)
                .attr("height", gridSize)
                .on("click", dispatch.customHover);

            cards.transition()
                .duration(1000)
                .style("fill", function(d) { return colorScale(d.value); });

            cards.select("title").text(function(d) { return d.value; });

            cards.exit().remove();

            var colLabels = svg.select(".x-axis").selectAll(".colLabel")
                .data(colNames)
                .enter().append("text")
                .text(function (d) { return d; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * gridSize; })
                .style("text-anchor", "end")
                .attr("transform", "translate(-6," + gridSize / 2 + ")")
                .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "colLabel mono axis axis-workweek" : "colLabel mono axis"); });

            var rowLabels = svg.select(".y-axis").selectAll(".rowLabel")
                .data(rowNames)
                .enter()
                .append("g")
                .attr("transform", function(d, i) {
                    return "translate(" +  ((i * gridSize) + (gridSize / 2)) + ", -6)";
                })
                .append("text")
                .text(function(d) { return d; })
                .style("text-anchor", "start")
                .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "rowLabel mono axis axis-worktime" : "rowLabel mono axis"); })
                .attr("transform", function(d) {
                    return "rotate(-90)"
                });
        });
    }

    // Configuration Getters & Setters
    my.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return this;
    };

    my.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return this;
    };

    my.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return this;
    };

    my.colors = function(_) {
        if (!arguments.length) return colors;
        colors = _;
        return this;
    };

    my.domain = function(_) {
        if (!arguments.length) return domain;
        domain = _;
        return this;
    };

    my.accessor = function(_) {
        if (!arguments.length) return accessor;
        accessor = _;
        return this;
    };

    d3.rebind(my, dispatch, "on");

    return my;
};
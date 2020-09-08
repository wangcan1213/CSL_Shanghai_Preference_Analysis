$(function () {
    // get data
    const data_obj_raw = JSON.parse($('#data').text());
    const r2 = data_obj_raw.r2;
    delete data_obj_raw.r2;
    const varname_labels = {
        'Move': 'Move (vs. Stay)',
        'Commute Distance': 'Commute Distance (km)',
        'Rent': 'Monthly Rent ($100)',
        'Large Size': 'Large Size (vs. Small)',
        'Density': 'Population Density (100 persons/ha)',
        'Income Disparity': 'Income Disparity'
    }
    let data_obj = new Object();
    for (let key in data_obj_raw) {
        data_obj[varname_labels[key]] = data_obj_raw[key];
    };
    data_obj['Monthly Rent ($100)'] = data_obj['Monthly Rent ($100)'] * 100;
    data_obj['Population Density (100 persons/ha)'] = data_obj['Population Density (100 persons/ha)'] * 100;
    console.log(data_obj);

    const varnames = Object.keys(data_obj);
    const params = Object.values(data_obj);
    const data = Object.entries(data_obj);
    const text_margin = 10;


    var viewBox_width = 2100,
        viewBox_height= 800,
        margin = {top: 100, right: 50, bottom: 50, left: 70},
        width = viewBox_width - margin.left - margin.right,
        height = viewBox_height - margin.top - margin.bottom;

    // in case that all parameters are negative, make the top margin larger
    var all_negative = true;
    for (let key in data_obj_raw) {
        if (data_obj_raw[key] > 0) {
            all_negative = false;
            break;
        }
    }
    if (all_negative) {
        console.log("All negative");
        margin['top'] = 180;
    }


    var svg = d3.select('.svg-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${viewBox_width}, ${viewBox_height}`)
        .attr('preserveAspectRatio', 'xMidYMid'); //it's a width viewport, so YMin/YMid doesn't matter

    // axes scale
    var xScale = d3.scaleBand().range([0, width]).padding(0.25),
        yScale = d3.scaleLinear().range([height, 0]);
    xScale.domain(varnames);
    yScale.domain([d3.min(params), d3.max(params)]);

    var g = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
               .attr('class', 'figure');

    //bars
    g.selectAll(".bar")
        .data(data).enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d[0]); })
        .attr("y", function (d) {
            if (d[1] >= 0) {
                return yScale(d[1]);
            } else {
                return yScale(0);
            }
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d) {
            if (d[1] >= 0) {
                return yScale(0)-yScale(d[1]);
            } else {
                return yScale(d[1]) - yScale(0);
            }
        })
        .style("fill", function (d) {
            if (d[1] >= 0) {
                return "green";
            } else {
                return  "red";
            }
        });

    // text labels
    g.selectAll(".text-label")
        .data(data).enter().append("text")
        .attr('class', 'text-label')
        .text(function (d) {
            return d[1].toFixed(2);
        })
        .attr('text-anchor', 'middle')
        .attr('x', function (d) {
            return xScale(d[0]) + xScale.bandwidth()/2;
        })
        .attr('y', function (d) {
            if (d[1] >= 0) {
                return yScale(d[1]) + 30 + text_margin;
            } else {
                return yScale(d[1]) - text_margin;
            }

        })
        .attr('fill', 'white')
        .style('font-size', '30px');

    // axes
    g.append("g")
        .attr("transform", "translate(0," + yScale(0) + ")")
        .attr('class', 'x-axis')
        .call(d3.axisBottom(xScale))
        .selectAll(".tick text")
        .call(wrap, 50);

    g.append("g")
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).ticks(5));
    d3.select('.x-axis').selectAll('text').style('font-size', '30px');
    d3.select('.y-axis').selectAll('text').style('font-size', '30px');

    // adjust the position of tick labels whose values are negative
    $.each(data, function (index, value) {
        if (value[1] < 0) {
            let text_node = $(`text[class="${value[0]}"]`);
            let tspan_list = text_node.children('tspan');
            let n_tspan = tspan_list.length;
            $.each(tspan_list, function (index, tspan) {
                $(tspan).attr('dy', (parseFloat($(tspan).attr('dy')) - n_tspan*1.1 - 0.3) + 'em');
            })
        }
    })

    if (r2 >= 0.6) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is quite likely to be overfitted, you are suggest to play more experiments.`);
    } else if (r2 >= 0.2) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is excellent!`);
    } else if (r2 >= 0.1) {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is OK.`);
    } else {
        $('li.r2').text(`McFadden's R2 = ${r2.toFixed(3)}, which is not so good.`);
    }


});

// redirect
$(function () {
    $('#change_model_type_1').click(function () {
        if ($('#change_model_type_1').text() === 'Switch to Mean Population Preference') {
            window.location.href = "/chart-population";
        } else if ($('#change_model_type_1').text() === 'Switch to Your Preference') {
            window.location.href = "/chart-ego";
        } else if ($('#change_model_type_1').text() === 'Switch to Preference Diversity') {
            window.location.href = "/mxlogit";
        }
    })
})

$(function () {
    $('#change_model_type_2').click(function () {
        if ($('#change_model_type_2').text() === 'Switch to Mean Population Preference') {
            window.location.href = "/chart-population";
        } else if ($('#change_model_type_2').text() === 'Switch to Your Preference') {
            window.location.href = "/chart-ego";
        } else if ($('#change_model_type_2').text() === 'Switch to Preference Diversity') {
            window.location.href = "/mxlogit";
        }
    })
})


function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            originText = text.text(),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).attr('class', originText)
                    .append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

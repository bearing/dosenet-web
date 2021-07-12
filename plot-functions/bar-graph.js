function plotBarGraph(data, locations) {
    var avgCpms = [];
    locations.forEach((location) => {
        let cpmSum = 0;
        let dataPoints = 0;
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < locations.length; j++) {
                if (data[i][j]["location"] === location) {
                    if (data[i][j]["avg_cpm"] != "NaN") {
                        cpmSum += Number(data[i][j]["avg_cpm"]);
                        dataPoints++;
                    }
                }
            }
        }

        if (dataPoints === 0)
            avgCpms.push(0);
        else
            avgCpms.push(cpmSum / dataPoints);
    });
    Plotly.newPlot('graph1',
    // trace
    [{
        x: locations,
        y: avgCpms,
        type: 'bar'
    }],
    // layout
    {
        automargin: true,
        title: 'Average Counts per Minute Over Selected Time Period Month',
        autosize: false,
        width: 1140,
        height: 600,
        margin: {
            l: 110,
            r: 50,
            b: 225,
            t: 65,
            pad: 10
        },
        yaxis: {
            /*title: 'µSv/hr',*/
            title: 'Average CPM',
        }
    },
    {showSendToCloud: true});
}

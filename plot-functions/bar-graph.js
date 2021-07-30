// helper function that gets the avg
function getAvg(data, locations, type, norm=false) {
    var avgData = [];
    locations.forEach((location) => {
        let dataSum = 0;
        let dataPoints = 0;
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < locations.length; j++) {
                if (data[i][j]["location"] === location) {
                    if (data[i][j][`avg_${type}`] != "NaN") {
                        dataSum += Number(data[i][j][`avg_${type}`]);
                        dataPoints++;
                    }
                }
            }
        }

        if (dataPoints === 0)
            avgData.push(0);
        else {
            if (norm) {
                avgData.push((dataSum / dataPoints) / norm);
            }
            else {
                avgData.push(dataSum / dataPoints);
            }
        }
    });
    return avgData;
}

function plotBarGraph(data, locations, types, norm=false) {

    // let avgCpms = getAvg(data, locations, "humidity");

    let allAvgs = []
    types.forEach((type, i) => {
        let avgs;
        if (norm) {
            avgs = getAvg(data, locations, type, norm[type]);
        }
        else {
            avgs = getAvg(data, locations, type);
        }
        allAvgs.push({
            x: locations,
            y: avgs,
            name: type,
            type: 'bar',
            // test: (i+1),
            // xaxis: "xaxis",
            // yaxis: "y" + (2-i),
            // yaxis: "y" + (i+1),
            // offsetgroup: (i),
            // offset: i,
        });
    });
    console.log("🚀 ~ file: bar-graph.js ~ line 31 ~ plotBarGraph ~ allAvgs", allAvgs)
    
    // console.log(getAvg(data, locations, "humidity"));

    // console.log(data);

    // console.log("🚀 ~ file: bar-graph.js ~ line 31 ~ plotBarGraph ~ allAvgs", allAvgs)
    // console.log(allAvgs);

    Plotly.newPlot('graph1',
    // trace
    allAvgs,
    // [
    //   {
    //     x: locations,
    //     y: getAvg(data, locations, "temperature"),
    //     name: "temperature",
    //     type: 'bar',
    //     // xaxis: "xaxis",
    //     yaxis: "y2",
    //   },
    //   {
    //     x: locations,
    //     y: getAvg(data, locations, "humidity"),
    //     name: "humidity",
    //     type: 'bar',
    //     // xaxis: "xaxis",
    //     yaxis: "y2",
    //   },
    // ],

    // layout
    {
        automargin: true,
        title: 'Averages Over Selected Time Period Month',
        barmode: 'group',
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
        // xaxis: {
        //     title: 'Location',
        // },
        yaxis: {
            /*title: 'µSv/hr',*/
            title: 'Averages',
        },
        // yaxis2: {
        //     title: 'Averages 2',
        // },
    },
    {showSendToCloud: true});
}

function plotTimeSeries(data) {
    function unpack(key) {
        let arr = data[0].map( (row) => row[key] );
        for (let i = 1; i < data.length; i++) {
            arr = arr.concat( data[i].map( (row) => row[key] ) );
        }
        return arr;
        /*fix with web server local host 8000 by running python -m http.server on git bash*/
    }
    var trace1 = {
        type: "scatter",
        mode: "markers",
        x: unpack('deviceTime_local'),
        y: unpack("cpm"),
        error_y: {
            type: 'data',
            array: unpack("cpmError"),
        },
    }
    var layout1 = {
        title: 'Etcheverry Roof',
        xaxis: {
            autorange: true,
            range: ['2018-04-15 20:01:06', '2019-04-13 23:51:00'],
            title: 'Time (America/Los Angeles)',
            rangeselector: {
                buttons: [{
                    count: 1,
                    label: '1d',
                    step: 'day',
                    stepmode: 'backward',
                }, {
                    count: 7,
                    label: '1w',
                    step: 'day',
                    stepmode: 'backward',
                }, {
                    count: 1,
                    label: '1m',
                    step: 'month',
                    stepmode: 'backward',
                }, {
                    count: 6,
                    label: '6m',
                    step: 'month',
                    stepmode: 'backward',
                }, {step: 'all'},
            ]},
            type: 'date',
            rangeslider: {}
        },
        automargin: true,
        autosize: false,
        width: 1140,
        height: 500,
        margin: {
            l: 110,
            r: 50,
            b: 90,
            t: 80,
            pad: 2
        },
        yaxis: {
            autorange: true,
            range: [2, 3],
            title: 'CPM',
        }
    };

    Plotly.newPlot('graph1', [trace1], layout1, {showSendToCloud: true});
}

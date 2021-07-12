let fileCount = 0;
let filePath = "";
let fileName = "";

let plot;

function setupGraph(plotFunc, path, file) {
    filePath = path;
    fileName = file;
    plot = plotFunc;
    // get data from metadata file
    $.getJSON(path + "metadata.json", function( data ) {
        try {
            fileCount = data.file_count;
        }
        catch (TypeError) {
            console.log("The file [" + file + "] does not exist in [metadata.json].");
        }
        fileCount = data.file_count;
        graphFiles(0, fileCount);
    })
    .fail(function( jqxhr, textStatus, error ) {
        console.log("Loading [metadata.json] Failed: " + textStatus + ", " +  error);
    });
}




// graphFiles("etch_roof_year", 0, 5);

function graphFiles(startFile, endFile) {
    let data = [];
    let filesRemaining = endFile - startFile;

    for (let i = startFile; i < endFile; i++) {
        Plotly.d3.csv(filePath + fileName + "_" + i + ".csv", function(csv) {
            data.push(csv);
            filesRemaining--;
            if (filesRemaining === 0)
                plot(data);
        });
    }
}

let sliderVals = [0, 0];

// the slider counts months from 2000, where 0 is January 2000
$( function() {
    $( "#slider-range" ).slider({
        range: true,
        min: 0,
        max: 5,
        step: 1,
        // starting values
        values: [0, 5],
        // what happens when the
        slide: function( event, ui ) {
            if(ui.values[ 0 ] === ui.values[ 1 ]){
                return false;
            }
            sliderVals = ui.values;
            $( "#amount" ).val(ui.values[ 0 ] + " - " + ui.values[1]);
        }
    });
    // DEFAULT, STARTING SET UP
    sliderVals = $( "#slider-range" ).slider( "values");
    $( "#amount" ).val($( "#slider-range" ).slider( "values", 0 ) + " - " + $( "#slider-range" ).slider( "values", 1 ));
});
// link to info: https://jqueryui.com/slider/#range

function sliderChanged() {
    graphFiles(sliderVals[0], sliderVals[1]);
}

$(document).ready(function() {
    $(document).click(function() {
        sliderChanged();
    });
    $(".ui-slider-handle").click(function() {
        sliderChanged();
    });
});

// function plot(data) {
    //     function unpack(key) {
        //         let arr = data[0].map( (row) => row[key] );
        //         for (let i = 1; i < data.length; i++) {
            //             arr = arr.concat( data[i].map( (row) => row[key] ) );
            //         }
            //         return arr;
            //         /*fix with web server local host 8000 by running python -m http.server on git bash*/
            //     }
            //     var trace1 = {
                //         type: "scatter",
                //         mode: "markers",
                //         x: unpack('deviceTime_local'),
                //         y: unpack("cpm"),
                //         error_y: {
                    //             type: 'data',
                    //             array: unpack("cpmError"),
                    //         },
                    //     }
                    //     var layout1 = {
                        //         title: 'Etcheverry Roof',
                        //         xaxis: {
                            //             autorange: true,
                            //             range: ['2018-04-15 20:01:06', '2019-04-13 23:51:00'],
                            //             title: 'Time (America/Los Angeles)',
                            //             rangeselector: {
                                //                 buttons: [{
                                    //                     count: 1,
                                    //                     label: '1d',
                                    //                     step: 'day',
                                    //                     stepmode: 'backward',
                                    //                 }, {
                                        //                     count: 7,
                                        //                     label: '1w',
                                        //                     step: 'day',
                                        //                     stepmode: 'backward',
                                        //                 }, {
                                            //                     count: 1,
                                            //                     label: '1m',
                                            //                     step: 'month',
                                            //                     stepmode: 'backward',
                                            //                 }, {
                                                //                     count: 6,
                                                //                     label: '6m',
                                                //                     step: 'month',
                                                //                     stepmode: 'backward',
                                                //                 }, {step: 'all'},
                                                //             ]},
                                                //             type: 'date',
                                                //             rangeslider: {}
                                                //         },
                                                //         automargin: true,
                                                //         autosize: false,
                                                //         width: 1140,
                                                //         height: 500,
                                                //         margin: {
                                                    //             l: 110,
                                                    //             r: 50,
                                                    //             b: 90,
                                                    //             t: 80,
                                                    //             pad: 2
                                                    //         },
                                                    //         yaxis: {
                                                        //             autorange: true,
                                                        //             range: [2, 3],
                                                        //             title: 'CPM',
                                                        //         }
                                                        //     };
                                                        //
                                                        //     Plotly.newPlot('graph1', [trace1], layout1, {showSendToCloud: true});
                                                        // } // end of function doSomething()

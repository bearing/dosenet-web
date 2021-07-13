const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let filePath = "";
let locations = [];
let fileName = "";
let startDateStr = "";
let startDate;
let monthGap = 1;

let fileCount = 1;

let plot;


let sliderVals = [0, 1];

// function parseDateRangeStr(dateRangeStr) {
//     let years = parseInt(dateRangeStr[1].substring(0,4)) - parseInt(dateRangeStr[0].substring(0,4));
//     let months = parseInt(dateRangeStr[1].substring(5)) - parseInt(dateRangeStr[0].substring(5));
//     return years * 12 + months;
// }

function displayDate(date) {
    return month[date.getUTCMonth()] + ", " + date.getUTCFullYear()
}

function displayDateRange(startFile, endFile) {
    return displayDate(monthDelta(startDate, startFile)) + " - " + displayDate(monthDelta(startDate, endFile));
}

function monthDelta(date, delta){
    let m = date.getUTCMonth() + delta;
    let y = date.getUTCFullYear();
    while (m < 0 || m > 11) {
        if (m < 0) {
            m += 12;
            y--;
        }
        else { // m > 11
            m -= 12;
            y++;
        }
    }
    return new Date(y, m);
}

function setupGraph(plotFunc, path) {
    filePath = path;
    plot = plotFunc;
    // get data from metadata file
    $.getJSON(path + "metadata.json", function( data ) {
        try {
            locations = data.display_names;
            fileName = data.file_name;
            fileCount = data.file_count;
            startDateStr = data.start_date;
            startDate = new Date(startDateStr);
            console.log(startDate.toUTCString());
            monthGap = data.month_gap;
            console.log(locations, fileName, fileCount, startDateStr, monthGap);
        }
        catch (TypeError) {
            console.log("The file [" + file + "] does not exist in [metadata.json].");
        }
        graphFiles(0, fileCount);
        sliderVals = [0, fileCount];
        setupSlider();
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
            // console.log
            if (filesRemaining === 0)
                plot(data, locations);
        });
    }
}


// the slider counts months from 2000, where 0 is January 2000
function setupSlider() {
    $( "#slider-range" ).slider({
        range: true,
        min: 0,
        max: fileCount,
        step: 1,
        // starting values
        values: sliderVals,
        // what happens when the
        slide: function( event, ui ) {
            if(ui.values[ 0 ] === ui.values[ 1 ]){
                return false;
            }
            sliderVals = ui.values;
            $( "#amount" ).val(displayDateRange(ui.values[0], ui.values[1]));
        }
    });
    // DEFAULT, STARTING SET UP
    sliderVals = $( "#slider-range" ).slider( "values");
    $( "#amount" ).val(displayDateRange($("#slider-range").slider("values", 0), $( "#slider-range" ).slider("values", 1 )));
}
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
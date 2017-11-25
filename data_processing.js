var nentries = 0;
var sample_size = 1;
var start_date = new Date();
var end_date = new Date();
var data_string_map = new Map();
var timeParMap = new Map();
var colors = [];
var data_map = new Map();
var bin_size;
var time_bins = [];
var colorMap = new Map();

// timeParMap structure:
//   key = selected time range
//   value = [absolute time range,max nentries,data compression factor]
timeParMap.set('hour',[3600*1000,13,1]);
timeParMap.set('day',[24*3600*1000,289,6]);
timeParMap.set('week',[7*24*3600*1000,2017,12]);
timeParMap.set('month',[30*24*3600*1000,8641,48]);
timeParMap.set('year',[365*24*3600*1000,105121,288]);
timeParMap.set('All',[365*24*3600*10000,1000000,1]);

var calibMap = new Map();
// calibMap structure: key = unit, value = calibration
calibMap.set('CPM',[1.0,1.0]);
calibMap.set('mrem/hr',[0.0036,0.00000427]);
calibMap.set('&microSv/hr',[0.036,0.0000427]);
calibMap.set('air travel/hr',[0.420168067*0.036,0.420168067*0.0000427]);
calibMap.set('cigarettes/hr',[0.00833333335*0.036,0.00833333335*0.0000427]);
calibMap.set('X-rays/hr',[0.2*0.036,0.2*0.0000427]);

function componentToHex(c) {
   var hex = c.toString(16);
   return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
   return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Set sample size based on number of entries available rather than time window
function get_sample_size(nentries) {
 // sample such that there are roughly 150 entries max
 var sample = Math.floor(nentries/150);
 if( sample === 0 ) sample = 1;
 return sample;
}

//var url = '<main-page>/sites/default/files/dosenet/pinewood.csv?'
//+ Math.random().toString(36).replace(/[^a-z]+/g, '');
// - to solve browser caching issue
function parse_date(input) {
 var parts = input.replace('-',' ')
                  .replace('-',' ')
                  .replace(':',' ')
                  .replace(':',' ')
                  .replace('+',' ')
                  .replace('-',' ')
                  .split(' ');
 // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
 // Note: months are 0-based
 //tz_date = this_date.toLocaleString('UTC', { timeZone: timezone });
 this_date =  new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
 return this_date;
}

/**
* Convert hsv values to an rgb(r,g,b) string. Taken from MochiKit.Color. This
* is used to generate default series colors which are evenly spaced on the
* color wheel.
* @param { number } hue Range is 0.0-1.0.
* @param { number } saturation Range is 0.0-1.0.
* @param { number } value Range is 0.0-1.0.
* @return { string } "rgb(r,g,b)" where r, g and b range from 0-255.
* @private
*/
function hsvToRGB(hue, saturation, value) {
 var red;
 var green;
 var blue;
 if (saturation === 0) {
   red = value;
   green = value;
   blue = value;
 } else {
   var i = Math.floor(hue * 6);
   var f = (hue * 6) - i;
   var p = value * (1 - saturation);
   var q = value * (1 - (saturation * f));
   var t = value * (1 - (saturation * (1 - f)));
   switch (i) {
     case 1: red = q; green = value; blue = p; break;
     case 2: red = p; green = value; blue = t; break;
     case 3: red = p; green = q; blue = value; break;
     case 4: red = t; green = p; blue = value; break;
     case 5: red = value; green = p; blue = q; break;
     case 6: // fall through
     case 0: red = value; green = t; blue = p; break;
   }
 }
 red = Math.floor(255 * red + 0.5);
 green = Math.floor(255 * green + 0.5);
 blue = Math.floor(255 * blue + 0.5);
 hex = rgbToHex(red,green,blue);
 return hex;
}

function set_colors(locations){
 ncolors = locations.length;
 var sat = 1.0;
 var val = 0.5;
 var half = Math.ceil(ncolors / 2);
 for (var i = 0; i < ncolors; i++) {
   var idx = i % 2 ? (half + (i + 1)/ 2) : Math.ceil((i + 1) / 2);
   var hue = (1.0 * idx / (1 + ncolors));
   colorStr = hsvToRGB(hue, sat, val);
   colors.push(colorStr);
   colorMap.set(locations[i],colorStr);
 }
}

function get_colors(locations){
 if( colors.length===0 ) set_colors(locations);
 return colorMap;
}

function reset_colors(){
 colors = [];
 colorMap.forEach( function(color, this_location, colorMap) {
   colors.push(color);
 });
}

function singleErrorPlotter(e) {
 var ctx = e.drawingContext;
 var points = e.points;
 var g = e.dygraph;
 var color = e.color;
 ctx.save();
 ctx.strokeStyle = e.color;

 for (var i = 0; i < points.length; i++) {
   var p = points[i];
   var center_x = p.canvasx;
   if (isNaN(p.y_bottom)) continue;

   var low_y = g.toDomYCoord(p.yval_minus),
       high_y = g.toDomYCoord(p.yval_plus);

   ctx.beginPath();
   ctx.moveTo(center_x, low_y);
   ctx.lineTo(center_x, high_y);
   ctx.stroke();
 }

 ctx.restore();
}

function get_time_pars(time,newest_date,ndata) {
 var oldest_date = new Date(newest_date.getTime() - timeParMap.get(time)[0]);
 var nbins = Math.min(ndata,timeParMap.get(time)[1]);
 return [oldest_date,nbins];
}

function set_time_bins(start_date,end_date,bin_size){
 var time_array = [];
 // fill array with bin center with start date as low edge of first bin
 var this_date = new Date(start_date.getTime() + bin_size/2);
 while( this_date.getTime() < end_date.getTime() ) {
   time_array.push(this_date);
   // high edge of bin becomes new low edge
   this_date = new Date(this_date.getTime() + bin_size);
 }
 return time_array;
}

function find_nearest_date(alist, date, delta) {
 var first = 0;
 var last = alist.length-1;
 var found = false;
 var index = -1;

 while( first<=last && !found ) {
   var midpoint = Math.floor((first + last)/2);
   if( Math.abs(alist[midpoint].getTime()-date.getTime()) < delta ) {
     index = midpoint;
     found = true;
   }
   else {
     if( date.getTime() < alist[midpoint].getTime() )
       last = midpoint-1;
     else
       first = midpoint+1;
   }
 }

 return index;
}

function get_time_range(text,time,timezone) {
 var lines = text.split("\n");
 oldest_index = 2;
 if( lines.length-2 > 0 )
   oldest_index = lines.length-2;
 var oldest_data = lines[lines.length-2].split(",");
 var newest_data = lines[1].split(",");
 var time_index = 1;
 if ( timezone=="UTC" ) time_index = 0;
 var newest_date = new Date(parse_date(newest_data[time_index]));
 var oldest_date = new Date(parse_date(oldest_data[time_index]));

 var time_pars = get_time_pars(time,newest_date,lines.length);
 oldest_date = time_pars[0];

 // Get data for maximum number of entries from all data inputs
 nentries = Math.max(nentries,time_pars[1]);
 // Reset sample_size based on new maximum number of data points
 sample_size = get_sample_size(nentries);
 if( time== "All" ) sample_size = 1;
 // Go back as far as we can based on current range of available data
 if( oldest_date < start_date ) start_date = oldest_date;
 // Go to the most current date for all input data
 if( newest_date > end_date ) end_date = newest_date;
}

function process_time_csv(text,dose,timezone) {
 var data_input = [];
 var lines = text.split("\n");
 var scale = calibMap.get(dose)[0];

 for( var i = 0; i < nentries+1; ++i ) {
   if( i < 1 ) { continue; } // skip first line(s) with meta-data
   if( lines.length < i-1 ) continue; // move on if there are fewer than nentries in input files
   var line = lines[i];
   time_index = 1;
   if ( timezone=="UTC" ) time_index = 0;
   if (typeof line != 'undefined') {
     if(line.length>3) {
       var data = line.split(",");
       var x = new Date(parse_date(data[time_index]));
       var y = parseFloat(data[3]);
       var y_err = parseFloat(data[4]);
       data_input.push([x,[y*scale,y_err*scale]]);
     }
   }
 }
 data_input.sort((function(index){
   return function(a,b){
     return a[index].getTime() - b[index].getTime();
   };
 })(0));

 return data_input;
}

function process_d3s_csv(text,dose,timezone) {
 var data_input = [];
 var lines = text.split("\n");
 var scale = calibMap.get(dose)[1];

 for( var i = 1; i < nentries+1; ++i ) {
   if( lines.length < i-1 ) continue; // move on if there are fewer than nentries in input files
   var line = lines[i];
   time_index = 1;
   if ( timezone=="UTC" ) time_index = 0;
   if (typeof line != 'undefined') {
     if(line.length>3) {
       var data = line.split(",");
       var x = new Date(parse_date(data[time_index]));
       var y = parseFloat(data[3]);
       var y_err = parseFloat(data[4]);
       data_input.push([x,[y*scale,y_err*scale]]);
     }
   }
 }
 data_input.sort((function(index){
   return function(a,b){
     return a[index].getTime() - b[index].getTime();
   };
 })(0));

 return data_input;
}

function process_d3s_spectrum(text) {
 var channel_sums = [];
 var lines = text.split("\n");

 for(var i = 1; i < nentries+1; ++i ) {
   if( lines.length < i-1 ) continue; // move on if there are fewer than nentries in input files
   var line = lines[i];
   if(typeof line != 'undefined') {
     var data = line.split(",");
     for( var j = 5; j < data.length; ++j) {
       if( i==1 ) channel_sums.push(parseFloat(data[j]));
       else channel_sums[j-5] += parseFloat(data[j]);
     }
   }
 }

 channel_count_data = [];
 for( var i = 0; i < channel_sums.length; ++i) {
   channel_count_data.push([i,[channel_sums[i],Math.sqrt(channel_sums[i])]]);
 }

 return channel_count_data;
}

function process_csv(text,dose,time,timezone) {
 var raw_data = [];
 var data_input = [];
 var lines = text.split("\n");

 for( var i = 0; i < nentries+1; ++i ) {
   if( i < 1 ) { continue; } // skip first line(s) with meta-data
   if( lines.length < i-1 ) continue; // move on if there are fewer than nentries in input files
   var line = lines[i];
   time_index = 1;
   if ( timezone=="UTC" ) time_index = 0;
   if (typeof line != 'undefined') {
     if(line.length>3) {
       var data = line.split(",");
       var x = new Date(parse_date(data[time_index]));
       if( x.getTime() < start_date.getTime() ) { continue; }
       var y = parseFloat(data[6]);
       raw_data.push([x,y]);
     }
   }
 }

 var scale = calibMap.get(dose);
 data_input = average_data(raw_data,sample_size,scale);
 return data_input;
}

function process_csv_average(text,dose,timezone) {
 var average = 0;
 var count = 0;
 var lines = text.split("\n");
 var scale = calibMap.get(dose)[0];

 for( var i = 0; i < nentries+1; ++i ) {
   if( i < 1 ) { continue; } // skip first line(s) with meta-data
   if( lines.length < i-1 ) continue; // move on if there are fewer than nentries in input files
   var line = lines[i];
   time_index = 1;
   if ( timezone=="UTC" ) time_index = 0;
   if (typeof line != 'undefined') {
     if(line.length>3) {
       var data = line.split(",");
       var x = new Date(parse_date(data[time_index]));
       if( x.getTime() < start_date.getTime() ) { continue; }
       var y = parseFloat(data[3]);
       average += y;
       count += 1;
     }
   }
 }
 error = Math.sqrt(average)/parseFloat(count)*scale;
 average = average/parseFloat(count)*scale;
 return [average,error];
}

function average_data(raw_data,sample_size,scale)
{
 var averaged_data = [];
 var npoints = Math.floor(raw_data.length/sample_size);
 for(n=0; n < npoints; n++){
   sub_data = raw_data.slice(n*sample_size,(n+1)*sample_size);
   var average = 0;
   for(i=0;i<sub_data.length;i++)
   {
     var this_data = sub_data[i];
     average += this_data[1]*5; // total counts was already averaged over 5 minute interval
   }
   error = Math.sqrt(average)/sub_data.length/5;
   average = average/sub_data.length/5;
   var d = Math.floor(sub_data.length/2);
   var mid_data = sub_data[d];
   var date = mid_data[0];
   averaged_data.push([date,[average*scale,error*scale]]);
 }
 averaged_data.sort((function(index){
   return function(a,b){
     return a[index].getTime() - b[index].getTime();
   };
 })(0));
 return averaged_data;
}

// Maps each time bin to list of stations with [cpm,error] for that bin
function fill_binned_data(data_map,time_bins,bin_size) {
 var time_map = new Map();
 data_map.forEach( function(data, location, data_map ) {
   // If location not checked don't include in time_map
   if( !document.getElementById(location).checked ) return;
   for( var i=0; i<data.length; i++) {
     // date for each entry in data array for each location is the first element for that entry
     var this_date = data[i][0];
     // time bins is list of bin centers
     // each date should then be either half a bin before or after the bin center
     var this_bin = find_nearest_date(time_bins,this_date,bin_size/2);
     if( this_bin < 0 ) {
       continue;
     }
     var this_data = data[i][1]; // this is [cmp,error]
     // map data to given location for next step
     //   (need to know which locations went in to each bin)
     var this_data_map = new Map();
     this_data_map.set(location,this_data);
     if( time_map.has(this_bin) ) {
       time_map.get(this_bin).push(this_data_map);
     }
     else {
       var this_data_map_array = [];
       this_data_map_array.push(this_data_map);
       time_map.set(this_bin,this_data_map_array);
     }
   }
 });
 return time_map;
}

function fill_data_input(time_bins,time_map,locations) {
 var data_input = [];
 for ( var bin=0; bin<time_bins.length; bin++ ) {
   //There might not be data for every time bin...
   if( !time_map.has(bin) ) {
     continue;
   }

   var data_array = [];
   data_array.push(time_bins[bin]);
   for( var j=0; j<locations.length; j++ ) {
     var has_location = false;
     for( var i=0; i<time_map.get(bin).length; i++ ) {
       // if this entry for this time bin has data for this location add it to the data array for this time bin
       if( time_map.get(bin)[i].has(locations[j]) ) {
         data_array.push(time_map.get(bin)[i].get(locations[j]));
         has_location = true;
       }
     }
     if( !has_location )
       data_array.push(null); // if no data for this location give it a null entry
   }
   data_input.push(data_array);
 }
 return data_input;
}

function process_all_data(csv_map,dose,time) {
 // fill map with key = location, value = [time,[cpm,error]] array from csv file
 // Full map of all data for all locations
 // Set time binning based on full range of dates from all data
 csv_map.forEach( function(csv, location, csv_map ) {
   get_time_range(csv,time,'UTC');
 });
 // default bin size: add 5 minute increments from start (5*60*1000)
 // rebin by sample_size -> bin_size = default*sample_size
 bin_size = sample_size*5*60*1000;
 time_bins = set_time_bins(start_date,end_date,bin_size);
 nentries = time_bins.length*sample_size;

 // Now get and average all data based on full time range available for all locations
 data_map.clear();
 csv_map.forEach( function(csv, location, csv_map ) {
   var this_data = process_time_csv(csv,dose,'UTC');
   data_map.set(location,this_data);
 });

 // Now put all data into bins...
 var time_map = fill_binned_data(data_map,time_bins,bin_size);
 var data_input = fill_data_input(time_bins,time_map,get_key_array(csv_map));
 return data_input;
}

function get_averages(csv_map,dose) {
 var location_averages = [];
 var counter = 0;
 csv_map.forEach( function(csv, location, csv_map ) {
   get_time_range(csv,'month','UTC');
 });
 csv_map.forEach( function(csv, location, csv_map ) {
   var average = process_csv_average(csv,dose,'UTC');
   location_averages.push([counter,average]);
   counter = counter + 1;
 });
 return location_averages;
}

function reset_data(){
 colors = [];
 colorMap.forEach( function(color, location, colorMap) {
   if( !document.getElementById(location).checked ) return;
   colors.push(color);
 });
 var time_map = fill_binned_data(data_map,time_bins,bin_size);
 var data_input = fill_data_input(time_bins,time_map,get_key_array(colorMap));
 g.updateOptions({
   'file': data_input,
 });
}

function darkenColor(colorStr) {
 // Defined in dygraph-utils.js
 var color = Dygraph.toRGB_(colorStr);
 color.r = Math.floor((255 + color.r) / 2);
 color.g = Math.floor((255 + color.g) / 2);
 color.b = Math.floor((255 + color.b) / 2);
 return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}

function barChartPlotter(e) {
 var ctx = e.drawingContext;
 var points = e.points;
 var y_bottom = e.dygraph.toDomYCoord(0);

 ctx.fillStyle = darkenColor(e.color);

 var sep = points[1].canvasx - points[0].canvasx;
 var bar_width = Math.floor(2.0 / 3 * sep);

 // Do the actual plotting.
 for (var i = 0; i < points.length; i++) {
   var p = points[i];
   var center_x = p.canvasx;

   ctx.fillRect(center_x - bar_width / 2, p.canvasy,
       bar_width, y_bottom - p.canvasy);

   ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
       bar_width, y_bottom - p.canvasy);
 }
}

function plot_bar_chart(location_averages,locations,dose,div) {
 var title_text = "Average dose rate over last month";
 var y_text = dose;
 var npoints = locations.length;
 if ( dose=="&microSv/hr" ) { y_text = 'ÂµSv/hr'; }

 bar = new Dygraph(
   // containing div
   document.getElementById(div),
   location_averages,
   { title: title_text,
     ylabel: y_text,
     errorBars: true,
     includeZero: true,
     labels: ['location',y_text],
     plotter: barChartPlotter,
     xRangePad: 30,
     xLabelHeight: 50,
     drawXGrid: false,
     axes: {
       x: {
             axisLabelFormatter: function(x) {
                                               return locations[x];
                                             },
             valueFormatter: function(x) {
                                               return locations[x];
                                             },
             pixelsPerLabel: Math.floor(500/npoints)
          },
     }
   }
 );
}

function plot_spectra(location,spectra_input,time,div) {
 var title_text = 'Integrated spectrum';
 f = new Dygraph(
   document.getElementById(div),
   spectra_input,
   { title: title_text,
     errorBars: true,
     connectSeparatedPoints: false,
     drawPoints: true,
     pointSize: 1,
     showRangeSelector: false,
     sigFigs: 4,
     ylabel: 'counts',
     xlabel: 'channels',
     labels: ['channel','counts'],
     strokeWidth: 0.0,
     highlightCircleSize: 3,
     logscale: true,
     plotter: [
       singleErrorPlotter,
       Dygraph.Plotters.linePlotter
       ],
   }
 );
}

function plot_data(location,data_input,dose,timezone,data_labels,time,div) {
 var title_text = location;
 var y_text = dose;
 // add x-label to beginning of data label array
 time_label = 'Time ('+timezone+')';
 data_labels.unshift(time_label);
 if( time=="All" ) { title_text = 'All data for ' + title_text; }

 g = new Dygraph(
   // containing div
   document.getElementById(div),
   data_input,
   { title: title_text,
     errorBars: true,
     connectSeparatedPoints: false,
     drawPoints: true,
     pointSize: 3,
     showRangeSelector: true,
     sigFigs: 3,
     ylabel: y_text,
     xlabel: data_labels[0],
     labels: data_labels,
     strokeWidth: 0.0,
     highlightCircleSize: 5,
     plotter: [
       singleErrorPlotter,
       Dygraph.Plotters.linePlotter
       ],
     axes: {
       y: {
             //reserveSpaceLeft: 2,
             axisLabelFormatter: function(x) {
                                         var shift = Math.pow(10, 5);
                                         return Math.round(x * shift) / shift;
                                       }
          },
     }
   }
 );
}

function plot_d3s_data(location,data_input,dose,timezone,data_labels,time,div)
{
 var title_text = location;
 var y_text = dose;
 // add x-label to beginning of data label array
 time_label = 'Time ('+timezone+')';
 data_labels.unshift(time_label);
 if( time=="All" ) { title_text = 'All data for ' + title_text; }

 g = new Dygraph(
   // containing div
   document.getElementById(div),
   data_input,
   { title: title_text,
     errorBars: true,
     connectSeparatedPoints: false,
     drawPoints: true,
     pointSize: 3,
     showRangeSelector: false,
     sigFigs: 3,
     ylabel: y_text,
     xlabel: data_labels[0],
     labels: data_labels,
     strokeWidth: 0.0,
     highlightCircleSize: 5,
     plotter: [
       singleErrorPlotter,
       Dygraph.Plotters.linePlotter
       ],
     axes: {
       y: {
             //reserveSpaceLeft: 2,
             axisLabelFormatter: function(x) {
                                         var shift = Math.pow(10, 5);
                                         return Math.round(x * shift) / shift;
                                       }
          },
     }
   }
 );
}

function add_data_string(data,location) {
 data_string_map.set(location,data);
}

function process_urls(url_array,locations) {
 var csv_get_done = [];
 $.each(url_array,function(i,url) {
   csv_get_done.push($.get(url, function(data) {
     add_data_string(data,locations[i]);
   }, dataType='text'));
 });
 return csv_get_done;
}

function get_key_array(map) {
 var key_array = [];
 map.forEach( function(value, key, map) {
   key_array.push(key);
 });
 return key_array;
}

function get_bar_chart(url_array,locations,dose,div) {
 data_string_map.clear();
 var location_averages = [];
 csv_get_done = process_urls(url_array,locations);
 $.when.apply($, csv_get_done).then( function() {
   var return_locations = get_key_array(data_string_map);
   location_averages = get_averages(data_string_map,dose);
   plot_bar_chart(location_averages,return_locations,dose,div);
 });
}

function get_all_data(url_array,locations,dose,time,div) {
 data_string_map.clear();
 csv_get_done = process_urls(url_array,locations);
 $.when.apply($, csv_get_done).then( function() {
   var return_locations = get_key_array(data_string_map);
   get_colors(return_locations);
   colorMap.forEach( function(color, location, colorMap ) {
     document.getElementById(location+'_div').style.color = color;
     document.getElementById(location).checked = true;
   });
   var data_input = [];
   data_input = process_all_data(data_string_map,dose,time);
   plot_data("All locations",data_input,dose,"local time zone",return_locations,time,div);
   g.updateOptions({
     colors: colors,
   });
 });
}

function data_reset(){
 start_date = new Date();
 end_date = new Date();
 nentries = 0;
}

function get_data(url,location,timezone,dose,time,div) {
 $.get(url, function (data) {
     var data_input = []; // Clear any old data out before filling!
     data_reset();
     get_time_range(data,time,timezone);
     data_input = process_time_csv(data,dose);
     var data_label = [];
     if ( dose=="&microSv/hr" ) { data_label.push("ÂµSv/hr"); }
     else data_label.push(dose);
     plot_data(location,data_input,dose,timezone,data_label,time,div);
 },dataType='text');
}

function get_d3s_data(url,location,timezone,dose,time,div) {
 $.get(url, function (data) {
     var data_input = []; // Clear any old data out before filling!
     data_reset();
     get_time_range(data,time,timezone);
     data_input = process_d3s_csv(data,dose);
     var data_label = [];
     if ( dose=="&microSv/hr" ) { data_label.push("ÂµSv/hr"); }
     else data_label.push(dose);
     plot_d3s_data(location,data_input,dose,timezone,data_label,time,div);
 },dataType='text');
}

function get_d3s_spectra(url,location,time,div) {
 $.get(url, function(data) {
   var data_input = [];
   data_input = process_d3s_spectrum(data);
   plot_spectra(location,data_input,time,div);
 },dataType='text');
}

var map; // Google Map Object
var berkeley = [37.872269, -122.258901];
var markers = [];
var json_vals = [];
var marks = [];
// url for geoJSON file
var url = '/test/tmp/output.geojson?'
	+ Math.random().toString(36).replace(/[^a-z]+/g, '');

	// - to solve browser caching issue
var json = jQuery(jQuery.parseJSON(JSON.stringify(jQuery.getJSON(url))));
var parsed_json = '';
var time = '';
var dose = '';
var dosimeter_name = '';
var graph_url = '';
var selected_marker = '';
var selected_val = '';
var unitMap = new Map();
var d3sMap = new Map();
var data;

var isGraphDisplayed = false;
var graphX;
var graphY;

window.addEventListener("DOMContentLoaded", (event) => {
    document.getElementById('map-canvas').addEventListener("click", onMapClick, false); 
});

document.getElementById("graph").style.visibility = "hidden";

// These two functions should be temporary until this can be done in makeGeoJSON as we phase out plot.ly
function getURL(val,time,sensor_type){
	var csv = val.properties["csv_location"];
	var sensor_text = "";

	if( sensor_type=="pocket")
		sensor_text = time;
	else
		sensor_text = sensor_type + '_' + time;
	var url;
	url = '/test/tmp/dosenet/' + csv + '_' + sensor_text + '.csv?'
	  + Math.random().toString(36).replace(/[^a-z]+/g, ''); // To solve browser caching issue
	console.log(url);
	return url;
}

function getName(val){
	var name = val.properties["Name"];
	return name;
}

function getTZ(val){
	var tz = val.properties["timezone"];
	return tz;
}

function updateInfowindowContent(val){
	console.log(val.properties["Name"]);
	var graph = document.getElementById("graph");
	graph.style.left = graphX;
	graph.style.top = graphY;
	graph.style.visibility = "visible";	
	graph.style.position = "absolute";
	graph.style.width = "400px";
	graph.style.height = "350px";

	if (graph.innerHTML.indexOf("Download Data") === -1) {
        //Downloading the data --> adapted from data_download.js		
		var url = '/test/tmp/output.geojson'+'?' + Math.random().toString(36).replace(/[^a-z]+/g, '');
		jQuery.getJSON(url, function(data){
	    	jQuery.getJSON('/test/tmp/link_info.json', function(key_info) {
				var csv = val.properties["csv_location"];
				var csv_file = csv + '.csv'
				var key = key_info[csv_file]
				var csv_url = 'https://dl.dropboxusercontent.com/s/' + key + '/' + csv_file + '?dl=1'
				graph.insertAdjacentHTML('afterbegin', `<a href= ${csv_url} style="background: #FFFFFF">Download Data \n</a>`);
		});
		});
	}

	//updates the pop up info window
	var time = getTimeframe();
	var sensor = getSensor();
	var dose = getDoseUnit();
	var plotoptions = "";
	if( sensor != "pocket" && sensor != "adc" )
		plotoptions = getPlotOptions();
	var url = getURL(val,time,sensor);
	var name = getName(val);
	var timezone = getTZ(val);

	var node_name = dose + '_' + time + '_' + name;
	//var content_string = '<div id="' + node_name + '"" style="max-width:500px; max-height=400px"><div id="graph_div"></div></div>';
	var content_string = '<div id="graph_wrapper_div"><div id="graph_div"></div></div>';
	if( sensor == "d3s" ) {
		//change graphs based on selected plot option from the drop down selector
	    if( plotoptions == "Dose Plot") {
    		content_string = '<div id="graph_wrapper_div"><div id="only_small_graph_div"></div></div>';
  			get_d3s_data(url.toString(),name.toString(),timezone,
  						 dose,time,"graph",false);
    	} else if( plotoptions == "Integrated Spectrum") {
      		content_string = '<div id="graph_wrapper_div"><div id="only_spectra_div"></div></div>';
  			get_d3s_spectra(url.toString(),name.toString(),time,"graph");
    	} 
	} else if( sensor == "aq" ) {
		content_string = '<div id="graph_wrapper_div"><div id="only_small_graph_div"></div></div>';
		get_aq_data(url.toString(),name.toString(),timezone,plotoptions,time,"graph",true);
	} else if( sensor == "weather" ) {
		content_string = '<div id="graph_wrapper_div"><div id="only_small_graph_div"></div></div>';
		get_weather_data(url.toString(),name.toString(),timezone,plotoptions,time,"graph",true);
		
	} else if( sensor == "adc") {
		content_string = '<div id="graph_wrapper_div"><div id="only_small_graph_div"></div></div>';
		get_co2_data(url.toString(),name.toString(),timezone,time,"graph",true);
	} else {
		get_data(url.toString(),name.toString(),timezone,
				 dose,time,"graph");
	}
	
	isGraphDisplayed = true;
	
	dragGraphListner();

	return content_string;
}

// Time units for a plot, called in updateInfowindowContent
function getTimeframe(){
	var sel_time = document.getElementById('time_dropdown');
	return sel_time.options[sel_time.selectedIndex].value;
}

// Dose units for a plot, called in updateInfowindowContent
function getDoseUnit(){
	var sel = document.getElementById('dose_dropdown');
	return sel.options[sel.selectedIndex].value;
}

// Sensor type for plot, called in updateInfowindowContent
function getSensor(){
	var sel = document.getElementById('sensor_list');
	var sensor = sel.options[sel.selectedIndex].value;
	if ( sensor == "A")
		sensor = "d3s";
	else if ( sensor == "B" )
		sensor = "aq";
	else if ( sensor == "C" )
		sensor = "weather";
	else if ( sensor == "Co2" )
		sensor = "adc";
	return sensor;
}

// Options for which plots shown, called in updateInfowindowContent
function getPlotOptions() {
	try {
		var sel_option = document.getElementById('plotoptions_dropdown');
		return sel_option.options[sel_option.selectedIndex].value;
	}catch (error){
		console.log(error);
		return null
	}
}

function repopulateMarkers(sensor_type){
	//repopulate the markers on the map
	if (sensor_type === "d3s") {
		initMap("has_d3s");
	}
	else if (sensor_type=="aq") {
		initMap("has_aq");
	}
	else if (sensor_type =="adc") {
		initMap("has_co2");
	}
	else if (sensor_type=="weather") {
		initMap("has_w");
	}
	else {initMap("");}


	json_vals = []
	jQuery.getJSON(url, function(data){
		jQuery.each(data.features, function(key, val){
			if( sensor_type=="d3s" && !val.properties["has_d3s"])
				return true;
			if( sensor_type=="aq" && !val.properties["has_aq"])
				return true;
			if( sensor_type=="adc" && !val.properties["has_co2"])
				return true;
			if( sensor_type=="weather" && !val.properties["has_w"])
				return true;
	        
	        json_vals.push(val);
	    });
		
	});
}

function defaultPlotOptions() {
  //plot options should not be visible when the page is loaded
	//called with window.onload in the <head> of dosenet_map.html
	//may need to change to hidden attribute to not appear while page is loading
  var plot_option = document.getElementById('plotoptions_dropdown');
  var plot_label = document.getElementById('plotoptions_label');
  plot_option.style.visibility = "hidden";
  plot_label.style.visibility = "hidden";
}
jQuery(defaultPlotOptions);

function hidePlotOptions() {
	//hide plot option drop down selector when certain sensors are selected
  var sel_option = document.getElementById('sensor_list');
	var plot_option = document.getElementById('plotoptions_dropdown');
  var plot_label = document.getElementById('plotoptions_label');
  sensor_val = sel_option.options[sel_option.selectedIndex].value;
  if (sensor_val == "pocket") {
    plot_option.style.visibility = "hidden";
    plot_label.style.visibility = "hidden";
  } else if (sensor_val == "A") {
    plot_option.style.visibility = "visible";
    plot_label.style.visibility = "visible";
  } else if (sensor_val == "B") {
    plot_option.style.visibility = "visible";
    plot_label.style.visibility = "visible";
  } else if (sensor_val == "Co2") {
    plot_option.style.visibility = "hidden";
    plot_label.style.visibility = "hidden";
	} else if (sensor_val == "C") {
		plot_option.style.visibility = "visible";
		plot_label.style.visibility = "visible";
	}
}

function changePlotOptions(value) {
	//changes plot options based on which sensor is selected
	var PlotOptions = {
		A: ["Dose Plot","Integrated Spectrum"],
		B: ["1.0 PM","2.5 PM","10 PM","All Plots"],
		C: ["Temperature","Pressure","Humidity"], //removed all plots, complicated graphing
		pocket: [],
		Co2: [],
	}
	var catOptions = "";
    for (categoryId in PlotOptions[value]) {
        catOptions += "<option>"+PlotOptions[value][categoryId]+"</option>";
    }
    document.getElementById("plotoptions_dropdown").innerHTML = catOptions;
}

function changeSensor(){
	var sensor_type = getSensor();
	repopulateMarkers(sensor_type);
	hidePlotOptions();
}

function changeDoseUnits(){
	setHTML_units();
	for (var i = 0; i < markers.length; i++) {
		var label_text = getLabelContent(json_vals[i],"pocket");
		markers[i].labelVisible = false;
		markers[i].setOptions({ labelContent: label_text });
		markers[i].labelVisible = true;
	}
}

function getDosimeterCoords(index){
	var lat = json.features[index].geometry.coordinates[1];
	var lon = json.features[index].geometry.coordinates[0];
	return [lat, lon]
}

function getSelectedDosimeterIndex(){
	var sel = document.getElementById('dosimeter_list');
	var index = sel.selectedIndex;
	dosimeter_name = sel.options[sel.selectedIndex].value;
	return index;
}

function goToDosimeter(){
	var index = getSelectedDosimeterIndex() - 1; //subtract by 1 to fix indexing error
	var centerLocation = getDosimeterCoords(index);

	var sensor_type = getSensor();

	var map = document.getElementById('map-canvas'); 

	var data = [
		{
			type: "scattermapbox",
			text: [],
			lon: [],
			lat: [],
			marker: { 
				color: "#FF007F", 
				size: 8, 
				symbol: "circle"},
			hovertemplate: []
		}
	];

	var layout = {
		dragmode: "zoom",
		mapbox: { style: "open-street-map", center: { lat: centerLocation[0], lon: centerLocation[1] }, zoom: 9 },
		margin: { r: 0, t: 0, b: 0, l: 0},
		width: map_rounded.clientWidth - 40,
		height: 550,
		hoverlabel: {font: {size: 15}}
	};

	if (sensor_type === "d3s") {
		string = "has_d3s";
	}
	else if (sensor_type=="aq") {
		string = "has_aq";
	}
	else if (sensor_type =="adc") {
		string = "has_co2";
	}
	else if (sensor_type=="weather") {
		string = "has_w";
	}
	else {string = "";}

	var value;
	if (string === "has_w") {
		value = "-1";
	}
	else if (string === "has_d3s") {
		value = "counts";
	}
	else if (string === "has_aq") {
		value = "PM25";
	}
	else if (string === "has_co2")  {
		value = "co2_ppm";
	}
	else {
		value = "CPM";
	}

    jQuery.getJSON(url, function (jsonData) {
		json = jsonData;
		//adds lat, lon, name, and correct string for the hover to data 
        jQuery.each(jsonData.features, function(key, val) {
			if (string === "") {
				data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
                data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String(value)]) + " " + value;
				data[0].hovertemplate.push(tempStr);
			}
			else if (value === "-1" && val.properties[string]) {
				data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
				data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String("temperature")]) + " C, \n " + Number(val.properties[String("humidity")]) + "%, \n ";
				tempStr +=  Number(val.properties[String("pressure")]) + " Pa";
				data[0].hovertemplate.push(tempStr);
			}
            else if (val.properties[string] ) {
                data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
				data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String(value)]) +" " + value;
                data[0].hovertemplate.push(tempStr);
            }		
        });
        
	Plotly.newPlot("map-canvas", data, layout);
	
	const map_rounded = document.getElementById('map_rounded');
		
	map.style.top = String(600) + "px";
	map.style.left = String(map_rounded.offsetLeft) + "px";
	map.style.width = String(map_rounded.clientWidth) + "px";
	const childDivs = map.querySelectorAll('div');

	// Set maxWidth for each child div
	childDivs.forEach(function(div) {
	div.style.maxWidth = String(map_rounded.clientWidth) + "px"; // Replace '400px' with your desired value
	});


	graphX = String(map_rounded.offsetLeft + map.width/2 + 50) + "px";
	graphY = String(950) + "px";


	//Event listner for click on map (aka marker event listner)
	map.on('plotly_click', function(clickdata){
		layout.mapbox.center.lat = parseFloat(String(clickdata.points[0].data.lat[clickdata.points[0].pointIndex]));;
		layout.mapbox.center.lon = parseFloat(String(clickdata.points[0].data.lon[clickdata.points[0].pointIndex]));
		layout.mapbox.center.lat = layout.mapbox.center.lat + (17/ 6378) * (180 / Math.PI); //accounts for curvature of Earth
		
		layout.mapbox.zoom = 9;
		Plotly.redraw("map-canvas");

		var device;
		jQuery.each(json.features, function(key, val) {
			if (val.properties.Name === data[0].text[clickdata.points[0].pointIndex]) {
				device = val;
			}
		});	
		updateInfowindowContent(device);
	   });		
	});
}

function getCoords(val){
	return {
		lon : val.geometry.coordinates[0],
		lat : val.geometry.coordinates[1]
	}
}

function SetUnitMap(){
	unitMap.set("CPM",["CPM",1.0,1]);
	unitMap.set("mrem/hr",["CPM",0.0036,4]);
	unitMap.set("&microSv/hr",["CPM",0.036,3]);
	unitMap.set("air travel/hr",["CPM",0.036*0.420168067,4]);
	unitMap.set("cigarettes/hr",["CPM",0.036*0.00833333335,4]);
	unitMap.set("X-rays/hr",["CPM",0.036*0.2,4]);
}

function SetD3SUnitMap(){
	d3sMap.set("CPM",["counts",1.0/5.0,4]);
	d3sMap.set("mrem/hr",["counts",0.00000427/5.0,4]);
	d3sMap.set("&microSv/hr",["counts",0.0000427/5.0,4]);
	d3sMap.set("air travel/hr",["counts",0.420168067*0.0000427,4]);
	d3sMap.set("cigarettes/hr",["counts",0.00833333335*0.0000427,4]);
	d3sMap.set("X-rays/hr",["counts",0.2*0.0000427,4]);
}

function getLabelContent(val,sensor_type){
	selected_unit = getDoseUnit();
	latest_val = 0;
	if( sensor_type=="aq" ) {
		latest_val = val.properties["PM25"];
		selected_unit = "PM 2.5";
	}
	if( sensor_type=="adc" ) {
		latest_val = val.properties["co2_ppm"];
		selected_unit = "ppm";
	}
	if( sensor_type=="weather" ) {
		latest_val = val.properties["temperature"];
		selected_unit = "C";
	}
	if( sensor_type=="d3s" ) {
		latest_val = (val.properties[d3sMap.get(selected_unit)[0]]*d3sMap.get(selected_unit)[1]).toFixed(d3sMap.get(selected_unit)[2]);
	}
	if( sensor_type=="pocket")
		latest_val = (val.properties[unitMap.get(selected_unit)[0]]*unitMap.get(selected_unit)[1]).toFixed(unitMap.get(selected_unit)[2]);
	return ("&nbsp" + latest_val + "&nbsp" + selected_unit + "&nbsp");
}

function dragGraphListner() {
	var graph = document.getElementById("graph");
	var mouseX = 0;
	var mouseY = 0;
	var movedX = 0;
	var movedY = 0;

	graph.onmousedown = function dragMouseDown(e) {
	  e.preventDefault();
	  
	  mouseX = e.clientX;
	  mouseY = e.clientY;

	  document.onmouseup = function() {
									document.onmouseup = null;
									document.onmousemove = null;};

	  document.onmousemove = function(e) {
										  e.preventDefault();
										  movedX = mouseX - e.clientX;
										  movedY = mouseY - e.clientY;
										  mouseX = e.clientX;
										  mouseY = e.clientY;

										  graphX = graph.offsetLeft - movedX;
										  graphY = graph.offsetTop - movedY;
										  
										  graph.style.left = String(graphX) + "px"; 
										  graph.style.top = String(graphY) + "px";
	  									}
										  
	};
  }

function onMapClick(e) {
	var graph = document.getElementById("graph");
	if (isGraphDisplayed) {
		graph.innerHTML = "";
		graph.style.visibility = "hidden";
		isGraphDisplayed = false;
	}
} 

function initMap(string) {   
	var map = document.getElementById('map-canvas'); 
	var data = [
		{
			type: "scattermapbox",
			text: [],
			lon: [],
			lat: [],
			marker: { 
				color: "#FF007F", 
				size: 8, 
				symbol: "circle"},
			hovertemplate: []
		}
	];

	const map_rounded = document.getElementById('map_rounded');

	var layout = {
		dragmode: "zoom",
		mapbox: { style: "open-street-map", center: { lat: 0, lon: -15 }, zoom: 1 },
		margin: { r: 0, t: 0, b: 0, l: 0},
		width: map_rounded.clientWidth - 40,
		height: 550,
		hoverlabel: {font: {size: 15}}
	};

	var value;
	if (string === "has_w") {
		value = "-1";
	}
	else if (string === "has_d3s") {
		value = "counts";
	}
	else if (string === "has_aq") {
		value = "PM25";
	}
	else if (string === "has_co2")  {
		value = "co2_ppm";
	}
	else {
		value = "CPM";
	}

    jQuery.getJSON(url, function (jsonData) {
		json = jsonData;

		//adds the stations to the dosimeter_list
		jQuery.each(jsonData.features, function(key, val){
			$ = jQuery.noConflict();
			$("#dosimeter_list").append($("<option />").text(val.properties["Name"]));
			document.getElementById("dosimeter_list").style.visibility = "visible";
		});

		//adds lat, lon, name, and correct string for the hover to data 
        jQuery.each(jsonData.features, function(key, val) {
			if (string === "") {
				data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
                data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String(value)]) + " " + value;
				data[0].hovertemplate.push(tempStr);
			}
			else if (value === "-1" && val.properties[string]) {
				data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
				data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String("temperature")]) + " C, \n " + Number(val.properties[String("humidity")]) + "%, \n ";
				tempStr +=  Number(val.properties[String("pressure")]) + " Pa";
				data[0].hovertemplate.push(tempStr);
			}
            else if (val.properties[string] ) {
                data[0].lat.push(Number(val.geometry.coordinates[1]));
                data[0].lon.push(Number(val.geometry.coordinates[0]));
				data[0].text.push(String(val.properties["Name"] || ""));
				let tempStr = "" + Number(val.properties[String(value)]) +" " + value;
                data[0].hovertemplate.push(tempStr);
            }		
        });
        Plotly.newPlot("map-canvas", data, layout);

		
		map.style.top = String(600) + "px";
	    map.style.left = String(map_rounded.offsetLeft) + "px";
		map.style.width = String(map_rounded.clientWidth) + "px";

		const childDivs = map.querySelectorAll('div');

		// Set maxWidth for each child div
		childDivs.forEach(function(div) {
		div.style.maxWidth = String(map_rounded.clientWidth) + "px"; // Replace '400px' with your desired value
		});


		graphX = String(map_rounded.offsetLeft + map.width/2 + 50) + "px";
		graphY = String(950) + "px";

		//Event listner for click on map (aka marker event listner)
		map.on('plotly_click', function(clickdata){
			layout.mapbox.center.lat = parseFloat(String(clickdata.points[0].data.lat[clickdata.points[0].pointIndex]));;
			layout.mapbox.center.lon = parseFloat(String(clickdata.points[0].data.lon[clickdata.points[0].pointIndex]));
			layout.mapbox.center.lat = layout.mapbox.center.lat + (19/ 6378) * (180 / Math.PI); //accounts for curvature of Earth
			
			layout.mapbox.zoom = 9;
			Plotly.redraw("map-canvas");

			var device;
			jQuery.each(jsonData.features, function(key, val) {
				if (val.properties.Name === data[0].text[clickdata.points[0].pointIndex]) {
					device = val;
				}
			});	
			updateInfowindowContent(device);
			
		});		
    }); 
}


window.onload=function() {
	var graph = document.getElementById("graph"); 
	graph.style.background = "#FFFFFF";

	initMap("");
	SetUnitMap();
	SetD3SUnitMap();
	
	console.log('getting station info from json file:'+url);

	//logic for the buttons below the images
	const buttons = document.querySelectorAll(".button");
	buttons.forEach((button, index) => {
		button.addEventListener('click', () => {
			var sectionNum;
			
			if (index === 3 || index === 5) {
				sectionNum = 2;
			}
			else if (index === 4) {
				sectionNum = 4;
			}
			else if (index === 6) {
				sectionNum = 3;
			}
			else if (index === 7){
				sectionNum = 5;
			}
			else {
				sectionNum = -1;
			}
			if (sectionNum === -1) {
				window.location.href = "https://radwatch.berkeley.edu/background-radiation/";
			}
			else {
				window.location.href = `https://radwatch.berkeley.edu/background-radiation/#section${sectionNum-1}`;
			}
		});
	});
};

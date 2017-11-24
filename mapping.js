var map; // Google Map Object
var berkeley = [37.872269, -122.258901];
var markers = [];
var json_vals = [];
var markerCluster;
var marks = [];
var infowindow = new google.maps.InfoWindow();
// url for geoJSON file
var url = '/sites/default/files/output.geojson?'
	+ Math.random().toString(36).replace(/[^a-z]+/g, '');
	// - to solve browser caching issue
var json = $($.parseJSON(JSON.stringify($.getJSON(url))));
var parsed_json = '';
var time = '';
var dose = '';
var dosimeter_name = '';
var graph_url = '';
var selected_marker = '';
var selected_val = '';
var unitMap = new Map();
var mapOptions = {
   center: new google.maps.LatLng(-34.397, 150.644),
   zoom: 1,
   minZoom: 1
};

var allowedBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(85, -180),           // top left corner of map
	new google.maps.LatLng(-85, 180)            // bottom right corner
  );

function setMapBounds(){
	var k = 5.0;
	var n = allowedBounds.getNorthEast().lat() - k;
	var e = allowedBounds.getNorthEast().lng() - k;
	var s = allowedBounds.getSouthWest().lat() + k;
	var w = allowedBounds.getSouthWest().lng() + k;
	var neNew = new google.maps.LatLng( n, e );
	var swNew = new google.maps.LatLng( s, w );
	boundsNew = new google.maps.LatLngBounds( swNew, neNew );
	map.fitBounds(boundsNew);
}

function centerMap(center){
	var mapCenter = new google.maps.LatLng(center[0], center[1]);
	map.setCenter(mapCenter);
}

// These two functions should be temporary until this can be done in makeGeoJSON as we phase out plot.ly
function getURL(val,time,sensor_type){
	var csv = val.properties["csv_location"];
	var sensor_text = "";
	if( sensor_type=="pocket")
		sensor_text = time;
	else
		sensor_text = sensor_type + '_' + time;
	var url;
	url = '/sites/default/files/dosenet/' + csv + '_' + sensor_text + '.csv?'
	  + Math.random().toString(36).replace(/[^a-z]+/g, ''); // To solve browser caching issue
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
	//updates the marker pop up info window
	var time = getTimeframe();
	console.log(time);
	var dose = getDoseUnit();
	console.log(dose);
	var plotoptions = getPlotOptions();
	console.log(plotoptions);
	var sensor = getSensor();
	var url = getURL(val,time,sensor);
	var name = getName(val);
	var timezone = getTZ(val);

	var node_name = dose + '_' + time + '_' + name;
	//var content_string = '<div id="' + node_name + '"" style="max-width:500px; max-height=400px"><div id="graph_div"></div></div>';
	var content_string = '<div id="graph_wrapper_div"><div id="graph_div"></div></div>';
	if( sensor == "d3s" ) {
		console.log("d3s");
		//change graphs based on selected plot option from the drop down selector
    if( plotoptions == "Dose Plot") {
      content_string = '<div id="graph_wrapper_div"><div id="only_small_graph_div"></div></div>';
  		get_d3s_data(url.toString(),name.toString(),timezone,
  					 dose,time,"only_small_graph_div");
    } else if( plotoptions == "Integrated Spectrum") {
      content_string = '<div id="graph_wrapper_div"><div id="only_spectra_div"></div></div>';
  		get_d3s_spectra(url.toString(),name.toString(),time,"only_spectra_div");
    } else {
      content_string = '<div id="graph_wrapper_div"><div id="small_graph_div"></div><div id="spectra_div"></div></div>';
  		get_d3s_data(url.toString(),name.toString(),timezone,
  					 dose,time,"small_graph_div");
  		get_d3s_spectra(url.toString(),name.toString(),time,"spectra_div");
    }
	}
	else
		console.log("pocket geiger");
		get_data(url.toString(),name.toString(),timezone,
				 dose,time,"graph_div");
	return content_string;
}

// Time units for a plot, called in updateInfowindowContent
function getTimeframe(){
	infowindow.close();
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
	return sel.options[sel.selectedIndex].value;
}

// Options for which plots shown, called in updateInfowindowContent
function getPlotOptions() {
  infowindow.close();
	var sel_option = document.getElementById('plotoptions_dropdown');
	return sel_option.options[sel_option.selectedIndex].value;
}

function clearMarkers() {
	markerCluster.clearMarkers();
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = [];
	json_vals = []
}

function setMarkerIcon(marker){
    // Sets Marker Icon to [red, green, yellow, purple, green] marker
    marker.setIcon('https://maps.google.com/mapfiles/ms/icons/red-dot.png');
}

function repopulateMarkers(sensor_type){
	clearMarkers();
	$.getJSON(url, function(data){
		$.each(data.features, function(key, val){
			if( sensor_type=="d3s" && !val.properties["has_d3s"])
				return true;
			var lon = getCoords(val).lon;
			var lat = getCoords(val).lat;
	        var marker = new MarkerWithLabel({
	            map: map,
	            title: name,
	            position: new google.maps.LatLng(lat, lon),
	            labelContent: getLabelContent(val),
	            labelAnchor: new google.maps.Point(20, 0),
	            labelClass: "labels",
	        });
	        markers.push(marker);
	        json_vals.push(val);
	        setMarkerIcon(marker);
			addMarkerEventListeners(val, marker);
      	});
      	var mcOptions = {gridSize: 40, maxZoom: 15};
		markerCluster = new MarkerClusterer(map, markers, mcOptions);
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

function hidePlotOptions() {
	//hide plot option drop down selector when certain sensors are selected
  var sel_option = document.getElementById('sensor_list');
	var plot_option = document.getElementById('plotoptions_dropdown');
  var plot_label = document.getElementById('plotoptions_label');
  sensor_val = sel_option.options[sel_option.selectedIndex].value;
	console.log(sensor_val);
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
	console.log("changePlotOptions triggered");
	console.log(value);
	var PlotOptions = {
		A: ["Dose Plot","Integrated Spectrum","Both Plots"],
		B: ["1.0 PM","2.5 PM","10 PM","All Plots"],
		C: ["Temperature","Pressure","Humidity","All Plots"],
	}
	console.log(PlotOptions[value]);
	            var catOptions = "";
	            for (categoryId in PlotOptions[value]) {
	                catOptions += "<option>" + PlotOptions[value][categoryId] + "</option>";
	            }
							console.log(catOptions);
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
		var label_text = getLabelContent(json_vals[i]);
		markers[i].labelVisible = false;
		markers[i].setOptions({ labelContent: label_text });
		//markers[i].labelContent = label_text;
		markers[i].labelVisible = true;
	}
}

function getDosimeterCoords(index){
	var lat = parsed_json.features[index].geometry.coordinates[1];
	var lon = parsed_json.features[index].geometry.coordinates[0];
	var location = new google.maps.LatLng(lat, lon);
	return location
}

function getSelectedDosimeterIndex(){
	var sel = document.getElementById('dosimeter_list');
	var index = sel.selectedIndex;
	dosimeter_name = sel.options[sel.selectedIndex].value;
	return index;
}

function goToDosimeter(){
	infowindow.close();
	var index = getSelectedDosimeterIndex();
	var center = getDosimeterCoords(index);
	map.setCenter(center);
	map.setZoom(9);
}

function initMap(){
	//initiate map using google maps api
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: new google.maps.LatLng(0, 0),
		zoom: 1,
		minZoom: 1,
		zoomControl:true,
		zoomControlOptions: {
		  style:google.maps.ZoomControlStyle.SMALL
		},
		disableDefaultUI: true
	});
	google.maps.event.addListener(map, 'click', function() {
		infowindow.close();
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
	unitMap.set("mrem/hr",["mREM/hr",1.0,4]);
	unitMap.set("&microSv/hr",["&microSv/hr",1.0,3]);
	unitMap.set("air travel/hr",["&microSv/hr",0.420168067,4]);
	unitMap.set("cigarettes/hr",["&microSv/hr",0.00833333335,4]);
	unitMap.set("X-rays/hr",["&microSv/hr",0.2,4]);
}

function getLabelContent(val){
	selected_unit = getDoseUnit();
	latest_val = (val.properties[unitMap.get(selected_unit)[0]]*unitMap.get(selected_unit)[1]).toFixed(unitMap.get(selected_unit)[2]);
	return ("&nbsp" + latest_val + "&nbsp" + selected_unit + "&nbsp");
}

function addMarkerEventListeners(val, marker){
	// Adds listener to open infowindow with content from updateInfowindowContent()
	// updateInfowindowContent() will allow you to enter the graphs from the geoJSON file
	google.maps.event.addListener(marker, 'click', (function(marker) {
		return function() {
			infowindow.setContent(updateInfowindowContent(val));
			infowindow.open(map, marker);
			selected_val = val;
			selected_marker = marker;
		};
	})(marker));
}

function addTimeDropdownListener(){
	//listens for selection in time dropdown selector
	$("#time_dropdown").change(function(){
		//infowindow.close();
		goToDosimeter();
		infowindow.setContent(updateInfowindowContent(selected_val));
		infowindow.open(map, selected_marker);
	});
}

function addUnitDropdownListener(){
	$("#dose_dropdown").change(function(){
		//infowindow.close();
		goToDosimeter();
		infowindow.setContent(updateInfowindowContent(selected_val));
		infowindow.open(map, selected_marker);
	});
}

function addPlotOptionsDropdownListener(){
	//listens for selection in plot options dropdown selector
  $("#plotoptions_dropdown").change(function(){
    // infowindow.close();
    goToDosimeter();
    infowindow.setContent(updateInfowindowContent(selected_val));
    infowindow.open(map, selected_marker);
  });
}

// This is the compressed code for making our marker labels
// copied from no-longer-supported google markerwithlabel src
// - new google untilities are in gitHub (http://googlemaps.github.io/libraries.html) but this was not transfered over as of 2016-5-12
// - should look into stransfering over to the supported library: https://github.com/googlemaps/js-map-label
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('6 1G(b,a){6 1u(){}1u.v=a.v;b.2B=a.v;b.v=1b 1u();b.v.3h=b}6 u(c,b,a){2.3=c;2.1L=c.2y;2.7=K.1A("2k");2.7.4.S="11: 1p; 15: 1P;";2.q=K.1A("2k");2.q.4.S=2.7.4.S;2.q.1M("2A","1d A;");2.q.1M("2w","1d A;");2.U=u.P(b)}1G(u,8.5.3g);u.P=6(b){t a;9(C u.P.1j==="B"){a=K.1A("30");a.4.S="11: 1p; z-2Y: 2W; M: 13;";a.4.1l="-2P";a.4.1x="-2M";a.2I=b;u.P.1j=a}1d u.P.1j};u.v.2D=6(){t g=2;t m=A;t c=A;t f;t j,1e;t p;t d;t h;t o;t n=20;t i="3p("+2.1L+")";t k=6(e){9(e.2q){e.2q()}e.3l=F;9(e.2n){e.2n()}};t l=6(){g.3.2m(3c)};2.1E().1J.Y(2.7);2.1E().36.Y(2.q);9(C u.P.2e==="B"){2.1E().1J.Y(2.U);u.P.2e=F}2.1t=[8.5.r.O(2.q,"2c",6(e){9(g.3.R()||g.3.X()){2.4.19="25";8.5.r.D(g.3,"2c",e)}}),8.5.r.O(2.q,"21",6(e){9((g.3.R()||g.3.X())&&!c){2.4.19=g.3.2V();8.5.r.D(g.3,"21",e)}}),8.5.r.O(2.q,"1X",6(e){c=A;9(g.3.R()){m=F;2.4.19=i}9(g.3.R()||g.3.X()){8.5.r.D(g.3,"1X",e);k(e)}}),8.5.r.O(K,"1s",6(a){t b;9(m){m=A;g.q.4.19="25";8.5.r.D(g.3,"1s",a)}9(c){9(d){b=g.Z().1v(g.3.Q());b.y+=n;g.3.J(g.Z().1S(b));2O{g.3.2m(8.5.2N.2L);2J(l,2H)}2E(e){}}g.U.4.M="13";g.3.12(f);p=F;c=A;a.L=g.3.Q();8.5.r.D(g.3,"1N",a)}}),8.5.r.w(g.3.1g(),"2C",6(a){t b;9(m){9(c){a.L=1b 8.5.2z(a.L.1f()-j,a.L.1i()-1e);b=g.Z().1v(a.L);9(d){g.U.4.14=b.x+"G";g.U.4.T=b.y+"G";g.U.4.M="";b.y-=n}g.3.J(g.Z().1S(b));9(d){g.q.4.T=(b.y+n)+"G"}8.5.r.D(g.3,"1K",a)}V{j=a.L.1f()-g.3.Q().1f();1e=a.L.1i()-g.3.Q().1i();f=g.3.1c();h=g.3.Q();o=g.3.1g().2x();d=g.3.E("16");c=F;g.3.12(1I);a.L=g.3.Q();8.5.r.D(g.3,"1H",a)}}}),8.5.r.O(K,"2v",6(e){9(c){9(e.3r===27){d=A;g.3.J(h);g.3.1g().3q(o);8.5.r.D(K,"1s",e)}}}),8.5.r.O(2.q,"2u",6(e){9(g.3.R()||g.3.X()){9(p){p=A}V{8.5.r.D(g.3,"2u",e);k(e)}}}),8.5.r.O(2.q,"2s",6(e){9(g.3.R()||g.3.X()){8.5.r.D(g.3,"2s",e);k(e)}}),8.5.r.w(2.3,"1H",6(a){9(!c){d=2.E("16")}}),8.5.r.w(2.3,"1K",6(a){9(!c){9(d){g.J(n);g.7.4.N=1I+(2.E("17")?-1:+1)}}}),8.5.r.w(2.3,"1N",6(a){9(!c){9(d){g.J(0)}}}),8.5.r.w(2.3,"3o",6(){g.J()}),8.5.r.w(2.3,"3n",6(){g.12()}),8.5.r.w(2.3,"3m",6(){g.18()}),8.5.r.w(2.3,"3j",6(){g.18()}),8.5.r.w(2.3,"3i",6(){g.1C()}),8.5.r.w(2.3,"3f",6(){g.1y()}),8.5.r.w(2.3,"3e",6(){g.1z()}),8.5.r.w(2.3,"3d",6(){g.1a()}),8.5.r.w(2.3,"3b",6(){g.1a()})]};u.v.3a=6(){t i;2.7.2j.2i(2.7);2.q.2j.2i(2.q);2h(i=0;i<2.1t.39;i++){8.5.r.38(2.1t[i])}};u.v.37=6(){2.1y();2.1C();2.1a()};u.v.1y=6(){t a=2.3.E("1w");9(C a.35==="B"){2.7.W=a;2.q.W=2.7.W}V{2.7.W="";2.7.Y(a);a=a.34(F);2.q.W="";2.q.Y(a)}};u.v.1C=6(){2.q.33=2.3.32()||""};u.v.1a=6(){t i,I;2.7.1r=2.3.E("1q");2.q.1r=2.7.1r;2.7.4.S="";2.q.4.S="";I=2.3.E("I");2h(i 31 I){9(I.2Z(i)){2.7.4[i]=I[i];2.q.4[i]=I[i]}}2.2b()};u.v.2b=6(){2.7.4.11="1p";2.7.4.15="1P";9(C 2.7.4.H!=="B"&&2.7.4.H!==""){2.7.4.2a="\\"29:28.26.2f(H="+(2.7.4.H*24)+")\\"";2.7.4.23="22(H="+(2.7.4.H*24)+")"}2.q.4.11=2.7.4.11;2.q.4.15=2.7.4.15;2.q.4.H=0.2X;2.q.4.2a="\\"29:28.26.2f(H=1)\\"";2.q.4.23="22(H=1)";2.1z();2.J();2.18()};u.v.1z=6(){t a=2.3.E("1o");2.7.4.1l=-a.x+"G";2.7.4.1x=-a.y+"G";2.q.4.1l=-a.x+"G";2.q.4.1x=-a.y+"G"};u.v.J=6(a){t b=2.Z().1v(2.3.Q());9(C a==="B"){a=0}2.7.4.14=1Z.1Y(b.x)+"G";2.7.4.T=1Z.1Y(b.y-a)+"G";2.q.4.14=2.7.4.14;2.q.4.T=2.7.4.T;2.12()};u.v.12=6(){t a=(2.3.E("17")?-1:+1);9(C 2.3.1c()==="B"){2.7.4.N=2U(2.7.4.T,10)+a;2.q.4.N=2.7.4.N}V{2.7.4.N=2.3.1c()+a;2.q.4.N=2.7.4.N}};u.v.18=6(){9(2.3.E("1n")){2.7.4.M=2.3.2T()?"2S":"13"}V{2.7.4.M="13"}2.q.4.M=2.7.4.M};6 1m(a){a=a||{};a.1w=a.1w||"";a.1o=a.1o||1b 8.5.2R(0,0);a.1q=a.1q||"2Q";a.I=a.I||{};a.17=a.17||A;9(C a.1n==="B"){a.1n=F}9(C a.16==="B"){a.16=F}9(C a.2d==="B"){a.2d=F}9(C a.1W==="B"){a.1W=A}9(C a.1B==="B"){a.1B=A}a.1k=a.1k||"1V"+(K.1U.1T==="2g:"?"s":"")+"://5.1R.1Q/2t/2l/2o/2K.3k";a.1F=a.1F||"1V"+(K.1U.1T==="2g:"?"s":"")+"://5.1R.1Q/2t/2l/2o/2G.2F";a.1B=A;2.2p=1b u(2,a.1k,a.1F);8.5.1D.1O(2,2r)}1G(1m,8.5.1D);1m.v.1h=6(a){8.5.1D.v.1h.1O(2,2r);2.2p.1h(a)};',62,214,'||this|marker_|style|maps|function|labelDiv_|google|if|||||||||||||||||eventDiv_|event||var|MarkerLabel_|prototype|addListener||||false|undefined|typeof|trigger|get|true|px|opacity|labelStyle|setPosition|document|latLng|display|zIndex|addDomListener|getSharedCross|getPosition|getDraggable|cssText|top|crossDiv_|else|innerHTML|getClickable|appendChild|getProjection||position|setZIndex|none|left|overflow|raiseOnDrag|labelInBackground|setVisible|cursor|setStyles|new|getZIndex|return|cLngOffset|lat|getMap|setMap|lng|crossDiv|crossImage|marginLeft|MarkerWithLabel|labelVisible|labelAnchor|absolute|labelClass|className|mouseup|listeners_|tempCtor|fromLatLngToDivPixel|labelContent|marginTop|setContent|setAnchor|createElement|optimized|setTitle|Marker|getPanes|handCursor|inherits|dragstart|1000000|overlayImage|drag|handCursorURL_|setAttribute|dragend|apply|hidden|com|gstatic|fromDivPixelToLatLng|protocol|location|http|draggable|mousedown|round|Math||mouseout|alpha|filter|100|pointer|Microsoft||DXImageTransform|progid|MsFilter|setMandatoryStyles|mouseover|clickable|processed|Alpha|https|for|removeChild|parentNode|div|en_us|setAnimation|stopPropagation|mapfiles|label|preventDefault|arguments|dblclick|intl|click|keydown|ondragstart|getCenter|handCursorURL|LatLng|onselectstart|superClass_|mousemove|onAdd|catch|cur|closedhand_8_8|1406|src|setTimeout|drag_cross_67_16|BOUNCE|9px|Animation|try|8px|markerLabels|Point|block|getVisible|parseInt|getCursor|1000002|01|index|hasOwnProperty|img|in|getTitle|title|cloneNode|nodeType|overlayMouseTarget|draw|removeListener|length|onRemove|labelstyle_changed|null|labelclass_changed|labelanchor_changed|labelcontent_changed|OverlayView|constructor|title_changed|labelvisible_changed|png|cancelBubble|visible_changed|zindex_changed|position_changed|url|setCenter|keyCode'.split('|'),0,{}))

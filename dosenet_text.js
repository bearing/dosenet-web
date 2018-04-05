function https(){
	var URL = document.URL;
	var secureURL = URL.replace("http:","https:");
}
function calibration() {
	document.getElementById("text_field").innerHTML =
		"<div class = \"jumbotron\" >" +
		"<div class = \"jh5\">" +
		"</div>" +
		"<div class = \"jp\">" +
		"The DoseNet devices measure radiation counts to get counts per minute (CPM). However, CPM is not a useful measurement of radiation in our environment, because one count in a DoseNet device is different from one count in a Geiger counter, which is different from one count in a germanium detector, and so on. The counts in any detector have to be *calibrated* to represent a physical unit of dose rate, such as µSv/hr. The procedure used to calibrate our devices is described on the " +
		"<a href=\"/dosenet/calibrations\">" + "Calibration Page" + "</a>";
}
function units_used() {
    document.getElementById("text_field").innerHTML =
		"<div class =\"jumbotron\" >" +
		"<div class =\"jh5\">" +
			"Units Used" +
		"</div>" +
		"<div class =\"jp\">" +
		"Background radiation is present everywhere. However, there are also many common, everyday human activities that expose you to radiation. The units used here are a sample of different sources of radiation in everyday activity and allow you to compare the background dose to these different activities. To see a description of how the unit conversion was determined, select that unit type form the drop down menu. In these cases the dose stated corresponds to the effective dose equivalent for that exposure." +
		"</div>" +
		"</div>";
    }
function map_explained() {
	document.getElementById("text_field").innerHTML =
		"<div class =\"jumbotron\" >" +
		"<div class =\"jh5\">" +
			"How the map works" +
		"</div>" +
		"<div class =\"jp\">" +
		"The map uses Google Maps with pinpoints at each dosimeter location. These dosimeters then update to show the current radiation level. Clicking on any of the points will bring up a new window, displaying more information about the individual detector and allow you to view the radiation level as a function of time. The units can be changed using the dropdown just above the map. These units show the background radiation level in more familiar terms." +
		"</div>" +
		"</div>";
}

function about_radiation(){
	document.getElementById("text_field").innerHTML =
		"<div class =\"jumbotron\" >" +
		"<div class =\"jh5\">" +
			"The radiation level is higher today than it was yesterday. Should I be concerned?" +
		"</div>" +
		"<div class =\"jp\">" +
		"Probably not. In the same way that some days are windy and other days are calm, "+
		"the background radiation level can change from day to day.  The natural background "+
		"in an area can easily change by a factor of 10 through the effects of weather." +
		"</div>" +

		"<div class =\"jh5\">" +
			"The area where I live seems higher than other areas, should I be concerned?" +
		"</div>" +
		"<div class =\"jp\">" +
		"Different locations have different amounts of natural radiation background, due to "+
		"differences in the rocks and soil as well as elevation. For example, the sand of "+
		"certain beaches in Brazil are naturally hundreds of times more radioactive than sand "+
		"in California. And the background in Denver is considerably higher than that at sea level. "+
		"Variations in background level are to be expected." +
		"</div>" +
		"<div class=\"jp\">" +
		"<a href=\"http://www2.epa.gov/radiation/radiation-sources-and-doses\">EPA - radiation "+
		"sources and doses</a>" +
		"</div>" +
		"</div>";
}

function about_dosenet(){
	document.getElementById("text_field").innerHTML =
		"<div class =\"jumbotron\" >" +
		"<div class =\"jh5\">" +
			"About our Stations" +
		"</div>" +
		"<div class =\"jp\">" +
		"The DoseNet stations each include a basic nuclear radiation counter which provides "+
		"the dose-rate shown on our default map. Several locations now also include outside "+
		"stations with an advanced gamma radiation spectrometer, a carbon dioxide monitor and "
		"particulate matter air quality sensor, and a pressure, temperature, humidity gauge."+
		"Our network begins in UC Berkeley and Lawrence Berkeley National Lab (LBNL), and "+
		"stretches out to secondary schools across the Bay Area. This network also includes "+
		"a growing number of satellite networks through our international partners."
		"<br><br>"+
		"Our basic dosimeters count radiation interactions that deposit energy in the device, "+
		"giving the counts per minute (CPM) averaged over a 5-minute interval. The CPM is "+
		"converted to a rate of radiation dose that people are being exposed to.  Each dosimeter "+
		"then takes this measurement and sends it to a central server, where it is displayed on "+
		"RadWatch.  This system allows for real-time monitoring of radiation levels." +
		"</div>" +
		"</div>";
}

timeframe = "hour";
function get_timeframe(){
	var sel_time = document.getElementById('time_dropdown');
	timeframe = sel_time.options[sel_time.selectedIndex].value;
}

sensor = "pocket";
function setHTML_sensor(){
  var sel = document.getElementById('sensor_list');
	sensor = sel.options[sel.selectedIndex].value;
	switch(sensor) {
	  case 'A':
				  document.getElementById("text_field").innerHTML =
			"<div class = \"jumbotron\" >" +
			"<div class =\"jh5\">" +
			"Cesium-iodide Spectrometer" +
			"</div>" +
			"<div class =\"jp\">" +
			"This detector uses a cesium iodide scintillator to detect ionizing radiation, "+
			"in the form of gamma-rays, including the energy of the gamma-ray. This sensor "+
			"is much more sensitive than our basic counting sensor, allowing for a deaper look "+
			"at the causes of variations in background levels. The added energy information "+
			"also allows us to explore the sources of radiation contributing to the natural "+
			"background at our locations."+
			"</div>" +
			"</div>";
		break;
		case 'B':
					document.getElementById("text_field").innerHTML =
			"<div class = \"jumbotron\" >" +
			"<div class = \"jh5\">" +
			"Air Particulate Sensor" +
			"</div>" +
			"<div class = \"jp\">" +
			"Our air quality sensor is "
	}
}

unit = "CPM";
function setHTML_units(){
	var sel = document.getElementById('dose_dropdown');
	unit = sel.options[sel.selectedIndex].value;
	switch(unit) {
		case 'cigarettes/hr':
	        document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\" >" +
			"<div class =\"jh5\">" +
			"Cigarettes" + "<br>(1 pack (20 cigarettes) = 6 µSv)</a>" +
			"</div>" +
			"<div class =\"jp\">" +
			"'While cigarette smoke is not an obvious source of radiation exposure, it contains "+
			"small amounts of radioactive materials [polonium-210 and lead-210] which smokers "+
			"bring into their lungs as they inhale. The radioactive particles lodge in lung tissue "+
			"and over time contribute a huge radiation dose. Radioactivity may be one of the key "+
			"factors in lung cancer among smokers.' "+
			"<br><a href=\"http://www.epa.gov/radiation/sources/tobacco.html\">"+
			"U.S. Environmental Protection Agency</a>" +
			"<br><br>" +
			"The National Council on Radiation Protection and Measurements suggests that tobacco "+
			"products are probably the greatest single contributor to effective dose equivalent "+
			"in the population at large, even greater than medical procedures and natural background. "+
			"[NCRP Report No. 93 summarizing exposures from all sources (NCRP, 1987a)]. "+
			"<br><a href=\"http://www.ncrponline.org/Learn_More/Did_You_Know_95.html\">"+
			"Equivalent dose estimation</a>" +
			"<br><br>"+
			"The values shown compare the effective dose equivalent for how many cigarettes "+
			"would give you the same dose per hour." +
			"<br><a href=\"http://www.rmeswi.com/36.html\">"+
			"Radiation Measurement and Elimination Services</a>" +
			"</div>" +
			"</div>";
		break;
		case 'air travel/hr':
	        document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\" >" +
			"<div class =\"jh5\">" +
			"Time on Airplane" + "<br>(2.38 µSv per hour)" +
			"</div>" +
			"<div class =\"jp\">" +
			"Radiation also comes from the sun, solar wind, and other cosmic radiation. "+
			"The bulk of this radiation is blocked by the Earth’s atmosphere. However, when "+
			"flying across the country, the increased altitude there is less atmosphere above "+
			"you to protect you from this cosmic radiation. This means that while flying in an "+
			"airplane, you receive a higher dose of radiation than you would on the ground." +
			"<br><br>The values shown indicate the amount of time on an airplane would correspond "+
			"to the same effective dose." +
			"<br><a href=\"http://www.hps.org/publicinformation/ate/faqs/commercialflights.html\">"+
			"HPS Public Information on commerical airplane flights</a>" +
			"</div>" +
			"</div>";
		break;
		case 'X-rays/hr':
	        document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\">" +
			"<div class =\"jh5\">" +
			"Medical Procedures" + "<br>(X-ray = 5 - 15 µSv, Chest CT = 7000 µSv)" +
			"</div>" +
			"<div class =\"jp\">" +
			"Getting x-rayed at the dentist’s office or getting CT scans at a hospital are common "+
			"occurrences. These forms of imaging help doctors see inside the body and allow them "+
			"to more easily do their jobs. However, such procedures do expose one’s body to some "+
			"dose of radiation. This amount varies from procedure to procedure." +
			"<br><br>"+
			"The values shown compare how many 5 µSv X-rays would need to be taken to give you "+
			"the same effective dose as standing at this location for one hour." +
			"<br><a href=\"http://www.radiologyinfo.org/en/pdf/sfty_xray.pdf\">Radiology information</a>" +
			"<br><a href=\"http://www.nrc.gov/about-nrc/radiation/around-us/doses-daily-lives.html\">"+
			"NRC - Daily lives</a>" +
			"</div>" +
			"</div>";
		break;
		case 'CPM':
			document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\">" +
			"<div class =\"jh5\">" +
			"CPM" +
			"</div>" +
			"<div class =\"jp\">" +
			"Counts per minute on the detector averaged over a 5-minute measurement" +
			"</div>" +
			"</div>";
		break;
		case 'mrem/hr':
		    document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\">" +
			"<div class =\"jh5\">" +
			"Millirem per hour (mrem/hr)"+ "<br>1 mrem/hr = 10 µSv/hr" +
			"</div>" +
			"<div class =\"jp\">" +
			"The millirem (equal to 1/1000th of a rem) is an older measurement of radiation "+
			"dose that the Sievert replaced. It is still common  however, in the literature on "+
			"radiation dose. Because of this, it is included in here as well. The mREM/hr unit "+
			"is the dose rate - the dose absorbed per hour of exposure." +
			"</div>" +
			"</div>";
		break;
		case '&microSv/hr':
		document.getElementById("text_field").innerHTML =
			"<div class =\"jumbotron\">" +
			"<div class =\"jh5\">" +
			"Micro-Sievert per hour (µSv/hr)" +
			"</div>" +
			"<div class =\"jp\">" +
			"The Sievert is the standard (SI) unit of absorbed dose. It is related to the amount "+
			"of energy that radiation deposits in the body. 1 Sv is defined as being 1 joule of "+
			"energy that is absorbed in 1 kg of tissue, multiplied by a quality factor depending "+
			"on the type of radiation. 1 µSv is equal to 10^-6 (0.000001) Sv. Sv/hr is the dose rate "+
			"- the dose absorbed per hour of exposure." +
			"</div>" +
			"</div>";
		break;
		default:
		document.getElementById("text_field").innerHTML = "...";
	}
}

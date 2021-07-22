function Linear(AQIhigh, AQIlow, Conchigh, Conclow, Concentration)
{
var linear;
var Conc=parseFloat(Concentration);
var a;
a=((Conc-Conclow)/(Conchigh-Conclow))*(AQIhigh-AQIlow)+AQIlow;
linear=Math.round(a);
return linear;
}

function AQIPM25(Concentration)
{
var Conc=parseFloat(Concentration);
var c;
var AQI;
c=(Math.floor(10*Conc))/10;
if (c>=0 && c<12.1)
{
	AQI=Linear(50,0,12,0,c);
}
else if (c>=12.1 && c<35.5)
{
	AQI=Linear(100,51,35.4,12.1,c);
}
else if (c>=35.5 && c<55.5)
{
	AQI=Linear(150,101,55.4,35.5,c);
}
else if (c>=55.5 && c<150.5)
{
	AQI=Linear(200,151,150.4,55.5,c);
}
else if (c>=150.5 && c<250.5)
{
	AQI=Linear(300,201,250.4,150.5,c);
}
else if (c>=250.5 && c<350.5)
{
	AQI=Linear(400,301,350.4,250.5,c);
}
else if (c>=350.5 && c<500.5)
{
	AQI=Linear(500,401,500.4,350.5,c);
}
else
{
	AQI="PM25message";
}
return AQI;
}
function AQIPM10(Concentration)
{
var Conc=parseFloat(Concentration);
var c;
var AQI;
c=Math.floor(Conc);
if (c>=0 && c<55)
{
	AQI=Linear(50,0,54,0,c);
}
else if (c>=55 && c<155)
{
	AQI=Linear(100,51,154,55,c);
}
else if (c>=155 && c<255)
{
	AQI=Linear(150,101,254,155,c);
}
else if (c>=255 && c<355)
{
	AQI=Linear(200,151,354,255,c);
}
else if (c>=355 && c<425)
{
	AQI=Linear(300,201,424,355,c);
}
else if (c>=425 && c<505)
{
	AQI=Linear(400,301,504,425,c);
}
else if (c>=505 && c<605)
{
	AQI=Linear(500,401,604,505,c);
}
else
{
	AQI="PM10message";
}
return AQI;
}


function AQICategory(AQIndex)
{
var AQI=parseFloat(AQIndex)
var AQICategory;
if (AQI<=50)
{
	AQICategory="Good";
}
else if (AQI>50 && AQI<=100)
{
	AQICategory="Moderate";
}
else if (AQI>100 && AQI<=150)
{
	AQICategory="Unhealthy for Sensitive Groups";
}
else if (AQI>150 && AQI<=200)
{
	AQICategory="Unhealthy";
}
else if (AQI>200 && AQI<=300)
{
	AQICategory="Very Unhealthy";
}
else if (AQI>300 && AQI<=400)
{
	AQICategory="Hazardous";
}
else if (AQI>400 && AQI<=500)
{
	AQICategory="Hazardous";
}
else
{
	AQICategory="Out of Range";
}
return AQICategory;
}

function CalcAQI(size, f)
{
var b;
if (size == "PM25")
{
	b = AQIPM25(f);
}
else if (size == "PM10")
{
	b=AQIPM10(f);
}
return [b, AQICategory(b)];
}

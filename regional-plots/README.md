### Features
* dropdown menu that allows users to change units (CPM; μSv/hr and PM2.5/PM10; AQI2.5/AQI10)
* color-coding by region (America; Asia; Europe)
* hover over bars to see date ranges
* AQI plots have background colors to indicate level of severity

Note: <`plot.py`> and <`plot_aq.py`> both generate files in the <`generated/`> directory.
* `plot.py` generates `cpm_plot.html` and `msv_plot.html`, which will be embedded as iframes within `plot.html`
* `plot_aq.py` generates the following:
	* `PM10_plot.html`](generated/PM10_plot.html)
	* `PM25_plot.html`](generated/PM25_plot.html)
	* `AQI10_plot.html`](generated/AQI10_plot.html)
	* `AQI25_plot.html`](generated/AQI25_plot.html)

### Resources
* https://www.airnow.gov/aqi/aqi-calculator/
* https://www.epa.gov/sites/production/files/2014-05/documents/zell-aqi.pdf

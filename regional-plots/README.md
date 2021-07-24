### Directory Structure
The helper class, [`BarPlot`](regional_plots.py), assumes a directory structure that somewhat resembles the following.
```console
yay@graphs:~/regional-plots$ tree -F .
.
├── data/
│   ├── asaka_os_aq_month.csv
│   ├── asaka_os_month.csv
│   ├── sakata_aq_month.csv
│   ├── sakata_month.csv
│   ├── exploratorium_aq_month.csv
│   ├── exploratorium_month.csv
│   ├── westend_aq_month.csv
│   └── westend_month.csv
└── generated/

2 directories, 8 files
```
A `data_dir` and `generated_dir` can be specified on instantiation, but they default to `data` and `generated` respectively.


### Features
* dropdown menu that allows users to change units (CPM; μSv/hr and PM2.5/PM10; AQI2.5/AQI10)
* color-coding by region (America; Asia; Europe)
* hover over bars to see date ranges
* AQI plots have background colors to indicate level of severity

Note: [`plot.py`](plot.py) and [`plot_aq.py`](plot_aq.py) both generate files in the [`generated/`](generated/) directory.
* `plot.py` generates [`cpm_plot.html`](generated/cpm_plot.html) and [`msv_plot.html`](generated/msv_plot.html), which will be embedded as iframes within [`plot.html`](plot.html)
* `plot_aq.py` generates the following:
	* [`PM10_plot.html`](generated/PM10_plot.html)
	* [`PM25_plot.html`](generated/PM25_plot.html)
	* [`AQI10_plot.html`](generated/AQI10_plot.html)
	* [`AQI25_plot.html`](generated/AQI25_plot.html)


### Resources
* https://www.airnow.gov/aqi/aqi-calculator/
* https://www.epa.gov/sites/production/files/2014-05/documents/zell-aqi.pdf

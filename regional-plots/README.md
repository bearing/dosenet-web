# Most recent average dose rates ordered by region

### This is an updated version of the bar graph (first plot) on [the website](https://radwatch.berkeley.edu/partner-locations/).

### Features
* dropdown menu that allows users to change units (CPM; μSv/hr and PM2.5/PM10; AQI)
* color-coding by region (America; Asia; Europe)

Note: `plot.py` and `plot_aq.py` both generate two files in the `generated/` directory.
* `plot.py` generates `cpm_plot.html` and `msv_plot.html`, which will be embedded as iframes within `plot.html`
* `plot_aq.py` generates `PM_plot.html` and `AQI_plot.html`

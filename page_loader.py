#!/usr/bin/env python
import selenium.webdriver as webdriver
from selenium.webdriver.chrome.options import Options
from time import sleep

if __name__ == "__main__":
    urls = [['file:///home/pi/dosenet-web/display-monitors/Front.html',10],
            ['https://radwatch.berkeley.edu',30],
            ['https://radwatch.berkeley.edu/rad101#tabs-1',10],
    		['https://radwatch.berkeley.edu/dosenet/map#dosenet_rad_banner',30],
    		['https://radwatch.berkeley.edu/dosenet/data#data_1',30],
            ['https://radwatch.berkeley.edu/dosenet/schools/etcheverry#spacer_1',20],
    		['file:///home/pi/dosenet-web/display-monitors/WeatherStation.html',20],
            ['https://radwatch.berkeley.edu/dosenet/schools/etcheverry#spacer_2',20],
            ['file:///home/pi/dosenet-web/display-monitors/FindMore.html',15]
           ]

chrome_options = Options()
chrome_options.add_argument("--kiosk")
chrome_options.add_argument("--disable-infobars")
chrome_options.add_argument("--hide-scrollbars")

b = webdriver.Chrome(chrome_options=chrome_options)

while True:
    for idx,url in enumerate(urls):
        try:
            b.get(url[0])
        except:
            pass
        sleep(url[1])

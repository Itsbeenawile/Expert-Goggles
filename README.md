# Expert Goggles

Led by Temple University's Dr. Stephen MacNeil <br>

Project Team:
Aaron Wile,
Josh Withka,
Maggie Hanley

<h3>Overview</h3>
Over the past few decades, society has shifted toward data-driven decision making. In all facets of society, experts and non-experts are using data to make decisions about 
their health (e.g.: vaccines), their life (e.g.: buy a house vs rent), their jobs (e.g.: choosing majors, schools, etc), their political opinions (e.g.: voting, climate change).
However, a significant amount of prior research has demonstrated that interpreting data is incredibly difficult, even for experts. Cognitive biases, complex visual representations,
and limited training further compound this challenge for non-experts. And while some research has shown that data literacy training can help, most people do not have the time or 
money to get formal training in data literacy.
<br><br>
Expert Goggles is a web browser extension that assists user in interpreting various forms of data visualization. As an entry point for a larger vision, Expert Goggles is currently
designed to work with visualizations from the D3 library. With Expert Goggles installed, a user browses the web and finds an article or other publication containing data 
visualizations. The extension uses a web scraper to parse the source code of the page to locate the point at which the D3 visualization occurs and determine its type. Once this is
done, a notice is generated near the visualization point on the page, which the user can click and access a sidebar with information as to how to interpret it.<br><br>

<h3>Features in Development</h3>
Expert Goggles is still actively in development. Primary updates in development include:<br>
-Transitioning the extension's UI elements from a messy and outdated JS DOM API implementation into a more modern framework, likely ReactJS.
-Providing "context-aware" visualization analysis, such as step-by-step guidance that highlights various graph elements.
-Adding usage detection and logging, in order to assist with University research on data-literacy training.

In the long run, Expert Goggles will have support for other visualization libraries added, and a computer-vision approach is being considered.

<h3>Known Issues</h3>
-Expert Goggles cannot currently detect visualizations embedded in iframes, due to CORS policy issues. 
-Occassionally, Expert Goggles will disrupt the loading of certain D3 visualizations. This appears most commonly with Heatmaps.
-The extension's dashboard webpage is currently down for rework, so UI elements that referenced it are currently blank.

<h3>Installing Expert Goggles</h3>
Expert Goggles can be installed using the following steps:<br>
1.	Download the code from this page.<br>
2.	Navigate to chrome://extensions.<br>
3.	At the top right, enable Developer Mode.<br>
4.	At the top left, click “load unpacked.”<br>
5.	Navigate to the unzipped directory and click “select folder.”<br>
6.	Expert Goggles is now installed! <br>

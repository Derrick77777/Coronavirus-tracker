//Coronavirus tracker with Leaflet and heatmpap.js
//2020 D.Walczak
let HMData={  max:1,  data:[]  }; //Heatmap dataset
let markerData=[];  //marker dataset
let circ=[];
let marker=[];

async function DataFetch(reqPB) {
 if (!map) return;
  let responseUS;
  let responseWrld;

  try {
    //two different sources just for training
    responseUS = await axios.get('https://opendata.arcgis.com/datasets/628578697fb24d8ea4c32fa0c5ae1843_0.geojson');  // US API
    responseWrld = await axios.get('https://corona.lmao.ninja/v2/countries')                                          //World API
  } catch(e) {
    alert(`Failed to fetch countries: ${e.message}`, e);
    return;
  }
  const dataUS = responseUS;
  const dataWrld=responseWrld;
   //console.log('dataW', dataWrld);
   //console.log('dataU', dataUS);

 const hasDataUS = Array.isArray(dataUS.data.features) && dataUS.data.features.length > 0;
 const hasDataWrld = Array.isArray(dataWrld) && dataWrld.length > 0;
 if ( !hasDataUS && !hasDataWrld ){

  return;
 }   

  HMData.max=0; //initial values
  HMData.data=[]; //clearing out the array
  markerData=[];

//loop for world data
  for (let i = 0; i < dataWrld.data.length; i++) {
    let curInfoWrld
    //crating address for PB request
    switch(reqPB){
      case 'Active': curInfoWrld= eval('dataWrld.data['+i+'].active');
      break;
      case 'Recovered': curInfoWrld= eval('dataWrld.data['+i+'].recovered');
      break;
      case 'Deaths': curInfoWrld= eval('dataWrld.data['+i+'].deaths');
      break;
    };
 
    if(dataWrld.data[i].country==='USA'){   //USA API handling
      for (let j = 0; j < dataUS.data.features.length; j++) {
        
          if(!isNaN(parseFloat(dataUS.data.features[j].properties.Lat))&&!isNaN(parseFloat(dataUS.data.features[j].properties.Long_))){ //check if LonLat are numbers
            let curInfoUS= eval('dataUS.data.features['+j+'].properties.'+reqPB); //crating address for PB request
            HMData.data.push({'lat':dataUS.data.features[j].properties.Lat, 'lng':dataUS.data.features[j].properties.Long_ ,'count':curInfoUS});  //filling array for heatmap
            markerData.push({'lat':dataUS.data.features[j].properties.Lat, 'lng':dataUS.data.features[j].properties.Long_ ,'Location':dataUS.data.features[j].properties.Admin2,'Active':dataUS.data.features[j].properties.Active,'Recovered':dataUS.data.features[j].properties.Recovered,'Deaths':dataUS.data.features[j].properties.Deaths}); 
            HMData.max++
          }
        }
    }else{  //world API handling
    HMData.data.push({'lat':dataWrld.data[i].countryInfo.lat, 'lng':dataWrld.data[i].countryInfo.long,'count':curInfoWrld});  //filling array for heatmap
    markerData.push({'lat':dataWrld.data[i].countryInfo.lat, 'lng':dataWrld.data[i].countryInfo.long, 'Location':dataWrld.data[i].country,'Active':dataWrld.data[i].active,'Recovered':dataWrld.data[i].recovered,'Deaths':dataWrld.data[i].deaths});
    HMData.max++
  }
};

   heatmapLayer.setData(HMData);  //load heatmap data
// If markeres aren't added to map yet
  if(circ.length===0){
 
for(let i=0; i < markerData.length; i++){
  
    circ[i]=L.circle([markerData[i].lat, markerData[i].lng], 20000, { //adding circles
    color: 'null',
    fillColor: 'null',
    fillOpacity: 0.05,
    pointerEvents: 'all'
    }).addTo(markerGroup);

    marker[i]= L.popup({offset: L.point(0, -5)}).setContent('Location: '+ markerData[i].Location +'<br>  Active: '+markerData[i].Active + '<br>  Recovered: '+markerData[i].Recovered +'<br>  Deaths: '+markerData[i].Deaths); //adding popups
    circ[i].bindPopup(marker[i]);     //binding popups with circle
    circ[i].on("mouseover", function(evt) {
    this.openPopup();
    });
    circ[i].on("mouseout", function(evt) {
    this.closePopup();
    });
  };
}

};
//end of function dataFetch

var baseLayer = L.tileLayer(
  'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    maxZoom: 18
  }
);
//cofig object for heatmap
let cfg = {
  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
  "radius": 1,
  "maxOpacity": .5, 
  // scales the radius based on map zoom
  "scaleRadius": true, 
  // if set to false the heatmap uses the global maximum for colorization
  // if activated: uses the data maximum within the current map boundaries 
  //   (there will always be a red spot with useLocalExtremas true)
  "useLocalExtrema": false,
  // which field name in your data represents the latitude - default "lat"
  latField: 'lat',
  // which field name in your data represents the longitude - default "lng"
  lngField: 'lng',
  // which field name in your data represents the data value - default "value"
  valueField: 'count'
};
var heatmapLayer = new HeatmapOverlay(cfg);

var map = new L.Map('map', {
  center: new L.LatLng(25.6586, -80.3568),
  zoom: 4,
  layers: [baseLayer, heatmapLayer]
});
var markerGroup = L.layerGroup().addTo(map);
//PB handling
let button1 = document.createElement("button"),
    button2 = document.createElement("button"),
    button3 = document.createElement("button");
//assigning desc to PBs
button1.innerHTML = "Active";
button2.innerHTML = "Recovered";
button3.innerHTML = "Deaths";

let body = document.getElementsByTagName("body")[0];
body.appendChild(button1);
body.appendChild(button2);
body.appendChild(button3);
button1.style.backgroundColor="red";
//event handler for PBs
button1.addEventListener ("click", function() {
  DataFetch('Active');
  button1.style.backgroundColor="red";
  button2.style.backgroundColor="rgba(85, 85, 84, 0.281)";
  button3.style.backgroundColor="rgba(85, 85, 84, 0.281)";
});
button2.addEventListener ("click", function() {
  DataFetch('Recovered');
  button1.style.backgroundColor="rgba(85, 85, 84, 0.281)";
  button2.style.backgroundColor="red";
  button3.style.backgroundColor="rgba(85, 85, 84, 0.281)";
});
button3.addEventListener ("click", function() {
  DataFetch('Deaths');
  button1.style.backgroundColor="rgba(85, 85, 84, 0.281)";
  button2.style.backgroundColor="rgba(85, 85, 84, 0.281)";
  button3.style.backgroundColor="red";
});
//Heatmap radius slider
let rangeslider = document.getElementById("sliderRange");
rangeslider.oninput = function() {
  heatmapLayer.cfg.radius=this.value;
  heatmapLayer.setData(HMData);
};
DataFetch('Active');  //initial fetch






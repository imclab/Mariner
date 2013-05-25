window.onload=function(){

var db;
var dbCreated = false;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    db = window.openDatabase("MarinerDB", "1.0", "Mariner Weather", 200000);
    if (dbCreated)
    	db.transaction(getLocations, transaction_error);
    else
    	db.transaction(populateStations, transaction_error, populateDB_success);
}

function transaction_error(tx, error) {
	$.mobile.pageLoading(true); 
	alert("Database Error: " + error);
}

function populateDB_success() {
	dbCreated = true;
    db.transaction(getLocations, transaction_error);
}

function getLocations(tx) {
	var sql = 
		"CREATE TABLE IF NOT EXISTS locations ( "+
		"zip INTEGER PRIMARY KEY, " +
		"name VARCHAR(70), " +
		"lat VARCHAR(20), " +
		"lon VARCHAR(20))";
    tx.executeSql(sql);
    
	var sql = "select * from locations";
	tx.executeSql(sql, [], getLocations_success);
}

function getLocations_success(tx, results) {
	$.mobile.pageLoading(true); 
    var len = results.rows.length;
    for (var i=0; i<len; i++) {
    	var totalLocations = results.rows.item(i);
		$('#locations').append('<li><a href="#" id="' + totalLocations.zip + '">' + totalLocations.name + '</a></li>');
    }
	/*setTimeout(function(){
		scroll.refresh();
	},100);*/
	$( "stations-panel" ).trigger( "updatelayout" );
	db = null;
}

function populateStations(tx) {
	$.mobile.pageLoading();
	//tx.executeSql('DROP TABLE IF EXISTS employee');
	var sql = 
		"CREATE TABLE IF NOT EXISTS stations ( "+
		"stationID INTEGER PRIMARY KEY, " +
		"stationName VARCHAR(70), " +
		"lat VARCHAR(20), " +
		"lon VARCHAR(20))";
    tx.executeSql(sql);
    
    //fetch stations
		  $.ajax({
			type: "GET",
			url: "proxy.php?url=http://opendap.co-ops.nos.noaa.gov/axis/webservices/activestations/response.jsp?v=2&format=xml",
			dataType: "xml",
			success: getStations
		  });
		  
	function getStations(xml){
		$(xml).find("stationV2").each(function() {
			
			$stationName = $(this).attr("name");
			$stationID = $(this).attr("ID");
			$stationState = $(this).find("state").text();
			$lat = $(this).find("lat").text();
			$lon = $(this).find("long").text();
			
			$fullName = $stationName + ", " + $stationState;

    tx.executeSql("INSERT INTO stations (stationID,stationName,lat,lon) VALUES (" + $stationID + ",'" + $fullName + "','" + $lat + "','" + $lon + "')");
		}
	}
}
/*
 * 
 * 
 * 
 * 
 */


$("#station-list").on('click', '.station', function (e) {
	$myStationID = $(this).attr('title');
	$myStationName = $(this).attr('rel');
	//save station ID to database
	//save station Name to database
});

function addLocations(newzip){
	alert('function triggered zip: ' + newzip);
}

$('#add').click(function() {
	var zipcode = prompt("Please enter a ZIP code","70458");
	if (zipcode!=null && zipcode!="")
	  {
	  //x="Hello " + person + "! How are you today?";
	  
	  $.ajax({
		type: "GET",
		url: "proxy.php?url=http://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?listZipCodeList=" + zipcode,
		dataType: "xml",
		success: getZip
	  });
	  }
	 
	 function getZip(xml)
		{
		  $latLon = $(xml).find("latLonList").text();
		  
		   $myLat = $latLon.split(",")[0];
		   $myLon = $latLon.split(",")[1];
		  //save latitude and longitude to database
		  
		  //fetch city, state
		  $.ajax({
		  url: "http://zip.elevenbasetwo.com",
		  cache: false,
		  dataType: "json",
		  type: "GET",
		  data: "zip=" + zipcode,
		  success: function(result, success) {

			$myCityState = result.city + ", " + result.state;
			//save zipcode (var zipcode) to database
			//save City and State to database

		  },
		  error: function(result, success) {
			//$(".zip-error").show(); /* Ruh row */
		  }
		});
		   
		//fetch stations
		  $.ajax({
			type: "GET",
			url: "proxy.php?url=http://opendap.co-ops.nos.noaa.gov/axis/webservices/activestations/response.jsp?v=2&format=xml",
			dataType: "xml",
			success: getStations
		  });
		}
		
	function getStations(xml){
		$(xml).find("stationV2").each(function() {
			
			$stationName = $(this).attr("name");
			$stationID = $(this).attr("ID");
			$stationState = $(this).find("state").text();
			
			$lat = $(this).find("lat").text();
			$lon = $(this).find("long").text();
			
			$distance = getDistance($myLat, $myLon, $lat, $lon);
			
			/*if($distance < 161){
				$("#station-list").append('<tr><th><img src="img/station.png" /> <a href="#" title="' + $stationID + '" rel="' + $stationName + ', ' + $stationState + '" class="station">' + $stationID + '</a></th>');
				$("#station-list").append('<td>' + $stationName + ', ' + $stationState + '</td>');
				$("#station-list").append('<td>Distance: ' + Math.floor($distance * 0.621371) + ' mi</td></tr>');
			}*/
			
			if($distance < 161){
				$("#station-list").append('<li><img src="img/station.png" /> <a href="#" title="' + $stationID + '" rel="' + $stationName + ', ' + $stationState + '" class="station">' + $stationID + '</a></li>');
				$("#station-list").append('<li>' + $stationName + ', ' + $stationState + '</li>');
				$("#station-list").append('<li class="bottom-item">Distance: ' + Math.floor($distance * 0.621371) + ' mi</li>');
			}
		});
		$('#location-loader').attr('src', 'img/mariner-ico.png');
		$('#location-info').css('visibility','visible');
	}
});

//function to calculate distances between to GPS points
function getDistance(lat1, lon1, lat2, lon2){
	lat1 = lat1 * Math.PI / 180;
	lat2 = lat2 * Math.PI / 180;
	lon1 = lon1 * Math.PI / 180;
	lon2 = lon2 * Math.PI / 180;
	var R = 6371; // km
	var d = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2-lon1)) * R;
    
    return d;
}




	
		
	
	



}

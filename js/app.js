'use strict';
//Global scope map and venue info window
var map;
var venueWindow;

var VenueModel = function (marker, name, contact, address) {
    this.marker = marker;
    this.contact = contact;
    this.address = address;
    this.name = ko.observable(name);
};

//Bounce functionality for when a marker is clicked or selected from the list
VenueModel.prototype.bounce = function() {
	var obj;
	if (this.hasOwnProperty('marker')) {
		obj = this.marker;
	} else {
		obj = this;
	}
	obj.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			obj.setAnimation(null);
	}, 1400);
};

//Info functionality for when a marker is selected for a given location
VenueModel.prototype.info = function() {
  var contentString = '<div class="markerInfo"><p id="locationName">' + this.name() + '</p><p id="locationAddress">' + this.contact + '</p><p id="locationDescription">' + this.address;
  venueWindow.setContent(contentString);
  venueWindow.open(map, this.marker);
};

var MapViewModel = function() {
    //Using the self method discussed in Udacity videos
    var self = this;
    self.venues = ko.observableArray([]);
    self.keyword = ko.observable('');
    self.foursquareVenues = ko.observableArray([]);
    //Concatenate the url for foursquare with the client_id and secret
    var foursquareUrl = "https://api.foursquare.com/v2/venues/explore" + "?client_id=3WKW42JI3LWDD4KXDYSRARZQLEINDCRC4BRIPZ5FXQX1U54P" + "&client_secret=OSEQ0DIZOQPK4UTT1N4LZ4IWLJZXFQ1ENOS33MS1VTPOSDI3" + "&v=20160620";

    //Get foursquare location data for Dalhousie area in halifax
    $.getJSON(foursquareUrl, {
        ll: '44.636348, -63.591832',
        limit: 100,
        radius: 1000
    }).done(function(data) {
        self.foursquareVenues(data.response.groups[0].items);
        self.bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < self.foursquareVenues().length; i++) {
            createVenues(self.foursquareVenues()[i]);
        }
        map.fitBounds(self.bounds);
    }).fail(function(jqXHR, status, error) {//JQuery error handling
        alert("There was an error retrieving venue data from Foursquare");
    });

    function createVenues(data) {
        var lat = data.venue.location.lat;
        var lng = data.venue.location.lng;
        var position = new google.maps.LatLng(lat, lng);

        var name = data.venue.name;
        var address = data.venue.location.formattedAddress;
        var contact = data.venue.contact.formattedPhone;

        //Validate the data to make sure Foursquare has a listed contact
        if(contact == undefined){
          contact = "--";
        }

        self.bounds.extend(position);
        map.fitBounds(self.bounds);
        map.setCenter(self.bounds.getCenter());

        //Create new map markers
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: name,
            animation: google.maps.Animation.DROP,
        });

        var venue = new VenueModel(marker, name, contact, address);

        self.venues.push(venue);
        marker.addListener('click', function(){
          //Map will center around clicked marker as well as making the marker bounce and show its info
            map.panTo(position);
            venue.info();
            venue.bounce();
        });
    };

    self.displayVenues = ko.computed(function() {
        return self.venues().filter(function(venue) {
            if (venue.name().toLowerCase().indexOf(self.keyword().toLowerCase()) > -1) {
                venue.marker.setMap(map);
                return true;
            } else {
                venue.marker.setMap(null);
                return false;
            }
        });
    });
}

var myModel = {
    viewModel: new MapViewModel()
}

// Initialize the map to our starting location (Halifax)
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 17,
      center: {lat: 44.636348, lng: -63.591832}
    });
    venueWindow = new google.maps.InfoWindow();
}


function onMapError() {
	document.getElementsByClassName('map')[0].innerHTML = '<div class="google-error">There was a problem loading Google Maps!</div>';
}

var onMapSuccess = function() {
    initMap();
    ko.applyBindings(myModel.viewModel);
}

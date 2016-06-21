'use strict';

var map;
var venueWindow;

var VenueModel = function (marker, name, contact, address) {
    this.marker = marker;
    this.name = ko.observable(name);
    this.contact = contact;
    this.address = address;
};

//Adds the bounce functionality to the markers
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

// Information
VenueModel.prototype.info = function() {
  var contentString = '<div class="markerInfo"><p id="locationName">' +
      this.name() + '</p><p id="locationAddress">' + this.contact +
      '</p><p id="locationDescription">' + this.address;
  venueWindow.setContent(contentString);
  venueWindow.open(map, this.marker);
};

var MapViewModel = function() {
    var self = this;
    self.venues = ko.observableArray([]);
    self.keyword = ko.observable('');
    self.foursquareVenues = ko.observableArray([]);
    var foursquareUrl = "https://api.foursquare.com/v2/venues/explore" + "?client_id=2BIWS0KFSP1W12ARXFHNA20WHNGY0NMOAD3AFYM1ZGCFCF32" + "&client_secret=I2F4TTJ0HJOIAO2GCPP0T2NJBMMHFVMCLAQ4HIHF5U1JZCNG" + "&v=20160620";

    $.getJSON(foursquareUrl, {
        ll: '44.636348, -63.591832',
        limit: 100,
        section: '',
        v: '20160620',
        radius: 1000
    }).done(function(data) {
        self.foursquareVenues(data.response.groups[0].items);
        self.bounds = new google.maps.LatLngBounds();
        console.log(data.response.groups[0].items);
        //Creating markers to pop up the map
        for (var i = 0; i < self.foursquareVenues().length; i++) {
            createVenues(self.foursquareVenues()[i]);
        }
        map.fitBounds(self.bounds);
    }).fail(function(jqXHR, status, error) {
        // alert("Forsquare API is not reachable. Try to refresh this page later");
    });

  //Generates marker data from locations list
    function createVenues(data) {
        var lat = data.venue.location.lat;
        var lng = data.venue.location.lng;
        var name = data.venue.name;
        var position = new google.maps.LatLng(lat, lng);
        var address = data.venue.location.formattedAddress || '';
        var contact = data.venue.contact.formattedPhone || '';

        self.bounds.extend(position);
        map.fitBounds(self.bounds);
        map.setCenter(self.bounds.getCenter());

        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: name,
            animation: google.maps.Animation.DROP,
        });
        marker.className = "leaflet-marker-icon";

        var venue = new VenueModel(marker, name, contact, address);

        self.venues.push(venue);
        marker.addListener('click', function(){
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
    }); //list of venues to display
}

var myModel = {
    viewModel: new MapViewModel()
}

// Initialize the map to our starting location
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: {lat: 44.636348, lng: -63.591832}
    });
    venueWindow = new google.maps.InfoWindow();
}

var onMapSuccess = function() {
    initMap();
    ko.applyBindings(myModel.viewModel);
}

function onMapError() {
	document.getElementsByClassName('map')[0].innerHTML = '<div class="google-error">There was a problem loading Google Maps!</div>';
}
//   var markerData = [
//     {
//       title: "Dalhousie University",
//       position: {lat: 44.636348, lng: -63.591832}
//     },
//     {
//       title: "Citadel Hill",
//       position: {lat: 44.647778, lng: -63.581046}
//     },
//     {
//       title: "Halifax Public Gardens",
//       position: {lat: 44.642787, lng: -63.582183}
//     },
//     {
//       title: "Halifax Cnetral Library",
//       position: {lat: 44.642860, lng: -63.575216}
//     }
//   ];
//
//   var locations = [];
//   markerData.forEach(function(markerDatum) {
//     var venueWindow = new venueWindowViewModel(markerDatum.title);
//     venueWindow.populateContent();
//
//     var marker = new MarkerViewModel(markerDatum.title, markerDatum.position.lat, markerDatum.position.lng);
//     var location = new LocationViewModel(marker, venueWindow, map);
//     location.placeMarkerOnMap();
//
//     locations.push(location);
//   });
//
//   var searchViewModel = new SearchViewModel(locations);
//   ko.applyBindings(searchViewModel);
// }());

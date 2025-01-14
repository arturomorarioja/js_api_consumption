/**
 * Front-end API consumption - sample application
 * 
 * This application consumes the following APIs:
 * - OpenWeather (openweathermap.org). Current weather data: https://openweathermap.org/current
 * - MapBox (mapbox.com). Maps: https://docs.mapbox.com/api/maps/#static-images
 * - TicketMaster (developer.ticketmaster.com/). Events (Discovery API): https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 * 
 * @author  Arturo Mora-Rioja
 * @version 1.0.0 July 2020 
 *          1.0.1 August 2021. Bootstrap removed
 *                             Style improvements
 *          2.0.0 July 2023. jQuery removed. jQuery Ajax calls substituted by Fetch
 *          2.0.1 August 2023. Code prettification
 *          2.0.2 January 2024. Refactoring
 *          2.0.3 January 2025. HTML template and CSS nesting introduced
 */
import { weatherAPIKey, mapAPIKey, eventsAPIKey } from './keys.js';
    
let latitude = 0;
let longitude = 0;

document.querySelector('#weatherInfo').classList.add('hide');
document.querySelector('#eventInfo').classList.add('hide');
document.querySelector('#errorMessage').classList.add('hide');

/**
 * "Town Information" button clicked 
 */
document.querySelector('#btnTownInfo').addEventListener('click', (e) => {
    e.preventDefault();

    const townName = document.querySelector('#txtTown').value.trim();
    if (townName === '') {
        showError('empty');
        return;
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${townName}&units=metric&appid=${weatherAPIKey}`;

    document.querySelector('#errorMessage').classList.add('hide');
    fetch(weatherUrl, {
        method: 'GET'
    }).then((response) => response.json())
    .then((data) => {
        if (data.cod === 200) {
            // Load weather information
            document.querySelector('#townName').innerHTML = data.name + ', ' + data.sys.country;
            document.querySelector('#mainWeather').innerHTML = data.weather[0].main;
            document.querySelector('#temperature').innerHTML = data.main.temp;
            document.querySelector('#feelsLike').innerHTML = data.main.feels_like;
            document.querySelector('#humidity').innerHTML = data.main.humidity;
            document.querySelector('#wind').innerHTML = data.wind.speed;
    
            document.querySelector('#errorMessage').classList.add('hide');
            document.querySelector('#weatherInfo').classList.remove('hide');
    
            longitude = data.coord.lon;
            latitude = data.coord.lat;
    
            // Show the map and the events
            showMap(longitude, latitude);
            showEvents(data.name);                
        } else {
            showError(data.cod);
        }
    }).catch(error => {
        showError(error);
    });
});

/**
 * The map is reloaded every time the viewport is resized
 */
window.addEventListener('resize', () => {
    if (document.querySelector('#weatherInfo').classList.contains('hide')) {
        showMap(longitude, latitude);
    }
});

/**
 * Shows an error message corresponding to the code it receives as parameter
 */
const showError = (code) => {
    let msgError;

    switch (code.toString()) {
        case 'empty':   msgError = 'Please insert a town name';                         break;
        case '404':     msgError = 'There is no information for this town';             break;
        default:        msgError = 'There was an error while processing the request';
    }
    document.querySelector('#errorMessage').innerHTML = msgError;
    document.querySelector('#weatherInfo').classList.add('hide');
    document.querySelector('#eventInfo').classList.add('hide');
    document.querySelector('#errorMessage').classList.remove('hide');
}

/**
 * Shows the map corresponding to the geographical coordinates received as parameters
 */
const showMap = (longitude, latitude) => {
    const userName = 'mapbox';
    let mapWidth;
    
    const breakPoint = 768;                     // Media query breakpoint
    const borderWidth = 2;
    const paddingOrMarginWidth = 16;            // Base font size was set at 16 in the style sheet
    if (document.body.offsetWidth < breakPoint) {      
        /*
            Map width calculation =
                width of the weather information container
                minus the container's margin on both sides (half the margin width * 2 = margin width)
                minus the container's padding on both sides (padding width * 2)
                minus the container's border width on both sides (borderWidth * 2)
        */
        mapWidth = (document.querySelector('#weatherInfo').offsetWidth - 
                    (paddingOrMarginWidth * 3) - 
                    (borderWidth * 2)).toFixed(0);
    } else {        
        /*
            Map width calculation = 
                width of the weather information container
                minus width of the weather information div
                minus the container's margin on both sides (half the margin width * 2 = margin width)
                minus the container's padding on both sides (padding width * 2)
                minus the container's border width on both sides (borderWidth * 2)
                minus the image's margin on the left (margin width)
        */
        mapWidth = (document.querySelector('#weatherInfo').offsetWidth - 
                    document.querySelector('#weather').offsetWidth - 
                    (paddingOrMarginWidth * 4) - 
                    (borderWidth * 2)).toFixed(0);
    }    
    document.querySelector('#map').style.width = mapWidth + 'px';
    
    const mapUrl = 'https://api.mapbox.com/styles/v1/' + userName + '/streets-v11/static/' + 
        longitude + ',' + latitude + ',12,0,60/' + mapWidth + 'x200?access_token=' + mapAPIKey;
    document.querySelector('#map').src = mapUrl;
}

/**
 * Shows the events in the specified location
 */
const showEvents = (townName) => {
    const eventsUrl = 
        'https://app.ticketmaster.com/discovery/v2/events?apikey=' + eventsAPIKey + 
        '&locale=*&city=' + townName;
    document.querySelector('#eventList').innerHTML = '';

    fetch(eventsUrl)
    .then((response) => response.json())
    .then((data) => {
        if (data.page.totalElements === 0) {
            const noEventsMsg = document.createElement('p');
            noEventsMsg.innerText = 'There are no events scheduled for the selected town';
            noEventsMsg.classList.add('event');
            document.querySelector('#eventList').appendChild(noEventsMsg);
            document.querySelector('#eventInfo').classList.remove('hide');
            return;
        }

        data._embedded.events.forEach ((item) => {
            const event = document.querySelector('#eventCard').content.cloneNode(true);

            event.querySelector('.eventName').innerText = item.name;
            const eventDatePlace = event.querySelector('.eventDatePlace');
            eventDatePlace.innerText = item.dates.start.localDate + ' ' + item.dates.start.localTime;
            for (const venue of item._embedded.venues) {
                eventDatePlace.innerText += ', ' + venue.name;
            }

            // If the show has been cancelled or rescheduled, an informative text is added
            const statusCode = item.dates.status.code;
            if (statusCode !== 'onsale') {
                const status = document.createElement('span');
                status.innerText = ' (' + statusCode + ')';
                status.classList.add('alert');

                event.querySelector('p:last-of-type').appendChild(status);
            }

            document.querySelector('#eventList').appendChild(event);
        });        
        document.querySelector('#eventInfo').classList.remove('hide');

    }).catch(error => {
        document.querySelector('#eventInfo').classList.add('hide');
        console.error(error);
    });
}    
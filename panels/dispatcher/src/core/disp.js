import Listeners from '../lib/listeners.js';
import Connection from './connection.js';
import DX from './dx.js';
import time from './time.js';

import initSettings from './settings.js';
import initChat from './chat.js';
import initDrivers from './drivers.js';
import initDriverAlarms from './driver-alarms.js';
import initOrders from './orders.js';
import initLocations from './locations.js';
import initQueues from './queues.js';
import initSessions from './sessions.js';
import initImitations from './imitations.js';

import Fare from './obj/fare.js';
import Address from './obj/address.js';

function DispatcherClient()
{
	var url = "/dx/dispatcher";

	/*
	 * Dispatcher events.
	 */
	var listeners = new Listeners( [
		"*ready",
		"chat-message-received",
		"chat-front-changed",
		"connection-error",
		"driver-alarm-on",
		"driver-alarm-off",
		"driver-moved",
		"driver-changed",
		"driver-online-changed",
		"driver-block-changed",
		"queues-changed",
		"queue-assignments-changed",
		"order-added",
		"order-changed",
		"order-removed",
		"session-requested",
		"session-opened",
		"session-closed",
		"sessions-changed",
		"setting-changed",
		"service-log",
		"sync",
		"call-accepted",
		"call-ended",
		"line-connected",
		"line-disconnected"
	] );

	this.on = listeners.add.bind( listeners );

	var _this = this;
	var data = null;

	this.dx = new DX(url);

	var conn = new Connection(this.dx);
	conn.onMessage( 'init', init );
	conn.onMessage( 'error', function( msg ) {
		listeners.call( "connection-error", msg.data );
	});
	conn.onMessage( 'sync', function( msg ) {
		listeners.call( "sync" );
	});

	/*
	 * Get a token, then start messaging.
	 */
	this.dx.get('token')
		.then(response => {
			this.dx.token = response.token;
			conn.open();
		})
		.catch(function(error) {
			alert("Could not obtain a session token: " + error);
		});

	function init( msg )
	{
		data = msg.data;
		time.set( data.now );

		for( var i = 0; i < data.fares.length; i++ ) {
			data.fares[i] = new Fare( data.fares[i] );
		}

		[ initSettings,
			initChat,
			initDrivers,
			initDriverAlarms,
			initOrders,
			initLocations,
			initQueues,
			initSessions,
			initImitations ].forEach(
		function( f ) {
			f.call( _this, conn, listeners, data );
		});

		listeners.call( 'ready' );
	}

	conn.onMessage( "service-log", function( msg ) {
		listeners.call( "service-log", msg.data );
	});

	conn.onMessage( "call-accepted", function( msg ) {
		listeners.call( "call-accepted", msg.data );
	});

	conn.onMessage( "call-ended", function( msg ) {
		listeners.call( "call-ended", msg.data );
	});

	conn.onMessage( "line-connected", function( msg ) {
		listeners.call( "line-connected", msg.data );
	});

	conn.onMessage( "line-disconnected", function( msg ) {
		listeners.call( "line-disconnected", msg.data );
	});

	this.id = function() { return data.who.id; };
	this.login = function() { return data.who.login; };
	this.RTT = function() { return conn.RTT(); };

	this.param = function( name ) {
		return data.service_options[name];
	};

	this.fares = function() {
		return data.fares;
	};

	this.findCustomer = function( phone )
	{
		return conn.dx().get( "customer-info", {phone: phone} )
		.then( function( info )
		{
			if( !info ) throw "No such customer";
			var c = {name: info.name, addresses: []};
			info.addresses.forEach( function( data ) {
				var addr = new Address( data );
				if( addr.isEmpty() ) return;
				c.addresses.push( addr );
			});
			return c;
		});
	};
}
window.DispatcherClient = DispatcherClient;

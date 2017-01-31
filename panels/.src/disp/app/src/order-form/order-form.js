export default OrderForm;

import AddressGroupSection from './address.js';
import CustomerSection from './customer.js';
import OptionsSection from './options.js';
import PostponeSection from './postpone.js';
import Listeners from '../../lib/listeners.js';
import html from '../../lib/html.js';
import obj from '../../lib/obj.js';
import {tpl} from '../../lib/fmt.js';

var React = require('react');
var ReactDOM = require('react-dom');

import DriverSelector from '../components/order-form/driver-selector.js';

function OrderForm( order )
{
	var listeners = new Listeners([
		"cancel",
		"submit"
	]);
	this.on = listeners.add.bind( listeners );

	var $container = $( '<form class="order-form"></form>' );
	/*
	 * Form title, for order number.
	 */
	var $title = $( '<div class="title"></div>' );
	$container.append( $title );
	
	var driverContainer = document.createElement('div');
	$container.append(driverContainer);
	
	var s = {
		driverId: '0'
	};
	
	function onDriverChange(id) {
		s.driverId = id;
		syncOptions();
		r();
	}

	function r() {
		ReactDOM.render(<DriverSelector onChange={onDriverChange} value={s.driverId}/>, driverContainer);
	}
	r();

	this.setDriver = function( id ) {
		s.driverId = id;
		syncOptions();
		r();
	};


	var options = new OptionsSection( div() );
	var customer = new CustomerSection( div() );

	$container.append( '<b>Место подачи</b>' );
	var from = new AddressGroupSection( $container );

	var $toHeader = $( '<b>Место назначения</b>' );
	$container.append( $toHeader );
	var to = new AddressGroupSection( div( 'dest-section' ), 'dest' );
	$toHeader.on( 'click', function() {
		to.slideToggle();
		$toHeader.toggleClass( 'more' );
	});
	to.hide();
	$toHeader.addClass( 'more' );

	var postpone = new PostponeSection( div() );

	

	customer.onAddress( function( addr ) {
		from.set({addr: addr, loc_id: null});
	});

	function syncOptions() {
		if( s.driverId != '0' ) {
			options.disable();
		} else {
			options.enable();
		}
	}

	/*
	 * Comments input.
	 */
	var $comments = $( html.textarea( "Комментарии" ) );
	div().append( $comments );
	$comments = $comments.filter( 'textarea' );
	/*
	 * Status string, for progress reports.
	 */
	var $status = $( '<div class="status"></div>' );
	$container.append( $status );
	/*
	 * Buttons.
	 */
	addButtons();

	var $controls = $container.find( "input, select, button:not(.cancel), textarea" );

	function div( className ) {
		var $d = $( '<div></div>' );
		if( className ) $d.addClass( className );
		$container.append( $d );
		return $d;
	}

	if( order ) {
		$title.html( "Заказ № " + order.order_id );
		options.set( order );
		customer.set( order );
		$comments.val( order.comments );
		postpone.set( order );
		from.set( order.src );
		if( order.dest ) {
			to.set( order.dest );
		}
	}
	else {
		$title.html( "Новый заказ" );
	}

	this.root = function() {
		return $container.get(0);
	};

	this.lock = function( status ) {
		$status.html( status );
		$controls.prop( "disabled", true );
	};

	this.unlock = function() {
		$status.html( "" );
		$controls.prop( "disabled", false );
	};

	this.locked = function() {
		return $controls.prop( "disabled" );
	};

	this.orderId = function() {
		if( !order ) return null;
		return order.order_uid;
	};

	this.setQueue = function( qid ) {
		from.setQueue( qid );
	};

	this.setCustomerPhone = function( phone, trigger ) {
		customer.setPhone( phone, trigger );
	};

	this.setTitle = function( title, className ) {
		$title.html( title );
		$title.get(0).className = 'title ' + className;
	};

	function addButtons()
	{
		var $ok = $( '<button type="button">Отправить</button>' );
		var $no = $( '<button type="button" class="cancel">Закрыть</button>' );
		$container.append( $ok ).append( $no );
		$ok.on( 'click', function() {
			listeners.call( "submit", {
				order: getOrder(),
				driverId: s.driverId
			});
		});
		$no.on( "click", function() {
			listeners.call( "cancel" );
		});
	}

	function getOrder()
	{
		var data = obj.merge(
			options.get(),
			customer.get(),
			postpone.get()
		);
		data.comments = $comments.val();
		data.status = Order.prototype.POSTPONED;
		data.src = from.get();
		data.dest = to.get();

		if( order ) {
			for( var k in data ) {
				order[k] = data[k];
			}
		} else {
			order = new Order( data );
		}

		return order;
	}
}

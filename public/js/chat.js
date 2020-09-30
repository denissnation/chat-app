const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $sendLocation = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
// const $messagesLocation = document.querySelector('#messages-location');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const messageTemplateLocation = document.querySelector('#message-template-location').innerHTML;
const sideBarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

// Option
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
	// New messsage element
	const $newMessage = $messages.lastElementChild;

	// Height of new message
	const newMessageStyle = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyle.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible Height
	const visibleHeight = $messages.offsetHeight;

	// Height of message Container
	const containerHeight = $messages.scrollHeight;

	// How far i have scrolles?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
};
socket.on('message', (message) => {
	console.log(message);
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('hh:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);

	autoscroll();
});

socket.on('locationMessage', (message) => {
	console.log(message);
	// console.log(messageTemplateLocation);
	const html = Mustache.render(messageTemplateLocation, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('hh:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sideBarTemplate, {
		room,
		users
	});
	document.querySelector('#sideBar').innerHTML = html;
});

// document.querySelector('#sendMessage').addEventListener('click', () => {
// 	const input = document.querySelector('input').value;
// 	// console.log(input);
// 	socket.emit('sendMessage', input);
// });

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault();

	$messageButton.setAttribute('disabled', 'disabled');

	// const input = document.querySelector('input').value;
	const input = e.target.elements.message.value;
	socket.emit('sendMessage', input, (error, message) => {
		$messageButton.removeAttribute('disabled');
		$messageInput.value = '';
		$messageInput.focus();
		if (error) {
			return console.log(error);
		}

		console.log(message);
	});
});

$sendLocation.addEventListener('click', () => {
	$sendLocation.setAttribute('disabled', 'disabled');
	if (!navigator.geolocation) {
		return alert('Geolocation is not support in your browser');
	}
	navigator.geolocation.getCurrentPosition((position) => {
		// const location = {
		// 	latitude: position.coords.latitude,
		// 	longitude: position.coords.longitude
		// };
		// console.log(location);
		// socket.emit('sendLocation', location);

		socket.emit(
			'sendLocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude
			},
			(message) => {
				$sendLocation.removeAttribute('disabled');
				console.log('Location Shared', message);
			}
		);
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
// COUNT APPLICATION
// socket.on('countUpdate', (count) => {
// 	console.log('the count has been connected! ', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
// 	console.log('clicked');

// 	socket.emit('increment');
// });

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const path = require('path');
const io = socketio(server);
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./src/utils/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./src/utils/users');

const port = 3000;

const pathDirectory = path.join(__dirname, './public');

app.use('/', express.static(pathDirectory));

// let count = 0;
io.on('connection', (socket) => {
	console.log('New Socket io Connection');

	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });

		if (error) {
			return callback(error);
		}
		socket.join(user.room);
		socket.emit('message', generateMessage('Admin', 'Welcome!'));
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has join`));
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		});
		callback();
	});
	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);
		const filter = new Filter();

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed');
		}
		io.to(user.room).emit('message', generateMessage(user.username, message));
		callback('Delivered');
	});

	socket.on('sendLocation', (message, callback) => {
		const user = getUser(socket.id);
		io
			.to(user.room)
			.emit(
				'locationMessage',
				generateLocationMessage(
					user.username,
					`https://www.google.com/maps?q=${message.latitude},${message.longitude} `
				)
			);
		callback('delivered');
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}
	});

	// COUNT APPLICATION
	// socket.emit('countUpdate', count);

	// socket.on('increment', () => {
	// 	count++;
	// 	// socket.emit('countUpdate', count);

	// 	io.emit('countUpdate', count);
	// 	// agar terupdate di semua client and connection
	// });
});

// app.get('/', (req, res) => {
// 	res.render('templates/index');
// });

server.listen(port, () => {
	console.log(`Server is up in port ${port}`);
});

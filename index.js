var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});
CONNECTIONS = {};
var conncnt = 0;
io.on('connection', function(socket){
	var addr = socket.handshake.address;
	console.log('conncetion from ' + addr);
	var myNick = 'Guest'+conncnt++;
	socket.emit('nick change', myNick);
	CONNECTIONS[myNick] = socket;
	io.emit('chat message', '*server', myNick + ' joined');
	socket.on('chat message', function(nick, msg){
		io.emit('chat message', myNick, msg);
	});
	socket.on('nick change', function(old,n) {
		if (n == myNick) return;
		if (n in CONNECTIONS) {
			socket.emit('chat message', '*server' ,'already taken :P');
			socket.emit('nick change', myNick);
			return;
		}
		io.emit('chat message', '*server', myNick + ' is now known as ' + n);

		CONNECTIONS[myNick] = CONNECTIONS[n];
		myNick = n;
	});
	socket.on('update', function() {
		io.emit('page update');
	});

	socket.on('connections', function() {
		socket.emit('chat message', '*server', 'I have ' + Object.keys(CONNECTIONS).length + ' connection(s). They are: ' + Object.keys(CONNECTIONS).join(' '));
	});

	socket.on('disconnect', function() {
		io.emit('chat message', '*server', myNick + ' has disconnected');
		console.log('disconnect from ' + addr);
		delete CONNECTIONS[myNick];
	});

	socket.on('kill', function(whom) {
		if (whom in CONNECTIONS) {
			io.emit('chat message', '*server', whom + ' was disconnected. UNLUCKY.');
			CONNECTIONS[whom].emit('chat message', '*client', 'you were disconnected. reload to reconnect');
			CONNECTIONS[whom].disconnect();
			delete CONNECTIONS[whom];
		}
		else {
			socket.emit('chat message', '*server', 'idk who you\'re on about.');
		}

	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

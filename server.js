const socket = require("socket.io")();
const port = 8000;
const tickInterval = 200;

const voteSocket = socket.of('/vote');
const ballotSocket = socket.of('/ballot');

const votes = [];

voteSocket.on('connect', (rtPollClient) => {
    const clientId = rtPollClient.id;
    console.log(`Client connected: ${clientId}`);

    rtPollClient.on('disconnecting', (reason) => {
        console.log("Client disconnecting: ", reason);
    });

    rtPollClient.on('castVote', (voteData) => {
        voteCount = parseInt(voteData, 10) || 0;

        // Short-circuit if NaN or otherwise undefined.
        if (voteCount === 0) return;

        // Limit the vote magnitude.
        voteCount = Math.min(voteCount, 1);
        voteCount = Math.max(voteCount, -1);

        votes.push(voteData);
    });
});

setInterval(() => {
    if ( ! voteSocket.connected) return;
    voteSocket.emit('voteAverage', votes.reduce((cummulative, currentValue) => cummulative + currentValue, 0) / votes.length);
});

ballotSocket.on('connect', (ballotClient) => {
    socket.clients((error, clients) => ballotClient.emit('clientList', clients));
});

console.log("Listening on port ", port);

socket.listen(8000);
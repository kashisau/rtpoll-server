const socket = require("socket.io")();
const port = 8000;
const tickInterval = 200;

const voteSocket = socket.of('/vote');
const ballotSocket = socket.of('/ballot');

// [(negative votes), (positive votes)]
const votes = [0, 0];

let votesTotal = 0;

// Tally votes as they come in.
voteSocket.on('connect', (rtPollClient) => {
    const clientId = rtPollClient.id;
    console.log(`Client connected: ${clientId}`);
    
    voteSocket.emit('voteAverage', (votes[1] - votes[0])/votesTotal);
    
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

        if (voteCount === -1) votes[0]++;
        if (voteCount === 1) votes[1]++;

        if (votes[0] === votes[1]) { votes[0] = 0; votes[1] = 0; }
        
        votesTotal++;

        voteSocket.emit('voteAverage', (votes[1] - votes[0])/votesTotal);
    });
});

ballotSocket.on('connect', (ballotClient) => {
    socket.clients((error, clients) => ballotClient.emit('clientList', clients));
});

console.log("Listening on port ", port);

socket.listen(8000);
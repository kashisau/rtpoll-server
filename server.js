const socket = require("socket.io")();
const port = 8000;
const tickInterval = 200;
const randomcolor = require("randomcolor");

const voteSocket = socket.of('/vote');
const ballotSocket = socket.of('/ballot');

// [(negative votes), (positive votes)]
const votes = [0, 0];
let connectedClients = [];

let votesTotal = 0;

/**
 * Manages the client connection.
 */
voteSocket.on('connect', (rtPollClient) => {
    const clientId = rtPollClient.id;
    
    voteSocket.emit('clientId', clientId);
    voteSocket.emit('voteAverage', (votes[1] - votes[0])/votesTotal);
    
    // Add our client to the client list.
    rtPollClient.on('voterId', (voterId) => {
        let client = connectedClients.find((client) => client.voterId === voterId);
        if (!client) {
            client = {
                id: clientId,
                voterId: voterId,
                colour: randomcolor({luminosity: "dark"}),
                votes: 0,
                positive: 0,
                negative: 0,
                average: 0
            };
            connectedClients.push(client);
        } else {
            // Update the client ID
            client.id = clientId;
        }
        rtPollClient.emit('color', client.colour);
        ballotSocket.emit('clientList', connectedClients);
        rtPollClient.on('castVote', (voteData) => {
            voteCount = parseInt(voteData, 10) || 0;
    
            // Short-circuit if NaN or otherwise undefined.
            if (voteCount === 0) return;
    
            // Limit the vote magnitude.
            voteCount = Math.min(voteCount, 1);
            voteCount = Math.max(voteCount, -1);
    
            if (voteCount === -1) votes[0]++;
            if (voteCount === 1) votes[1]++;
    
            // if (votes[0] === votes[1]) { votes[0] = 0; votes[1] = 0; }
            
            votesTotal++;
            
            client.votes++;
            if (voteCount === -1) client.negative++;
            if (voteCount === 1) client.positive++;
            client.average = (client.positive - client.negative)/client.votes;
    
            connectedClients.map(client => client.totalAverage = (client.positive - client.negative)/votesTotal);
    
            ballotSocket.emit('clientList', connectedClients);
            voteSocket.emit('voteAverage', (votes[1] - votes[0])/votesTotal);
        });
    });

    rtPollClient.on('disconnecting', (reason) => {
        // connectedClients = connectedClients.filter((connectedCLient) => connectedCLient.id !== clientId);
        ballotSocket.emit('clientList', connectedClients);
        console.log("Client disconnecting: ", reason);
    });

});

ballotSocket.on('connect', (ballotClient) => {
    const clientId = ballotClient.id;
    ballotClient.emit('clientList', connectedClients);
    console.log("Ballot server connected. ID: ", clientId);
});

console.log("Listening on port ", port);

socket.listen(8000);
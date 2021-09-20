const Websocket = require('ws');
const fs = require('fs');
const { IP_BOOTSTRAP, IP_PEER } = require('./config/config');

const P2P_PORT = process.env.P2P_PORT || 5001;

const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  nomination: 'NOMINATION',
  rejection: 'REJECTION',
  clearTransactions: 'CLEAR_TRANSACTIONS',
  address: 'ADDRESS',
  peers: 'PEERS',
};

class P2pServer {
  constructor(blockchain, mempool) {
    this.blockchain = blockchain;
    this.mempool = mempool;
    this.sockets = [];
    this.peers = P2P_PORT === 5001 ? [] : [`ws://${IP_BOOTSTRAP}:5001`];
  }

  listen() {
    const server = new Websocket.Server({ port: P2P_PORT });
    // Initialise a websocket server
    server.on('connection', (socket, request) => {
      this.connectSocketAsServer(socket, request);

      socket.on('close', () => this.onCloseServerConnection(socket));
    });
    console.log(`Listening for peer connections on port ${P2P_PORT}`);

    //Connect to the Bootstrapping server
    this.connectToBootstrap();
  }

  //Connecting sockets

  connectSocketAsServer(socket, request) {
    let ip = request.socket.remoteAddress;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    //We store an additional key:value on the socket object
    //It will later store the websocket server port for peers connecting to the network
    socket.remotePeerServer = {
      address: ip,
      remotePort: request.socket.remotePort,
      wsServerPort: 0,
    };

    this.connectSocket(socket);
  }

  connectToBootstrap() {
    if (this.peers[0] === `ws://${IP_BOOTSTRAP}:5001`) {
      const socket = new Websocket(this.peers[0]);
      //This onOpen envent listener is when we connect to the bootstrapping Server as the client
      socket.on('open', () => {
        this.connectSocket(socket);
        this.sendAddress(socket);
      });

      socket.on('close', () => {
        //when bootstrap server goes down
        console.log('Closing client connection to bootstrap: ' + socket._url);
        console.log('Bootstrap server down, follow status and re-connect'.red);
        this.onClosePeerSocket(socket, `ws://${IP_BOOTSTRAP}:5001`);
      });
    }
  }

  connectToPeers(peers) {
    peers.forEach((peer) => {
      const socket = new Websocket(peer);

      socket.on('open', () => {
        this.connectSocket(socket);
        this.sendAddress(socket);
      });

      socket.on('close', () => {
        console.log('closing peer connection: ' + peer);
        this.onClosePeerSocket(socket, peer);
      });
    });
  }

  connectSocket(socket) {
    if (!this.sockets.find((s) => s === socket)) {
      this.sockets.push(socket);
      console.log('Socket connected');
      this.messageHandler(socket);

      this.sendChain(socket);
    }
  }

  //Close sockets helpers

  onCloseServerConnection(socket) {
    const peerToRemove = `ws://${
      this.sockets[this.sockets.indexOf(socket)].remotePeerServer.address
    }:${
      this.sockets[this.sockets.indexOf(socket)].remotePeerServer.wsServerPort
    }`;

    this.onClosePeerSocket(socket, peerToRemove);

    console.log('Closing client peer connection: ' + peerToRemove);
  }

  onClosePeerSocket(socket, peer) {
    this.peers = this.peers.filter((p) => p !== peer);
    this.sockets = this.sockets.filter((s) => s !== socket);
  }

  //Message handler

  messageHandler(socket) {
    socket.on('message', (message) => {
      const data = JSON.parse(message);
      console.log('data:', data);
      switch (data.type) {
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.chain);
          fs.writeFile(
            './local/blockchainJSON.txt',
            JSON.stringify(this.blockchain),
            (err) => {
              if (err) throw err;
              console.log('Writing blockchain to local file');
            }
          );
          break;
        case MESSAGE_TYPES.transaction:
          if (data.transaction.input.type === 'BADGE') {
            this.mempool.addBadgeTransaction(data.transaction);
          } else {
            this.mempool.addOrUpdateTransaction(data.transaction);
          }
          break;
        case MESSAGE_TYPES.nomination:
          this.mempool.addNomination(data.nomination);
          break;
        case MESSAGE_TYPES.rejection:
          this.mempool.removeNomination(data.nomId);
          break;
        case MESSAGE_TYPES.clearTransactions:
          this.mempool.clearMempool();
          break;
        case MESSAGE_TYPES.address:
          socket.remotePeerServer.wsServerPort = data.port;
          const fullIp = `ws://${data.address}:${data.port}`;
          if (!this.peers.find((peer) => peer === fullIp)) {
            this.peers.push(fullIp);
          }
          this.sockets.forEach((socket) => this.sendPeers(socket, this.peers));
          break;
        case MESSAGE_TYPES.peers:
          const newPeers = data.peers.filter((peer) => {
            return (
              !this.peers.find((knownPeer) => knownPeer === peer) &&
              peer !== `ws://${IP_PEER}:${P2P_PORT}`
            );
          });

          newPeers.forEach((peer) => this.peers.push(peer));

          this.connectToPeers(newPeers);
          break;
      }
    });
  }

  //Sending messages

  //syncChains still necessary? Not really, due to broadcastChain method
  syncChains() {
    this.sockets.forEach((socket) => {
      this.sendChain(socket);
    });
  }

  sendChain(socket) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.chain,
        chain: this.blockchain.chain,
      })
    );
  }

  sendAddress(socket) {
    console.log('sending address');
    let ip = socket._socket.address().address;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }

    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.address,
        address: ip,
        port: P2P_PORT,
      })
    );
  }

  sendPeers(socket, peers) {
    console.log('sending peers');
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.peers,
        peers,
      })
    );
  }

  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.transaction,
        transaction,
      })
    );
  }

  sendNomination(socket, nomination) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.nomination,
        nomination,
      })
    );
  }

  sendRejection(socket, nomId) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.rejection,
        nomId,
      })
    );
  }

  broadcastChain() {
    this.sockets.forEach((socket) => this.sendChain(socket));
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => this.sendTransaction(socket, transaction));
  }

  broadcastNomination(nomination) {
    this.sockets.forEach((socket) => this.sendNomination(socket, nomination));
  }

  broadcastRejection(nomId) {
    this.sockets.forEach((socket) => this.sendRejection(socket, nomId));
  }

  broadcastClearTransactions() {
    this.sockets.forEach((socket) =>
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPES.clearTransactions,
        })
      )
    );
  }
}

module.exports = P2pServer;

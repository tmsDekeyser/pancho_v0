# pancho_v0

A local simulation of a blockchain where a bootstrapping server and multiple peers can function as full nodes in a peer-to-peer network, mining blocks, posting and verifying cryptocurrency transactions and keeping a distributed ledger synced across the p2p network.

It uses the square money principle where coins or tokens are exchanged normally, but every transaction from sender to recipient also increases every participant's so-called flow, which stores most of the value, parameter equally. This way a system is set up where both parties are rewarded for setting up a transaction.

Additionally, with the mining of each block, not only a mining reward is handed out but also a dividend to every known address that has been involved in a transaction recorded on the blockchain.

API endpoints documentation is provided in the **About** section. You can run it in Postman and use Environments to easily switch between different peers.

# Start bootstrapping server

run the `npm run server` command

# Start peer

run `npm run peer` or `npm run peer2` commands to start a peer with HTTP_PORT 300x and P2P_PORT 500x

If you need more than 3 nodes, you can run:

`HTTP_PORT=300x P2P_PORT=500x node app.js`

Where you change x based on a free combination of ports

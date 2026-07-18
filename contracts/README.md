# Sample Hardhat 3 Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about Hardhat 3, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3](https://hardhat.org/hardhat3-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Deploy Election to Sepolia

1. Put RPC + deployer key in `contracts/.env`:

```shell
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key
```

2. Fund the deployer with Sepolia ETH, then:

```shell
npx hardhat compile
npx hardhat ignition deploy --network sepolia ignition/modules/Election.ts
```

3. Copy the deployed address into the app root `.env` as `NEXT_PUBLIC_ELECTION_ADDRESS`.

4. As the deployer (`admin`): `setAdminSigner` → `addParty` (one or more) → `startElection`.

Sample Counter module (local / Sepolia):

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

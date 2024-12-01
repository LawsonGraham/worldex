const fs = require('fs');
const path = require('path');

// Ensure the src/abi directory exists
const abiDir = path.join(process.cwd(), 'src', 'abi');
if (!fs.existsSync(abiDir)) {
  fs.mkdirSync(abiDir, { recursive: true });
}

// Path to the ABI file
const abiPath = path.join(abiDir, 'ContractAbi.json');

// Check if ABI file already exists
if (!fs.existsSync(abiPath)) {
  // Create a minimal ABI if forge inspect is not available
  const minimalAbi = [
    {
      "inputs": [],
      "name": "depositEth",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getEthBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_ticker",
          "type": "address"
        },
        {
          "internalType": "enum Side",
          "name": "_side",
          "type": "uint8"
        }
      ],
      "name": "getOrderBook",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "enum OrderType",
              "name": "orderType",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "trader",
              "type": "address"
            },
            {
              "internalType": "enum Side",
              "name": "side",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "ticker",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountFilled",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "price",
              "type": "uint256"
            }
          ],
          "internalType": "struct Order[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Write the ABI to file
  fs.writeFileSync(abiPath, JSON.stringify(minimalAbi, null, 2));
  console.log('Created minimal ABI file');
} else {
  console.log('ABI file already exists');
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Dex.sol";
import "../src/Token.sol";
import "../src/interfaces/IWorldID.sol";

contract MockWorldID is IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external pure override {
        // Mock implementation that accepts any proof
        root; groupId; signalHash; nullifierHash; externalNullifierHash; proof;
    }
}

contract DexLimitOrderTest is Test {
    Dex public dex;
    Link public link;
    MockWorldID public worldId;
    address public owner;
    address public user1;
    bytes32 constant LINK = bytes32("LINK");
    bytes32 constant ETH = bytes32("ETH");

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        vm.deal(user1, 100 ether);
        
        // Deploy contracts
        worldId = new MockWorldID();
        dex = new Dex(owner, worldId, "app_id", "action_id");
        link = new Link();

        // Setup
        vm.startPrank(owner);
        dex.addToken(LINK, address(link));
        vm.stopPrank();

        // Verify user1
        vm.startPrank(user1);
        dex.registerUser(
            user1, // signal parameter should be the user's address
            0, // root
            0, // nullifierHash
            [uint256(0), 0, 0, 0, 0, 0, 0, 0] // proof
        );
        vm.stopPrank();

        // Skip initial cooldown after registration
        skip(10);
    }

    function test_BuyLimitOrderTransfersEthToReservedBalance() public {
        // Setup
        vm.startPrank(user1);
        dex.depositEth{value: 10 ether}();
        uint initialEthBalance = dex.balances(user1, ETH);
        uint initialReservedBalance = dex.getReservedEthBalance();

        // Create buy limit order
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);

        uint finalEthBalance = dex.balances(user1, ETH);
        uint finalReservedBalance = dex.getReservedEthBalance();
        vm.stopPrank();

        assertEq(finalEthBalance, initialEthBalance - 10 ether, "ETH balance not decreased correctly");
        assertEq(finalReservedBalance, initialReservedBalance + 10 ether, "Reserved balance not increased correctly");
    }

    function test_SellLimitOrderTransfersTokensToReservedBalance() public {
        // Setup
        vm.startPrank(owner);
        link.transfer(user1, 100);
        vm.stopPrank();

        vm.startPrank(user1);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        uint initialTokenBalance = dex.balances(user1, LINK);
        uint initialReservedBalance = dex.getReservedTokenBalance(LINK);

        // Create sell limit order
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether);

        uint finalTokenBalance = dex.balances(user1, LINK);
        uint finalReservedBalance = dex.getReservedTokenBalance(LINK);
        vm.stopPrank();

        assertEq(finalTokenBalance, initialTokenBalance - 50, "Token balance not decreased correctly");
        assertEq(finalReservedBalance, initialReservedBalance + 50, "Reserved balance not increased correctly");
    }

    function test_RevertBuyOrderWithInsufficientEthBalance() public {
        vm.startPrank(user1);
        dex.depositEth{value: 1 ether}();

        vm.expectRevert("Insufficient ETH balance");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        vm.stopPrank();
    }

    function test_RevertSellOrderWithInsufficientTokenBalance() public {
        vm.startPrank(user1);
        vm.expectRevert("Insufficient token balance");
        dex.createLimitOrder(Dex.Side.SELL, LINK, 10, 1 ether);
        vm.stopPrank();
    }

    function test_BuyOrderbookSortedByAscendingPrices() public {
        // Setup multiple buy orders at different prices
        vm.startPrank(user1);
        dex.depositEth{value: 60 ether}(); // Deposit enough for all orders

        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 2 ether);
        // Wait for cooldown
        skip(10);
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        // Wait for cooldown
        skip(10);
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 3 ether);
        vm.stopPrank();

        Dex.Order[] memory orders = dex.getOrderBook(LINK, Dex.Side.BUY);
        
        for (uint i = 1; i < orders.length; i++) {
            assertTrue(orders[i].price >= orders[i-1].price, "Buy orders not sorted in ascending order");
        }
    }

    function test_SellOrderbookSortedByDescendingPrices() public {
        // Setup
        vm.startPrank(owner);
        link.transfer(user1, 100);
        vm.stopPrank();

        // Create multiple sell orders at different prices
        vm.startPrank(user1);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);

        dex.createLimitOrder(Dex.Side.SELL, LINK, 10, 2 ether);
        // Wait for cooldown
        skip(10);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 10, 1 ether);
        // Wait for cooldown
        skip(10);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 10, 3 ether);
        vm.stopPrank();

        Dex.Order[] memory orders = dex.getOrderBook(LINK, Dex.Side.SELL);
        
        for (uint i = 1; i < orders.length; i++) {
            assertTrue(orders[i].price <= orders[i-1].price, "Sell orders not sorted in descending order");
        }
    }
}

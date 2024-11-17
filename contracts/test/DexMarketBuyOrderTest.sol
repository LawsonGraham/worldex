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

contract DexMarketBuyOrderTest is Test {
    Dex public dex;
    Link public link;
    MockWorldID public worldId;
    address public owner;
    address public user1;
    address public user2;
    bytes32 constant LINK = bytes32("LINK");
    bytes32 constant ETH = bytes32("ETH");

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        // Deploy contracts
        worldId = new MockWorldID();
        dex = new Dex(owner, worldId, "app_id", "action_id");
        link = new Link();

        // Setup
        vm.startPrank(owner);
        dex.addToken(LINK, address(link));
        link.transfer(user2, 1000); // Give user2 some LINK tokens
        vm.stopPrank();

        // Verify users
        vm.startPrank(user1);
        dex.registerUser(
            user1,
            0, // root
            0, // nullifierHash
            [uint256(0), 0, 0, 0, 0, 0, 0, 0] // proof
        );
        vm.stopPrank();

        vm.startPrank(user2);
        dex.registerUser(
            user2,
            1, // root
            1, // nullifierHash
            [uint256(0), 0, 0, 0, 0, 0, 0, 0] // proof
        );
        vm.stopPrank();
    }

    function test_CreateBuyMarketOrderWithEmptyOrderbook() public {
        vm.startPrank(user1);
        dex.depositEth{value: 10 ether}();
        
        // Should pass even with empty orderbook
        dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        vm.stopPrank();

        Dex.Order[] memory orders = dex.getOrderBook(LINK, Dex.Side.SELL);
        assertEq(orders.length, 0, "Orderbook should be empty");
    }

    function test_RevertBuyMarketOrderWithNoEth() public {
        vm.startPrank(user1);
        vm.expectRevert("Insufficient ETH balance");
        dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        vm.stopPrank();
    }

    function test_BuyMarketOrderGets100PercentFilled() public {
        // Setup sell order
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether);
        vm.stopPrank();

        // Create market buy order
        vm.startPrank(user1);
        dex.depositEth{value: 50 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 50);
        vm.stopPrank();

        uint user1Balance = dex.balances(user1, LINK);
        assertEq(user1Balance, 50, "Market buy order not filled correctly");
    }

    function test_BuyMarketOrderReducesEthBalance() public {
        // Setup sell order
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether);
        vm.stopPrank();

        // Create market buy order
        vm.startPrank(user1);
        dex.depositEth{value: 50 ether}();
        uint initialEthBalance = dex.balances(user1, ETH);
        dex.createMarketOrder(Dex.Side.BUY, LINK, 50);
        vm.stopPrank();

        uint finalEthBalance = dex.balances(user1, ETH);
        assertEq(finalEthBalance, initialEthBalance - 50 ether, "ETH balance not reduced correctly");
    }

    function test_BuyMarketOrderRemovesFilledOrders() public {
        // Setup sell order
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether);
        vm.stopPrank();

        // Create market buy order that fills the entire sell order
        vm.startPrank(user1);
        dex.depositEth{value: 50 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 50);
        vm.stopPrank();

        Dex.Order[] memory orders = dex.getOrderBook(LINK, Dex.Side.SELL);
        assertEq(orders.length, 0, "Filled order not removed from orderbook");
    }

    function test_BuyMarketOrderEmptiesOrderbookWhenAmountExceedsAvailable() public {
        // Setup sell orders
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether);
        vm.stopPrank();

        // Create market buy order for more than available
        vm.startPrank(user1);
        dex.depositEth{value: 100 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 100);
        vm.stopPrank();

        Dex.Order[] memory orders = dex.getOrderBook(LINK, Dex.Side.SELL);
        assertEq(orders.length, 0, "Orderbook not emptied");

        uint filledAmount = dex.balances(user1, LINK);
        assertEq(filledAmount, 50, "Incorrect amount filled");
    }
}

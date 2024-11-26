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

contract DexRateLimitTest is Test {
    Dex public dex;
    Link public link;
    MockWorldID public worldId;
    address public owner;
    address public trader;
    bytes32 constant LINK = bytes32("LINK");
    bytes32 constant ETH = bytes32("ETH");

    function setUp() public {
        owner = address(this);
        trader = makeAddr("trader");
        vm.deal(trader, 200 ether);
        
        // Deploy contracts
        worldId = new MockWorldID();
        dex = new Dex(owner, worldId, "app_id", "action_id");
        link = new Link();

        // Setup
        vm.startPrank(owner);
        dex.addToken(LINK, address(link));
        vm.stopPrank();

        // Setup trader
        vm.startPrank(trader);
        // Register and verify trader - passing trader address as signal
        dex.registerUser(
            trader, // signal parameter should be the trader's address
            0, // root
            0, // nullifierHash
            [uint256(0), 0, 0, 0, 0, 0, 0, 0] // proof
        );
        // Fund trader with more ETH for multiple orders
        dex.depositEth{value: 150 ether}();
        vm.stopPrank();

        // Fund trader with LINK
        vm.startPrank(owner);
        link.transfer(trader, 1000);
        vm.stopPrank();

        vm.startPrank(trader);
        link.approve(address(dex), 1000);
        dex.deposit(1000, LINK);
        vm.stopPrank();

        // Skip initial cooldown after registration
        skip(10);
    }

    function testCooldownPeriod() public {
        vm.startPrank(trader);
        
        // First trade should succeed
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        // Second trade immediately after should fail
        vm.expectRevert("Trade cooldown period not elapsed");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        // Wait 8 seconds (less than cooldown)
        skip(8);
        vm.expectRevert("Trade cooldown period not elapsed");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        // Wait another 2 seconds (total 10 seconds, equal to cooldown)
        skip(2);
        // This should succeed
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        vm.stopPrank();
    }

    function testDailyTradeLimit() public {
        vm.startPrank(trader);
        
        // Place 10 orders (maximum daily limit)
        for(uint i = 0; i < 10; i++) {
            // Skip cooldown period for each trade
            if (i > 0) skip(10);
            dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        }
        
        // 11th order should fail
        skip(10);
        vm.expectRevert("Daily trade limit reached");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        vm.stopPrank();
    }

    function testDailyTradeLimitAcrossOrderTypes() public {
        vm.startPrank(trader);
        
        // Place 5 limit orders
        for(uint i = 0; i < 5; i++) {
            if (i > 0) skip(10);
            dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        }

        // Place 5 market orders
        for(uint i = 0; i < 5; i++) {
            skip(10);
            dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        }
        
        // 11th order (limit order) should fail
        skip(10);
        vm.expectRevert("Daily trade limit reached");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);

        // 11th order (market order) should also fail
        skip(10);
        vm.expectRevert("Daily trade limit reached");
        dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        
        vm.stopPrank();
    }

    function testDailyLimitReset() public {
        vm.startPrank(trader);
        
        // Place 10 orders
        for(uint i = 0; i < 10; i++) {
            // Skip cooldown period for each trade
            if (i > 0) skip(10);
            dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        }
        
        // Skip to next day
        skip(24 * 60 * 60);
        
        // Should be able to trade again
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        vm.stopPrank();
    }

    function testRemainingTradesGetter() public {
        vm.startPrank(trader);
        
        // Initially should have 10 trades available
        assertEq(dex.getRemainingDailyTrades(), 10);
        
        // Place 5 orders
        for(uint i = 0; i < 5; i++) {
            // Skip cooldown period for each trade
            if (i > 0) skip(10);
            dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        }
        
        // Should have 5 trades remaining
        assertEq(dex.getRemainingDailyTrades(), 5);
        
        // Skip to next day
        skip(24 * 60 * 60);
        
        // Should be reset to 10
        assertEq(dex.getRemainingDailyTrades(), 10);
        
        vm.stopPrank();
    }

    function testRemainingCooldownGetter() public {
        vm.startPrank(trader);
        
        // Initially should have no cooldown
        assertEq(dex.getRemainingCooldown(), 0);
        
        // Place an order
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        // Should have close to full cooldown
        assertGt(dex.getRemainingCooldown(), 9); // Allow for slight timestamp variations
        
        // Skip 4 seconds
        skip(4);
        
        // Should have around 6 seconds remaining
        uint256 remaining = dex.getRemainingCooldown();
        assertGt(remaining, 5);
        assertLt(remaining, 7);
        
        // Skip 10 seconds
        skip(10);
        
        // Should have no cooldown
        assertEq(dex.getRemainingCooldown(), 0);
        
        vm.stopPrank();
    }

    function testCooldownAcrossOrderTypes() public {
        vm.startPrank(trader);
        
        // Place limit order
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        // Try market order immediately after
        vm.expectRevert("Trade cooldown period not elapsed");
        dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        
        // Wait for cooldown
        skip(10);
        
        // Place market order
        dex.createMarketOrder(Dex.Side.BUY, LINK, 10);
        
        // Try limit order immediately after
        vm.expectRevert("Trade cooldown period not elapsed");
        dex.createLimitOrder(Dex.Side.BUY, LINK, 10, 1 ether);
        
        vm.stopPrank();
    }
}

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

contract DexSwapTest is Test {
    Dex public dex;
    Link public link;
    MockWorldID public worldId;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    bytes32 constant LINK = bytes32("LINK");
    bytes32 constant ETH = bytes32("ETH");

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Give users some ETH - increased amount for tests
        vm.deal(user1, 1000 ether);
        vm.deal(user2, 1000 ether);
        vm.deal(user3, 1000 ether);
        
        // Deploy contracts
        worldId = new MockWorldID();
        dex = new Dex(owner, worldId, "app_id", "action_id");
        link = new Link(); // Deploy Link token

        // Setup initial token distribution
        vm.startPrank(owner);
        dex.addToken(LINK, address(link));
        link.transfer(user2, 1000); // Give user2 some tokens
        link.transfer(user3, 1000); // Give user3 some tokens
        vm.stopPrank();

        // Verify all users
        vm.startPrank(user1);
        dex.registerUser(user1, 0, 0, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        vm.stopPrank();

        vm.startPrank(user2);
        dex.registerUser(user2, 1, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        vm.stopPrank();

        vm.startPrank(user3);
        dex.registerUser(user3, 2, 2, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        vm.stopPrank();
    }

    function test_SwapTokenToEth() public {
        // User2 wants to sell LINK for ETH
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 100, 1 ether); // Sell 100 LINK at 1 ETH each
        vm.stopPrank();

        // User1 wants to buy LINK with ETH
        vm.startPrank(user1);
        dex.depositEth{value: 100 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 100);
        vm.stopPrank();

        // Verify the swap
        uint256 user1LinkBalance = dex.balances(user1, LINK);
        uint256 user2EthBalance = dex.balances(user2, ETH);
        
        assertEq(user1LinkBalance, 100, "User1 should have received 100 LINK");
        assertEq(user2EthBalance, 100 ether, "User2 should have received 100 ETH");
    }

    function test_SwapEthToToken() public {
        // User1 wants to buy LINK with ETH using a limit order
        vm.startPrank(user1);
        dex.depositEth{value: 50 ether}();
        dex.createLimitOrder(Dex.Side.BUY, LINK, 50, 1 ether); // Buy 50 LINK at 1 ETH each
        vm.stopPrank();

        // User2 sells LINK for ETH using a market order
        vm.startPrank(user2);
        link.approve(address(dex), 50);
        dex.deposit(50, LINK);
        dex.createMarketOrder(Dex.Side.SELL, LINK, 50);
        vm.stopPrank();

        // Verify the swap
        uint256 user1LinkBalance = dex.balances(user1, LINK);
        uint256 user2EthBalance = dex.balances(user2, ETH);
        
        assertEq(user1LinkBalance, 50, "User1 should have received 50 LINK");
        assertEq(user2EthBalance, 50 ether, "User2 should have received 50 ETH");
    }

    function test_SwapWithPriceSlippage() public {
        // Setup: Create two sell orders at different prices
        vm.startPrank(user2);
        link.approve(address(dex), 100);
        dex.deposit(100, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether); // First 50 LINK at 1 ETH each
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 2 ether); // Next 50 LINK at 2 ETH each
        vm.stopPrank();

        // User1 buys LINK, experiencing price slippage
        vm.startPrank(user1);
        // Need enough ETH for worst-case scenario: (50 * 1 ETH) + (25 * 2 ETH) = 100 ETH
        dex.depositEth{value: 100 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 75); // Buy 75 LINK total
        vm.stopPrank();

        // Verify the swap with slippage
        uint256 user1LinkBalance = dex.balances(user1, LINK);
        uint256 user2EthBalance = dex.balances(user2, ETH);
        
        assertEq(user1LinkBalance, 75, "User1 should have received 75 LINK");
        // First 50 LINK cost 1 ETH each = 50 ETH
        // Next 25 LINK cost 2 ETH each = 50 ETH
        // Total should be 100 ETH
        assertEq(user2EthBalance, 100 ether, "User2 should have received 100 ETH total");
    }

    function test_SwapWithMultipleOrders() public {
        // Setup multiple sell orders from different users
        vm.startPrank(user2);
        link.approve(address(dex), 50);
        dex.deposit(50, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1 ether); // 50 LINK at 1 ETH each
        vm.stopPrank();

        vm.startPrank(user3);
        link.approve(address(dex), 50);
        dex.deposit(50, LINK);
        dex.createLimitOrder(Dex.Side.SELL, LINK, 50, 1.5 ether); // 50 LINK at 1.5 ETH each
        vm.stopPrank();

        // User1 buys LINK, matching against both orders
        vm.startPrank(user1);
        // Calculate total ETH needed: (50 * 1 ETH) + (50 * 1.5 ETH) = 125 ETH
        dex.depositEth{value: 125 ether}();
        dex.createMarketOrder(Dex.Side.BUY, LINK, 100);
        vm.stopPrank();

        // Verify the swaps
        uint256 user1LinkBalance = dex.balances(user1, LINK);
        uint256 user2EthBalance = dex.balances(user2, ETH);
        uint256 user3EthBalance = dex.balances(user3, ETH);
        
        assertEq(user1LinkBalance, 100, "User1 should have received 100 LINK total");
        assertEq(user2EthBalance, 50 ether, "User2 should have received 50 ETH");
        assertEq(user3EthBalance, 75 ether, "User3 should have received 75 ETH");
    }
}

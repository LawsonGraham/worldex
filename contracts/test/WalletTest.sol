// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Wallet.sol";
import "../src/Token.sol";

contract WalletTest is Test {
    Wallet public wallet;
    Link public link;
    address public owner;
    address public user1;
    bytes32 constant LINK = bytes32("LINK");

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        vm.deal(user1, 100 ether);
        
        // Deploy contracts
        wallet = new Wallet(owner);
        link = new Link();
    }

    function test_OwnerCanAddToken() public {
        // Owner should be able to add token
        vm.prank(owner);
        wallet.addToken(LINK, address(link));
    }

    function test_NonOwnerCannotAddToken() public {
        // Non-owner should not be able to add token
        vm.prank(user1);
        vm.expectRevert();
        wallet.addToken(LINK, address(link));
    }

    function test_HandleDeposits() public {
        // Setup
        vm.startPrank(owner);
        wallet.addToken(LINK, address(link));
        link.approve(address(wallet), 500);
        
        // Test deposit
        wallet.deposit(100, LINK);
        vm.stopPrank();

        uint balance = wallet.balances(owner, LINK);
        assertEq(balance, 100, "Invalid balance");
    }

    function test_RevertExcessiveWithdrawals() public {
        // Setup
        vm.startPrank(owner);
        wallet.addToken(LINK, address(link));
        link.approve(address(wallet), 500);
        wallet.deposit(100, LINK);

        // Try to withdraw more than deposited
        vm.expectRevert();
        wallet.withdraw(200, LINK);
        vm.stopPrank();
    }

    function test_HandleWithdrawals() public {
        // Setup
        vm.startPrank(owner);
        wallet.addToken(LINK, address(link));
        link.approve(address(wallet), 500);
        wallet.deposit(100, LINK);

        // Test withdrawal
        wallet.withdraw(100, LINK);
        vm.stopPrank();

        uint balance = wallet.balances(owner, LINK);
        assertEq(balance, 0, "Balance should be 0 after withdrawal");
    }
}

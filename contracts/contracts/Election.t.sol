// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Election} from "./Election.sol";

contract ElectionTest is Test {
    Election internal election;

    uint256 internal adminSignerPk = 0xA11CE;
    address internal adminSignerAddr;
    address internal voter = address(0xBEEF);

    function setUp() public {
        adminSignerAddr = vm.addr(adminSignerPk);
        election = new Election();
        election.setAdminSigner(adminSignerAddr);
        election.addParty("Civic Alliance", "CA");
        election.addParty("Progress Union", "PU");
        election.startElection();
    }

    function test_AdminIsDeployer() public view {
        assertEq(election.admin(), address(this));
    }

    function test_CastVoteWithValidEligibilityTicket() public {
        bytes memory sig = _signEligibility(voter);

        vm.prank(voter);
        election.castVote(0, sig);

        assertTrue(election.hasVoted(voter));
        assertEq(election.voteCount(0), 1);
    }

    function test_RevertWhenDoubleVote() public {
        bytes memory sig = _signEligibility(voter);

        vm.prank(voter);
        election.castVote(0, sig);

        vm.prank(voter);
        vm.expectRevert(Election.AlreadyVoted.selector);
        election.castVote(1, sig);
    }

    function test_RevertWhenInvalidEligibilityTicket() public {
        // Signed for a different voter than msg.sender.
        bytes memory sig = _signEligibility(address(0xBAD));

        vm.prank(voter);
        vm.expectRevert(Election.InvalidEligibilityTicket.selector);
        election.castVote(0, sig);
    }

    function test_GetResultsParallelArrays() public {
        bytes memory sig = _signEligibility(voter);
        vm.prank(voter);
        election.castVote(1, sig);

        (Election.Party[] memory partyList, uint256[] memory counts) = election
            .getResults();

        assertEq(partyList.length, 2);
        assertEq(counts.length, 2);
        assertEq(partyList[0].shortCode, "CA");
        assertEq(partyList[1].shortCode, "PU");
        assertEq(counts[0], 0);
        assertEq(counts[1], 1);
    }

    function test_CloseElectionStopsVoting() public {
        election.closeElection();

        bytes memory sig = _signEligibility(voter);
        vm.prank(voter);
        vm.expectRevert(Election.InvalidState.selector);
        election.castVote(0, sig);
    }

    function _signEligibility(
        address ticketVoter
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                election.ELIGIBILITY_TICKET_TYPEHASH(),
                ticketVoter,
                address(election)
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminSignerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _hashTypedDataV4(
        bytes32 structHash
    ) internal view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("CivicVote")),
                keccak256(bytes("1")),
                block.chainid,
                address(election)
            )
        );
        return
            keccak256(
                abi.encodePacked("\x19\x01", domainSeparator, structHash)
            );
    }
}

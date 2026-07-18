// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Election
 * @notice On-chain civic election: admin-managed parties, EIP-712 eligibility tickets,
 *         and one vote per citizen smart account while the election is Active.
 */
contract Election is EIP712 {
    /// @notice Lifecycle stages for the election.
    enum ElectionState {
        NotStarted,
        Registration,
        Active,
        Closed
    }

    /// @notice A registered political party that citizens may vote for.
    struct Party {
        uint256 id;
        string name;
        string shortCode;
    }

    /// @notice Off-chain eligibility ticket signed by `adminSigner` for a voter.
    /// @dev Field names must stay in sync with the backend EIP-712 type definition.
    struct EligibilityTicket {
        address voter;
        address votingContract;
    }

    /// @dev EIP-712 typehash for EligibilityTicket(address voter,address votingContract).
    bytes32 public constant ELIGIBILITY_TICKET_TYPEHASH =
        keccak256("EligibilityTicket(address voter,address votingContract)");

    /// @notice Deployer / election operator (distinct from the off-chain eligibility signer).
    address public admin;

    /// @notice Backend-controlled key that signs eligibility tickets off-chain only.
    address public adminSigner;

    /// @notice Current election lifecycle state.
    ElectionState public state;

    /// @notice Registered parties in insertion order (index == party id).
    Party[] public parties;

    /// @notice Whether a voter address has already cast a ballot.
    mapping(address => bool) public hasVoted;

    /// @notice Tallied votes keyed by party id.
    mapping(uint256 => uint256) public voteCount;

    /// @notice Emitted when a citizen successfully casts a vote.
    event VoteCast(
        address indexed voter,
        uint256 indexed partyId,
        uint256 timestamp
    );

    /// @notice Emitted when a party is added before voting begins.
    event PartyAdded(uint256 indexed partyId, string name, string shortCode);

    /// @notice Emitted when the off-chain eligibility signer is configured.
    event AdminSignerSet(address indexed signer);

    /// @notice Emitted when the election becomes Active.
    event ElectionStarted();

    /// @notice Emitted when the election becomes Closed.
    event ElectionClosed();

    error NotAdmin();
    error AlreadyVoted();
    error InvalidState();
    error InvalidEligibilityTicket();
    error InvalidParty();
    error SignerAlreadySet();
    error ZeroAddress();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /**
     * @notice Deploys the election with the deployer as admin.
     * @dev Initializes the EIP-712 domain to match backend ticket signing
     *      (`CivicVote` / `1` in `lib/eligibility.ts`).
     */
    constructor() EIP712("CivicVote", "1") {
        admin = msg.sender;
        state = ElectionState.NotStarted;
    }

    /**
     * @notice Registers a party that voters may choose once the election is Active.
     * @dev Restricted to admin and only allowed before voting opens so the ballot
     *      cannot change mid-election.
     * @param name Full party name shown in results / UI.
     * @param shortCode Compact party code for display.
     */
    function addParty(
        string calldata name,
        string calldata shortCode
    ) external onlyAdmin {
        if (
            state != ElectionState.NotStarted &&
            state != ElectionState.Registration
        ) {
            revert InvalidState();
        }

        uint256 partyId = parties.length;
        parties.push(Party({id: partyId, name: name, shortCode: shortCode}));
        emit PartyAdded(partyId, name, shortCode);
    }

    /**
     * @notice Sets the backend eligibility signer exactly once before voting starts.
     * @dev This address is a dedicated key used only to sign EIP-712 eligibility
     *      tickets off-chain; it is intentionally separate from `admin`.
     * @param signer Address corresponding to the backend `ADMIN_SIGNER_PRIVATE_KEY`.
     */
    function setAdminSigner(address signer) external onlyAdmin {
        if (signer == address(0)) revert ZeroAddress();
        if (adminSigner != address(0)) revert SignerAlreadySet();
        if (
            state == ElectionState.Active || state == ElectionState.Closed
        ) {
            revert InvalidState();
        }

        adminSigner = signer;
        emit AdminSignerSet(signer);
    }

    /**
     * @notice Opens voting by transitioning into the Active state.
     * @dev Allowed from NotStarted or Registration so admins can skip an explicit
     *      registration phase if parties were configured while NotStarted.
     */
    function startElection() external onlyAdmin {
        if (
            state != ElectionState.NotStarted &&
            state != ElectionState.Registration
        ) {
            revert InvalidState();
        }

        state = ElectionState.Active;
        emit ElectionStarted();
    }

    /**
     * @notice Ends voting permanently by transitioning Active -> Closed.
     * @dev After close, no further ballots are accepted; results remain readable.
     */
    function closeElection() external onlyAdmin {
        if (state != ElectionState.Active) revert InvalidState();

        state = ElectionState.Closed;
        emit ElectionClosed();
    }

    /**
     * @notice Casts a single vote for `partyId` while the election is Active.
     * @dev `msg.sender` is the citizen's own ERC-4337 smart account (via Privy), so
     *      the vote is genuinely signed by the citizen — the eligibilitySignature
     *      only proves the backend verified their eligibility beforehand, it does
     *      not authorize the vote choice itself.
     * @param partyId Index of the party in `parties`.
     * @param eligibilitySignature EIP-712 signature from `adminSigner` over
     *        EligibilityTicket{voter: msg.sender, votingContract: address(this)}.
     */
    function castVote(
        uint256 partyId,
        bytes calldata eligibilitySignature
    ) external {
        if (state != ElectionState.Active) revert InvalidState();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (partyId >= parties.length) revert InvalidParty();

        bytes32 structHash = keccak256(
            abi.encode(
                ELIGIBILITY_TICKET_TYPEHASH,
                msg.sender,
                address(this)
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recoverCalldata(digest, eligibilitySignature);
        if (signer != adminSigner) revert InvalidEligibilityTicket();

        hasVoted[msg.sender] = true;
        unchecked {
            voteCount[partyId] += 1;
        }

        emit VoteCast(msg.sender, partyId, block.timestamp);
    }

    /**
     * @notice Returns every party with its tallied vote count for result display.
     * @dev Arrays are parallel: `counts[i]` is the total for `partyList[i]`.
     * @return partyList Registered parties in insertion order.
     * @return counts Vote totals aligned with `partyList` indices / party ids.
     */
    function getResults()
        external
        view
        returns (Party[] memory partyList, uint256[] memory counts)
    {
        uint256 len = parties.length;
        partyList = parties;
        counts = new uint256[](len);
        for (uint256 i = 0; i < len; ) {
            counts[i] = voteCount[i];
            unchecked {
                ++i;
            }
        }
    }
}

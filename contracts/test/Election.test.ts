import { expect } from "chai";
import { network } from "hardhat";
import type { Wallet } from "ethers";

const { ethers, networkHelpers } = await network.create();

const ELIGIBILITY_TYPES = {
  EligibilityTicket: [
    { name: "voter", type: "address" },
    { name: "votingContract", type: "address" },
  ],
};

async function signEligibilityTicket(
  signer: Wallet,
  voter: string,
  votingContract: string,
  chainId: bigint,
): Promise<string> {
  return signer.signTypedData(
    {
      name: "CivicVote",
      version: "1",
      chainId,
      verifyingContract: votingContract,
    },
    ELIGIBILITY_TYPES,
    {
      voter,
      votingContract,
    },
  );
}

async function deployElectionFixture() {
  const [admin, stranger, citizen1, citizen2, citizen3] =
    await ethers.getSigners();

  const adminSigner = ethers.Wallet.createRandom();
  const wrongSigner = ethers.Wallet.createRandom();

  const election = await ethers.deployContract("Election", [], admin);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  return {
    election,
    admin,
    stranger,
    citizen1,
    citizen2,
    citizen3,
    adminSigner,
    wrongSigner,
    chainId,
  };
}

async function deployActiveElectionFixture() {
  const [admin, stranger, citizen1, citizen2, citizen3] =
    await ethers.getSigners();

  const adminSigner = ethers.Wallet.createRandom();
  const wrongSigner = ethers.Wallet.createRandom();

  const election = await ethers.deployContract("Election", [], admin);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  await election.connect(admin).setAdminSigner(adminSigner.address);
  await election.connect(admin).addParty("Civic Alliance", "CA");
  await election.connect(admin).addParty("Progress Union", "PU");
  await election.connect(admin).addParty("Green Future", "GF");
  await election.connect(admin).startElection();

  return {
    election,
    admin,
    stranger,
    citizen1,
    citizen2,
    citizen3,
    adminSigner,
    wrongSigner,
    chainId,
  };
}

describe("Election", function () {
  describe("admin access control", function () {
    it("only admin can add parties", async function () {
      const { election, admin, stranger } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await election.connect(admin).addParty("Civic Alliance", "CA");

      await expect(election.connect(stranger).addParty("Rogue Party", "RP"))
        .to.be.revertedWithCustomError(election, "NotAdmin");
    });

    it("only admin can set adminSigner", async function () {
      const { election, admin, stranger, adminSigner } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await expect(
        election.connect(stranger).setAdminSigner(adminSigner.address),
      ).to.be.revertedWithCustomError(election, "NotAdmin");

      await election.connect(admin).setAdminSigner(adminSigner.address);
      expect(await election.adminSigner()).to.equal(adminSigner.address);
    });

    it("only admin can start the election", async function () {
      const { election, admin, stranger, adminSigner } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await election.connect(admin).setAdminSigner(adminSigner.address);
      await election.connect(admin).addParty("Civic Alliance", "CA");

      await expect(
        election.connect(stranger).startElection(),
      ).to.be.revertedWithCustomError(election, "NotAdmin");

      await election.connect(admin).startElection();
      expect(await election.state()).to.equal(2n); // Active
    });

    it("only admin can close the election", async function () {
      const { election, admin, stranger } = await networkHelpers.loadFixture(
        deployActiveElectionFixture,
      );

      await expect(
        election.connect(stranger).closeElection(),
      ).to.be.revertedWithCustomError(election, "NotAdmin");

      await election.connect(admin).closeElection();
      expect(await election.state()).to.equal(3n); // Closed
    });
  });

  describe("party registration", function () {
    it("adding parties fails after the election is Active", async function () {
      const { election, admin } = await networkHelpers.loadFixture(
        deployActiveElectionFixture,
      );

      await expect(election.connect(admin).addParty("Late Party", "LP"))
        .to.be.revertedWithCustomError(election, "InvalidState");
    });

    it("rejects empty party name or shortCode", async function () {
      const { election, admin } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await expect(election.connect(admin).addParty("", "CA"))
        .to.be.revertedWithCustomError(election, "EmptyPartyField");

      await expect(election.connect(admin).addParty("Civic Alliance", ""))
        .to.be.revertedWithCustomError(election, "EmptyPartyField");
    });

    it("auto-opens Registration on the first party", async function () {
      const { election, admin } =
        await networkHelpers.loadFixture(deployElectionFixture);

      expect(await election.state()).to.equal(0n); // NotStarted
      await election.connect(admin).addParty("Civic Alliance", "CA");
      expect(await election.state()).to.equal(1n); // Registration
      expect(await election.partyCount()).to.equal(1n);
    });
  });

  describe("startElection guards", function () {
    it("reverts without adminSigner", async function () {
      const { election, admin } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await election.connect(admin).addParty("Civic Alliance", "CA");

      await expect(election.connect(admin).startElection())
        .to.be.revertedWithCustomError(election, "SignerNotSet");
    });

    it("reverts without parties", async function () {
      const { election, admin, adminSigner } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await election.connect(admin).setAdminSigner(adminSigner.address);

      await expect(election.connect(admin).startElection())
        .to.be.revertedWithCustomError(election, "NoParties");
    });
  });

  describe("castVote", function () {
    it("allows a citizen with a valid eligibility ticket to vote exactly once", async function () {
      const { election, citizen1, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      const sig = await signEligibilityTicket(
        adminSigner,
        citizen1.address,
        await election.getAddress(),
        chainId,
      );

      await election.connect(citizen1).castVote(0n, sig);

      expect(await election.hasVoted(citizen1.address)).to.equal(true);
      expect(await election.voteCount(0n)).to.equal(1n);
    });

    it("reverts when eligibilitySignature is signed by a different key", async function () {
      const { election, citizen1, wrongSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      const sig = await signEligibilityTicket(
        wrongSigner,
        citizen1.address,
        await election.getAddress(),
        chainId,
      );

      await expect(election.connect(citizen1).castVote(0n, sig))
        .to.be.revertedWithCustomError(election, "InvalidEligibilityTicket");
    });

    it("reverts when eligibilitySignature was issued for a different votingContract", async function () {
      const { election, admin, citizen1, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      // Separate deployment simulates another election / chain deployment.
      const otherElection = await ethers.deployContract("Election", [], admin);
      const otherAddress = await otherElection.getAddress();

      const sigForOther = await signEligibilityTicket(
        adminSigner,
        citizen1.address,
        otherAddress,
        chainId,
      );

      await expect(election.connect(citizen1).castVote(0n, sigForOther))
        .to.be.revertedWithCustomError(election, "InvalidEligibilityTicket");
    });

    it("reverts when the same address votes twice (AlreadyVoted)", async function () {
      const { election, citizen1, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      const electionAddress = await election.getAddress();
      const sig = await signEligibilityTicket(
        adminSigner,
        citizen1.address,
        electionAddress,
        chainId,
      );

      await election.connect(citizen1).castVote(0n, sig);

      await expect(election.connect(citizen1).castVote(1n, sig))
        .to.be.revertedWithCustomError(election, "AlreadyVoted");
    });

    it("fails if the election is not Active", async function () {
      const { election, admin, citizen1, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployElectionFixture);

      await election.connect(admin).setAdminSigner(adminSigner.address);
      await election.connect(admin).addParty("Civic Alliance", "CA");

      const electionAddress = await election.getAddress();
      const sig = await signEligibilityTicket(
        adminSigner,
        citizen1.address,
        electionAddress,
        chainId,
      );

      // NotStarted
      await expect(election.connect(citizen1).castVote(0n, sig))
        .to.be.revertedWithCustomError(election, "InvalidState");

      await election.connect(admin).startElection();
      await election.connect(admin).closeElection();

      // Closed
      await expect(election.connect(citizen1).castVote(0n, sig))
        .to.be.revertedWithCustomError(election, "InvalidState");
    });

    it("tallies votes correctly across citizens and parties via getResults()", async function () {
      const { election, citizen1, citizen2, citizen3, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      const electionAddress = await election.getAddress();

      const ballots = [
        { citizen: citizen1, partyId: 0n },
        { citizen: citizen2, partyId: 1n },
        { citizen: citizen3, partyId: 1n },
      ];

      for (const { citizen, partyId } of ballots) {
        const sig = await signEligibilityTicket(
          adminSigner,
          citizen.address,
          electionAddress,
          chainId,
        );
        await election.connect(citizen).castVote(partyId, sig);
      }

      expect(await election.voteCount(0n)).to.equal(1n);
      expect(await election.voteCount(1n)).to.equal(2n);
      expect(await election.voteCount(2n)).to.equal(0n);

      const [partyList, counts] = await election.getResults();

      expect(partyList).to.have.length(3);
      expect(counts).to.deep.equal([1n, 2n, 0n]);

      expect(partyList[0].name).to.equal("Civic Alliance");
      expect(partyList[0].shortCode).to.equal("CA");
      expect(partyList[1].name).to.equal("Progress Union");
      expect(partyList[1].shortCode).to.equal("PU");
      expect(partyList[2].name).to.equal("Green Future");
      expect(partyList[2].shortCode).to.equal("GF");
    });

    it("emits VoteCast with the correct args", async function () {
      const { election, citizen1, adminSigner, chainId } =
        await networkHelpers.loadFixture(deployActiveElectionFixture);

      const sig = await signEligibilityTicket(
        adminSigner,
        citizen1.address,
        await election.getAddress(),
        chainId,
      );

      const nextTimestamp = (await networkHelpers.time.latest()) + 1;
      await networkHelpers.time.setNextBlockTimestamp(nextTimestamp);

      await expect(election.connect(citizen1).castVote(2n, sig))
        .to.emit(election, "VoteCast")
        .withArgs(citizen1.address, 2n, BigInt(nextTimestamp));
    });
  });
});

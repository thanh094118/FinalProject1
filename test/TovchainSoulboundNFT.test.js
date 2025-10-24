const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TovchainSoulboundNFT", function () {
  let TovchainSoulboundNFT, nft, owner, student, other;

  beforeEach(async function () {
    [owner, student, other] = await ethers.getSigners();
    TovchainSoulboundNFT = await ethers.getContractFactory("TovchainSoulboundNFT");
    nft = await TovchainSoulboundNFT.deploy("Tovchain Program", "Tovchain Academy");
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set correct program and organization name", async function () {
      expect(await nft.programName()).to.equal("Tovchain Program");
      expect(await nft.organizationName()).to.equal("Tovchain Academy");
    });
  });

  describe("Issuing certificate", function () {
    it("should issue a certificate successfully", async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );

      const cert = await nft.getCertificate(0);
      expect(cert.studentName).to.equal("Alice");
      expect(await nft.totalSupply()).to.equal(1);
      expect(await nft.hasReceivedCertificate(student.address)).to.be.true;
    });

    it("should revert if student already has a certificate", async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );

      await expect(
        nft.issueCertificate(
          student.address,
          "Alice",
          "Blockchain 102",
          "2025-11-01",
          "A+",
          "Dr. John"
        )
      ).to.be.revertedWith("Address has already received a certificate");
    });

    it("should revert when called by non-owner", async function () {
      await expect(
        nft.connect(student).issueCertificate(
          student.address,
          "Alice",
          "Blockchain 101",
          "2025-10-01",
          "A",
          "Dr. Smith"
        )
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Updating certificate", function () {
    beforeEach(async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );
    });

    it("should allow owner to update certificate", async function () {
      await nft.updateCertificate(0, "Alice B", "Blockchain Advanced", "2025-11-01", "A+", "Dr. John");
      const cert = await nft.getCertificate(0);
      expect(cert.courseName).to.equal("Blockchain Advanced");
    });

    it("should revert if token does not exist", async function () {
      await expect(
        nft.updateCertificate(1, "Bob", "Course", "2025-10-02", "B", "Mr. T")
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Program info", function () {
    it("should allow owner to update program info", async function () {
      await nft.updateProgramInfo("New Program", "New Org");
      expect(await nft.programName()).to.equal("New Program");
    });

    it("should revert when non-owner tries to update program info", async function () {
      await expect(
        nft.connect(student).updateProgramInfo("Hack", "FakeOrg")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Soulbound restrictions", function () {
    beforeEach(async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );
    });

    it("should revert on approve()", async function () {
      await expect(nft.connect(student).approve(other.address, 0)).to.be.revertedWith(
        "Soulbound: Token cannot be approved"
      );
    });

    it("should revert on setApprovalForAll()", async function () {
      await expect(nft.connect(student).setApprovalForAll(other.address, true)).to.be.revertedWith(
        "Soulbound: Token cannot be approved"
      );
    });

    it("should always return address(0) for getApproved()", async function () {
      expect(await nft.getApproved(0)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Revoking certificate", function () {
    beforeEach(async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );
    });

    it("should allow owner to revoke certificate", async function () {
      await nft.revokeCertificate(0);
      expect(await nft.totalSupply()).to.equal(1); // tokenId counter not reset
      expect(await nft.hasReceivedCertificate(student.address)).to.be.false;
      await expect(nft.getCertificate(0)).to.be.revertedWith("Token does not exist");
    });

    it("should revert when non-owner tries to revoke", async function () {
      await expect(nft.connect(student).revokeCertificate(0)).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Metadata", function () {
    it("should return valid tokenURI with base64 prefix", async function () {
      await nft.issueCertificate(
        student.address,
        "Alice",
        "Blockchain 101",
        "2025-10-01",
        "A",
        "Dr. Smith"
      );
      const uri = await nft.tokenURI(0);
      expect(uri).to.match(/^data:application\/json;base64,/);
    });
  });
});

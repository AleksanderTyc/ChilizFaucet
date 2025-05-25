// FaucetFrontEnd/test/Faucet.js

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");

const FaucetWithTokensModule = require("../ignition/modules/FaucetWithTokens");

describe("= = = = = Chiliz Hacking Poland - Faucet = = = = =", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployBaseFixture() {
    const { FTokenA, FTokenB, faucet } = await ignition.deploy(FaucetWithTokensModule);
    return { FTokenA, FTokenB, faucet };
  }

  describe("1. Deployment", function () {
    it("1.1. Should provide funding", async function () {
      const [owner, othAlice, othBob] = await ethers.getSigners();
      const { FTokenA, FTokenB, faucet } = await loadFixture(deployBaseFixture);

      expect(await ethers.provider.getBalance(faucet.target)).to.equal(ethers.parseEther("1"));
    });

    it("1.2. Should set limits - Amount", async function () {
      const [owner, othAlice, othBob] = await ethers.getSigners();
      const { FTokenA, FTokenB, faucet } = await loadFixture(deployBaseFixture);

      expect(await faucet.limitAmount()).to.equal(ethers.parseEther("0.01"));
    });

  });

  describe("2. Standard withdrawals - limits", function () {
    let tx = null;
    let miningResult = null;
    
    it("2.1. Attempt to draw within standard limit should not revert", async function () {
      const [owner, othAlice, othBob] = await ethers.getSigners();
      const { FTokenA, FTokenB, faucet } = await loadFixture(deployBaseFixture);
      await expect(faucet.drawWithLimits("0x6c1f1C87B525467adE579A1EDb9989CC0b13951b", ethers.parseEther("0.01"), false, false)).to.not.be.reverted;
    });

    it("2.2. Attempt to draw above standard limit should revert with 'Withdrawal request exceeds amount limit' message", async function () {
      const [owner, othAlice, othBob] = await ethers.getSigners();
      const { FTokenA, FTokenB, faucet } = await loadFixture(deployBaseFixture);
      await expect(faucet.drawWithLimits("0x6c1f1C87B525467adE579A1EDb9989CC0b13951b", ethers.parseEther("0.011"), false, false)).to.be.revertedWith(
        "Withdrawal request exceeds amount limit"
      );
    });

    it("2.3. Attempt to draw to a _rich_ wallet should revert with 'Withdrawal request exceeds wallet limit' message", async function () {
      const [owner, othAlice, othBob] = await ethers.getSigners();
      const { FTokenA, FTokenB, faucet } = await loadFixture(deployBaseFixture);
      await expect(faucet.drawWithLimits(othAlice, ethers.parseEther("0.01"), false, false)).to.be.revertedWith(
        "Withdrawal request exceeds wallet limit"
      );
    });


  });

});
/*
            // initiate the transaction - deploy salted wallet contract
            tx = await wywolawca.callExecutorFlat({value: 20});
            // wait until mined
            miningResult = await tx.wait();
            
    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
*/

/*
  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
*/

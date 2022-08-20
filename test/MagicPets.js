const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("MagicPets", function () {
  const newURI =
    "https://gateway.pinata.cloud/ipfs/QmY5HLA9DCrmTSoWY2uUL45sYvXbWku4u7rgEM3TrUAvc1";
  async function deployMagicPets() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MagicPet = await ethers.getContractFactory("MagicPets");
    const magicPetsContract = await MagicPet.deploy();

    return { owner, addr1, addr2, magicPetsContract };
  }

  describe("Deployment", function () {
    it("Should set the Admin role", async function () {
      const { magicPetsContract, owner } = await loadFixture(deployMagicPets);
      const isAdmin = await magicPetsContract.hasRole(
        magicPetsContract.DEFAULT_ADMIN_ROLE(),
        owner.address
      );
      expect(isAdmin).to.equal(true);
    });

    it("Should set the Minter role", async function () {
      const { magicPetsContract, owner } = await loadFixture(deployMagicPets);
      const isMinter = await magicPetsContract.hasRole(
        magicPetsContract.MINTER_ROLE(),
        owner.address
      );
      expect(isMinter).to.equal(true);
    });
  });

  describe("Roles", function () {
    it("Should fail add a role", async function () {
      const { magicPetsContract, addr1, addr2 } = await loadFixture(
        deployMagicPets
      );
      await expect(
        magicPetsContract.connect(addr1).addRole("MINTER_ROLE", addr2.address)
      ).to.be.revertedWith("Add Role: only Admin can add roles");
    });

    it("Should fail delete a role", async function () {
      const { magicPetsContract, addr1, addr2 } = await loadFixture(
        deployMagicPets
      );
      await expect(
        magicPetsContract
          .connect(addr1)
          .deleteRole("MINTER_ROLE", addr2.address)
      ).to.be.revertedWith("Delete Role: only Admin can delete roles");
    });

    it("Should fail add a role that doesn't exist", async function () {
      const { magicPetsContract, addr1, addr2 } = await loadFixture(
        deployMagicPets
      );
      await expect(
        magicPetsContract
          .connect(addr1)
          .addRole("SUPER_USER", addr2.address)
      ).to.be.reverted;
    });

    it("Should add a role", async function () {
      const { magicPetsContract, addr2 } = await loadFixture(deployMagicPets);
      await expect(magicPetsContract.addRole("MINTER_ROLE", addr2.address));
      const isMinter = await magicPetsContract.hasRole(
        magicPetsContract.MINTER_ROLE(),
        addr2.address
      );
      expect(isMinter).to.equal(true);
    });

    it("Should delete a role", async function () {
      const { magicPetsContract, addr2 } = await loadFixture(deployMagicPets);
      await expect(magicPetsContract.addRole("MINTER_ROLE", addr2.address));
      await expect(magicPetsContract.deleteRole("MINTER_ROLE", addr2.address));
      const isMinter = await magicPetsContract.hasRole(
        magicPetsContract.MINTER_ROLE(),
        addr2.address
      );
      expect(isMinter).to.equal(false);
    });
  });

  describe("Mint", function () {
    it("Should mint with MINTER role", async function () {
      const { magicPetsContract, addr2 } = await loadFixture(deployMagicPets);

      await magicPetsContract.safeMint(newURI);
      expect(await magicPetsContract.ownerOf(0)).to.be.equal(
        magicPetsContract.address
      );

      await expect(magicPetsContract.addRole("MINTER_ROLE", addr2.address));
      await magicPetsContract.connect(addr2).safeMint(newURI);
      expect(await magicPetsContract.ownerOf(1)).to.be.equal(
        magicPetsContract.address
      );
    });

    it("Should fail mint address that doesn't has MINTER role", async function () {
      const { magicPetsContract, addr1 } = await loadFixture(deployMagicPets);
      await expect(magicPetsContract.connect(addr1).safeMint(newURI)).to.be
        .reverted;
    });

    it("Token Should has an URI", async function () {
      const { magicPetsContract } = await loadFixture(deployMagicPets);

      await magicPetsContract.safeMint(newURI);
      const [URI] = await magicPetsContract.Pets(0);
      expect(URI).to.be.equal(URI);
    });

    it("Token Should be onSale true", async function () {
      const { magicPetsContract } = await loadFixture(deployMagicPets);

      await magicPetsContract.safeMint(newURI);
      const [, onSale] = await magicPetsContract.Pets(0);
      expect(onSale).to.be.equal(true);
    });
  });

  describe("Buy", function () {
    it("Should fail when contract is paused", async function () {
      const { magicPetsContract, addr1 } = await loadFixture(deployMagicPets);
      await magicPetsContract.safeMint(newURI);
      await magicPetsContract.setPaused(true);
      await expect(
        magicPetsContract
          .connect(addr1)
          .buy(0, { value: hre.ethers.utils.parseEther("0.002") })
      ).to.be.reverted;
    });

    it("Should fail incorrect ether amount", async function () {
      const { magicPetsContract, addr1 } = await loadFixture(deployMagicPets);
      await magicPetsContract.safeMint(newURI);
      await expect(
        magicPetsContract
          .connect(addr1)
          .buy(0, { value: hre.ethers.utils.parseEther("0.004") })
      ).to.be.reverted;
    });

    it("Should send nft to the buyer", async function () {
      const { magicPetsContract, addr1 } = await loadFixture(deployMagicPets);
      await magicPetsContract.safeMint(newURI);
      await magicPetsContract
        .connect(addr1)
        .buy(0, { value: hre.ethers.utils.parseEther("0.002") });
      expect(await magicPetsContract.ownerOf(0)).to.be.equal(addr1.address);
    });

    it("Contract balance must be greater than 0", async function () {
      const { magicPetsContract, addr1, owner } = await loadFixture(
        deployMagicPets
      );
      await magicPetsContract.safeMint(newURI);
      await magicPetsContract
        .connect(addr1)
        .buy(0, { value: hre.ethers.utils.parseEther("0.002") });
      expect(
        await ethers.provider.getBalance(magicPetsContract.address)
      ).to.be.greaterThan(ethers.BigNumber.from(0));
    });

    it("Should not buy nft that has been bought", async function () {
      const { magicPetsContract, addr1, addr2 } = await loadFixture(
        deployMagicPets
      );
      await magicPetsContract.safeMint(newURI);
      await magicPetsContract
        .connect(addr1)
        .buy(0, { value: hre.ethers.utils.parseEther("0.002") });
      await expect(
        magicPetsContract
          .connect(addr2)
          .buy(0, { value: hre.ethers.utils.parseEther("0.002") })
      ).to.be.reverted;
    });
  });

  describe("Withdraw", function () {
    it("Should transfer the funds to the foundation address", async function () {
      const { magicPetsContract, addr1 } = await loadFixture(deployMagicPets);
      await magicPetsContract.safeMint(newURI);
      await magicPetsContract
      .connect(addr1)
      .buy(0, { value: hre.ethers.utils.parseEther("0.002") });
      await magicPetsContract.withdraw();
      expect(
        await ethers.provider.getBalance(magicPetsContract.address)
      ).to.be.equal(ethers.BigNumber.from(0));
    });
    it("Should fail with ether 0", async function () {
      const { magicPetsContract } = await loadFixture(deployMagicPets);
      await expect(
        magicPetsContract
          .withdraw()).to.be.reverted;
    });
  });
});

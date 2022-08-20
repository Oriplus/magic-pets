const hre = require("hardhat");

async function main() {
  const MagicPets = await hre.ethers.getContractFactory("MagicPets");
  const magicPets = await MagicPets.deploy();

  await magicPets.deployed();

  console.log("Magic Pets deployed to:", magicPets.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

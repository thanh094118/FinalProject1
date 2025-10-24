const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Lấy thông tin deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Thông tin chương trình đào tạo
  const programName = "Tovchain Blockchain Development";
  const organizationName = "Tovchain Academy";

  console.log("📋 Deployment Configuration:");
  console.log("   Program Name:", programName);
  console.log("   Organization:", organizationName);
  console.log("");

  // Lấy contract factory
  const TovchainNFT = await hre.ethers.getContractFactory("TovchainSoulboundNFT");

  // Deploy contract với constructor parameters (không truyền Image)
  console.log("⏳ Deploying TovchainSoulboundNFT...");
  const tovchainNFT = await TovchainNFT.deploy(programName, organizationName);

  // Chờ deployment hoàn tất
  await tovchainNFT.waitForDeployment();

  console.log("✅ TovchainSoulboundNFT deployed to:", tovchainNFT.target);
  console.log("");

  // Verify contract info
  console.log("🔍 Verifying deployment...");
  const name = await tovchainNFT.name();
  const symbol = await tovchainNFT.symbol();
  const owner = await tovchainNFT.owner();
  const totalSupply = await tovchainNFT.totalSupply();

  console.log("   Contract Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Owner:", owner);
  console.log("   Total Supply:", totalSupply.toString());
  console.log("");

  // Tạo deployment info object
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: tovchainNFT.target,
    contractName: "TovchainSoulboundNFT",
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    programName: programName,
    organizationName: organizationName,
    transactionHash: tovchainNFT.deploymentTransaction().hash
  };

  // Ghi địa chỉ vào contract-address.json
  fs.writeFileSync("contract-address.json", JSON.stringify(deploymentInfo, null, 2));

  console.log("📄 Deployment info saved to contract-address.json\n");

  // Hiển thị link explorer cho Sepolia
  if (hre.network.name === "sepolia") {
    const explorerUrl = "https://sepolia.etherscan.io";
    console.log("🔗 Explorer Links:");
    console.log(`   Contract: ${explorerUrl}/address/${tovchainNFT.target}`);
    console.log(`   Transaction: ${explorerUrl}/tx/${tovchainNFT.deploymentTransaction().hash}`);
    console.log("");

    // Auto verify nếu có API key
    try {
      console.log("🔍 Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: tovchainNFT.target,
        constructorArguments: [programName, organizationName],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later with:");
      console.log(`   npx hardhat verify --network sepolia ${tovchainNFT.target} "${programName}" "${organizationName}"`);
    }
  }

  console.log("\n✨ Deployment completed successfully!\n");
  console.log("📝 Next steps:");
  console.log(" Issue certificates: await contract.issueCertificate(...)");
}

main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});

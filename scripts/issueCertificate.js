const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Đọc địa chỉ contract từ file
  const contractInfo = JSON.parse(fs.readFileSync("contract-address.json"));
  const contractAddress = contractInfo.contractAddress;

  if (!contractAddress) {
    throw new Error("❌ Không tìm thấy địa chỉ contract trong contract-address.json");
  }

  console.log("📜 Kết nối với contract tại:", contractAddress);

  // Lấy contract instance
  const TovchainSoulboundNFT = await hre.ethers.getContractFactory("TovchainSoulboundNFT");
  const nft = TovchainSoulboundNFT.attach(contractAddress);

  // Thông tin certificate
  const recipientAddress = "0xf5b678E0665a55B69E73255253951bB7B3896A9C"; // ví người nhận
  const studentName = "Nguyen Van A";
  const courseName = "Tovchain Blockchain Development";
  const completionDate = "2025-10-24";
  const grade = "A+";
  const instructorName = "Tovchain Academy";

  console.log("👤 Người nhận:", recipientAddress);
  console.log("🎓 Student Name:", studentName);
  console.log("📚 Course:", courseName);
  console.log("🗓 Completion Date:", completionDate);
  console.log("🏆 Grade:", grade);
  console.log("👨‍🏫 Instructor:", instructorName);

  // Kiểm tra người nhận đã có certificate chưa
  const hasReceived = await nft.hasReceivedCertificate(recipientAddress);
  if (hasReceived) {
    console.log("⚠️ Địa chỉ này đã nhận certificate rồi!");
    const tokenId = await nft.getTokenIdByAddress(recipientAddress);
    console.log("Token ID:", tokenId.toString());
    return;
  }

  // Issue certificate
  console.log("\n🎓 Đang phát hành certificate...");
  const tx = await nft.issueCertificate(
    recipientAddress,
    studentName,
    courseName,
    completionDate,
    grade,
    instructorName
  );

  console.log("📤 Transaction hash:", tx.hash);

  console.log("⏳ Đợi confirmation...");
  const receipt = await tx.wait();

  console.log("✅ Certificate đã được phát hành!");
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Lấy thông tin token
  const tokenId = await nft.getTokenIdByAddress(recipientAddress);
  console.log("\n📋 Thông tin Certificate:");
  console.log("=".repeat(50));
  console.log("Token ID:", tokenId.toString());
  console.log("Owner:", recipientAddress);
  console.log("Student Name:", studentName);
  console.log("Course:", courseName);
  console.log("Completion Date:", completionDate);
  console.log("Grade:", grade);
  console.log("Instructor:", instructorName);
  console.log("Total Supply:", (await nft.totalSupply()).toString());
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

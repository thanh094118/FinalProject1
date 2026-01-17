# Non-Exchangeable NFT (ERC721) cho chương trình đào tạo **Tovchain**

## 1. Mô tả

### 🧱 Blockchain
Blockchain là một hệ thống cơ sở dữ liệu phi tập trung, cho phép lưu trữ và xác minh thông tin một cách minh bạch, không thể thay đổi. Mỗi khối (block) chứa dữ liệu được liên kết với khối trước đó tạo thành chuỗi (chain), đảm bảo tính bảo mật và toàn vẹn của thông ti

### 🤖 Smart Contract
Smart Contract (hợp đồng thông minh) là đoạn mã được triển khai trên blockchain, cho phép thực thi tự động các điều khoản khi điều kiện được thỏa mãn. Trong dự án này, smart contract chịu trách nhiệm quản lý việc cấp phát NFT cho người dùng sau khi hoàn thành khóa đào t
### 🧬 Chuẩn ERC721
ERC721 là tiêu chuẩn cho **Non-Fungible Token (NFT)** trên Ethereum, đại diện cho các tài sản kỹ thuật số duy nhất và không thể hoán đổi lẫn nhau. Mỗi token có **ID riêng biệt** và thuộc quyền sở hữu của một địa chỉ duy nhất.

### 🎓 Ứng dụng trong dự án
Trong chương trình đào tạo **Tovchain**, mỗi học viên hoàn thành khóa học sẽ được thưởng **1 NFT không thể chuyển nhượng (non-exchangeable)**.  
Điều này được đảm bảo thông qua smart contract ERC721 được tùy chỉnh để **vô hiệu hóa các hàm chuyển token (transfer)**, chỉ cho phép **mint** bởi quản trị viên chương trình.

---

## 2. version

| Hardhat     | 2.26.3    |
| Node.js     | 20.19.5   |
| Ethers.js   | 6.15.0    |
| Solidity    | ^0.8.0    |  
npm init -y  
npm install --save-dev hardhat@2.26.3  
npx hardhat  

---

## 3. Deployment

npx hardhat compile  
npx hardhat test  

npx hardhat node  
npx hardhat run scripts/deploy.js --network localhost  

npx hardhat run scripts/deploy.js --network sepolia  
#PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"  
#SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"  

npm install -g live-server  
live-server





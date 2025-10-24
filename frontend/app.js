// app.js - Fixed for 6-param issueCertificate, removed Batch Issue, show instructorName

// Contract ABI - Updated for Full On-Chain SBT (issueCertificate has 6 params)
const CONTRACT_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function owner() view returns (address)",
    "function totalSupply() view returns (uint256)",
    // issueCertificate with 6 params
    "function issueCertificate(address to, string studentName, string courseName, string completionDate, string grade, string instructorName)",
    "function hasReceivedCertificate(address account) view returns (bool)",
    "function getTokenIdByAddress(address account) view returns (uint256)",
    // getCertificate returns five strings: studentName, courseName, completionDate, grade, instructorName
    "function getCertificate(uint256 tokenId) view returns (string, string, string, string, string)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function updateColors(string _primary, string _secondary, string _background)",
    "function revokeCertificate(uint256 tokenId)",
    "event CertificateIssued(address indexed recipient, uint256 indexed tokenId, string studentName, string courseName)",
    "event CertificateRevoked(address indexed owner, uint256 indexed tokenId)"
];

// Global variables
let provider;
let signer;
let contract;
let userAddress;

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const loadContractBtn = document.getElementById('loadContractBtn');
const issueCertificateBtn = document.getElementById('issueCertificateBtn');
const checkCertificateBtn = document.getElementById('checkCertificateBtn');
const updateColorsBtn = document.getElementById('updateColorsBtn');
const revokeCertificateBtn = document.getElementById('revokeCertificateBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkContractAddress();
});

// Setup Event Listeners
function setupEventListeners() {
    connectBtn.addEventListener('click', connectWallet);
    loadContractBtn.addEventListener('click', loadContract);
    issueCertificateBtn.addEventListener('click', issueCertificate);
    checkCertificateBtn.addEventListener('click', checkCertificate);
    revokeCertificateBtn.addEventListener('click', revokeCertificate);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Check if contract address exists in localStorage
function checkContractAddress() {
    const savedAddress = localStorage.getItem('contractAddress');
    if (savedAddress) {
        const el = document.getElementById('contractAddress');
        if (el) el.value = savedAddress;
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Vui lòng cài đặt MetaMask!');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        const network = await provider.getNetwork();
        
        document.getElementById('connectionStatus').innerHTML = '<p class="success">✅ Đã kết nối thành công!</p>';
        document.getElementById('accountInfo').style.display = 'block';
        document.getElementById('accountAddress').textContent = userAddress;
        document.getElementById('networkName').textContent = network.name + ' (Chain ID: ' + network.chainId + ')';
        
        connectBtn.textContent = 'Đã kết nối';
        connectBtn.disabled = true;

        addLog('✅ Kết nối ví thành công: ' + userAddress.substring(0, 10) + '...', 'success');

        const contractAddress = document.getElementById('contractAddress').value;
        if (contractAddress) {
            loadContract();
        }

    } catch (error) {
        console.error(error);
        addLog('❌ Lỗi khi kết nối ví: ' + (error.message || error), 'error');
    }
}

// Load Contract
async function loadContract() {
    try {
        const contractAddress = document.getElementById('contractAddress').value.trim();
        
        if (!contractAddress) {
            alert('Vui lòng nhập địa chỉ contract!');
            return;
        }

        if (!provider) {
            alert('Vui lòng kết nối ví trước!');
            return;
        }

        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

        const name = await contract.name();
        const symbol = await contract.symbol();
        const owner = await contract.owner();
        const totalSupply = await contract.totalSupply();

        document.getElementById('contractName').textContent = name;
        document.getElementById('contractSymbol').textContent = symbol;
        document.getElementById('contractOwner').textContent = owner;
        document.getElementById('totalSupply').textContent = totalSupply.toString();
        document.getElementById('contractInfo').style.display = 'block';

        localStorage.setItem('contractAddress', contractAddress);

        if (owner.toLowerCase() === userAddress.toLowerCase()) {
            document.getElementById('ownerSection').style.display = 'block';
            document.getElementById('revokeSection').style.display = 'block';
            addLog('✅ Bạn là Owner của contract', 'success');
        }

        await checkMyCertificate();

        addLog('✅ Load contract thành công', 'success');

    } catch (error) {
        console.error(error);
        addLog('❌ Lỗi khi load contract: ' + (error.message || error), 'error');
    }
}

// Issue Certificate (now passes 6 params)
async function issueCertificate() {
    try {
        const recipientAddress = document.getElementById('recipientAddress').value.trim();
        const studentName = document.getElementById('studentName').value.trim();
        const courseName = document.getElementById('courseName').value.trim();
        const grade = document.getElementById('grade').value;

        if (!recipientAddress || !studentName || !courseName) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        if (!contract) {
            alert('Vui lòng load contract trước!');
            return;
        }

        issueCertificateBtn.disabled = true;
        issueCertificateBtn.textContent = 'Đang xử lý...';

        addLog('📤 Đang phát hành certificate...', 'info');

        // Use current date (ISO yyyy-mm-dd) and default instructor name
        const completionDate = new Date().toISOString().split('T')[0]; // e.g. "2025-10-24"
        const instructorName = "Tovchain Academy";

        const tx = await contract.issueCertificate(recipientAddress, studentName, courseName, completionDate, grade, instructorName);
        addLog('⏳ Đợi confirmation... TX: ' + tx.hash, 'info');

        const receipt = await tx.wait();
        
        addLog('✅ Certificate đã được phát hành thành công!', 'success');
        addLog('🔗 Transaction: <a href="https://sepolia.etherscan.io/tx/' + tx.hash + '" target="_blank">Xem trên Etherscan</a>', 'success');

        const totalSupply = await contract.totalSupply();
        document.getElementById('totalSupply').textContent = totalSupply.toString();

        // Clear form
        document.getElementById('recipientAddress').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('courseName').value = '';

        alert('✅ Phát hành certificate thành công!');

    } catch (error) {
        console.error(error);
        addLog('❌ Lỗi: ' + (error.message || error), 'error');
        alert('Lỗi: ' + (error.message || error));
    } finally {
        issueCertificateBtn.disabled = false;
        issueCertificateBtn.textContent = 'Phát hành Certificate';
    }
}

// Check Certificate by address (single)
async function checkCertificate() {
    try {
        const checkAddress = document.getElementById('checkAddress').value.trim();
        
        if (!checkAddress) {
            alert('Vui lòng nhập địa chỉ!');
            return;
        }

        if (!contract) {
            alert('Vui lòng load contract trước!');
            return;
        }

        checkCertificateBtn.disabled = true;
        checkCertificateBtn.textContent = 'Đang tra cứu...';

        const hasReceived = await contract.hasReceivedCertificate(checkAddress);
        
        document.getElementById('certificateResult').style.display = 'block';
        document.getElementById('hasReceived').textContent = hasReceived ? '✅ Đã nhận certificate' : '❌ Chưa nhận certificate';

        if (hasReceived) {
            const tokenId = await contract.getTokenIdByAddress(checkAddress);
            // getCertificate returns tuple of 5 strings
            const certTuple = await contract.getCertificate(tokenId);
            // Normalize into object for readability
            const certInfo = {
                studentName: certTuple[0],
                courseName: certTuple[1],
                completionDate: certTuple[2],
                grade: certTuple[3],
                instructorName: certTuple[4]
            };
            const tokenURI = await contract.tokenURI(tokenId);

            document.getElementById('certificateDetails').style.display = 'block';
            document.getElementById('tokenId').textContent = tokenId.toString();

            // Display certificate info with safe date handling
            let completionDateDisplay = formatCompletionDate(certInfo.completionDate);

            let html = '<div class="cert-info">';
            html += '<h4>📜 Thông tin Certificate:</h4>';
            html += '<p><strong>Tên học viên:</strong> ' + escapeHtml(certInfo.studentName) + '</p>';
            html += '<p><strong>Khóa học:</strong> ' + escapeHtml(certInfo.courseName) + '</p>';
            html += '<p><strong>Xếp loại:</strong> ' + escapeHtml(certInfo.grade) + '</p>';
            html += '<p><strong>Ngày hoàn thành:</strong> ' + escapeHtml(completionDateDisplay) + '</p>';
            html += '<p><strong>Instructor:</strong> ' + escapeHtml(certInfo.instructorName) + '</p>';
            html += '</div>';

            // Display SVG image from tokenURI
            await displayCertificateImage(tokenURI, 'certificatePreview', html);

            addLog('✅ Tra cứu thành công - Token ID: ' + tokenId.toString(), 'success');
        } else {
            document.getElementById('certificateDetails').style.display = 'none';
            addLog('ℹ️ Địa chỉ này chưa nhận certificate', 'info');
        }

    } catch (error) {
        console.error(error);
        addLog('❌ Lỗi: ' + (error.message || error), 'error');
        alert('Lỗi: ' + (error.message || error));
    } finally {
        checkCertificateBtn.disabled = false;
        checkCertificateBtn.textContent = 'Tra cứu';
    }
}

// Check My Certificate (single)
async function checkMyCertificate() {
    try {
        if (!contract || !userAddress) return;

        const hasReceived = await contract.hasReceivedCertificate(userAddress);
        
        if (hasReceived) {
            document.getElementById('mySection').style.display = 'block';
            
            const tokenId = await contract.getTokenIdByAddress(userAddress);
            const certTuple = await contract.getCertificate(tokenId);
            const certInfo = {
                studentName: certTuple[0],
                courseName: certTuple[1],
                completionDate: certTuple[2],
                grade: certTuple[3],
                instructorName: certTuple[4]
            };
            const tokenURI = await contract.tokenURI(tokenId);

            let completionDateDisplay = formatCompletionDate(certInfo.completionDate);

            let html = '<div class="cert-info">';
            html += '<h3>🎓 Certificate của bạn</h3>';
            html += '<p><strong>Token ID:</strong> ' + tokenId.toString() + '</p>';
            html += '<p><strong>Tên:</strong> ' + escapeHtml(certInfo.studentName) + '</p>';
            html += '<p><strong>Khóa học:</strong> ' + escapeHtml(certInfo.courseName) + '</p>';
            html += '<p><strong>Xếp loại:</strong> ' + escapeHtml(certInfo.grade) + '</p>';
            html += '<p><strong>Ngày hoàn thành:</strong> ' + escapeHtml(completionDateDisplay) + '</p>';
            html += '<p><strong>Instructor:</strong> ' + escapeHtml(certInfo.instructorName) + '</p>';
            html += '</div>';

            await displayCertificateImage(tokenURI, 'myCertificate', html);
        }
    } catch (error) {
        console.error('Error checking my certificate:', error);
    }
}

// Format completionDate robustly:
// - if it's a number in string form or number (assume unix seconds), convert to locale date
// - if it's ISO date string, format to locale
// - otherwise return original string
function formatCompletionDate(dateVal) {
    if (dateVal === null || dateVal === undefined) return '';
    // if it's a numeric string or number -> treat as unix seconds
    if (/^\d+$/.test(String(dateVal))) {
        try {
            const num = Number(dateVal);
            // if it looks like seconds (<= 1e12), convert; if milliseconds, convert accordingly
            const ms = num > 1e12 ? num : num * 1000;
            return new Date(ms).toLocaleDateString('vi-VN');
        } catch (e) {
            return String(dateVal);
        }
    }

    // if ISO-ish string
    const isoLike = /^\d{4}-\d{2}-\d{2}/.test(String(dateVal));
    if (isoLike) {
        try {
            return new Date(String(dateVal)).toLocaleDateString('vi-VN');
        } catch (e) {
            return String(dateVal);
        }
    }

    // fallback: return as-is
    return String(dateVal);
}

// Escape HTML to avoid injecting malicious content into the UI
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Display Certificate Image
async function displayCertificateImage(tokenURI, containerId, additionalHTML = '') {
    try {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Reset container
        container.innerHTML = additionalHTML;

        if (!tokenURI) {
            container.innerHTML += '<p>Không có tokenURI</p>';
            return;
        }

        // If tokenURI is JSON data URI base64
        if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64 = tokenURI.split(',')[1];
            const json = atob(base64);
            const metadata = JSON.parse(json);

            // Get image from metadata
            if (metadata.image) {
                const imageData = metadata.image;
                // if image is data:image/svg+xml;base64,
                if (imageData.startsWith('data:image/svg+xml;base64,')) {
                    const svgBase64 = imageData.split(',')[1];
                    const svgContent = atob(svgBase64);
                    container.innerHTML += '<div class="svg-container">' + svgContent + '</div>';
                    return;
                }
                // if image is data:image/svg+xml;utf8,<svg...>
                if (imageData.startsWith('data:image/svg+xml;utf8,')) {
                    const svgRaw = decodeURIComponent(imageData.split(',')[1]);
                    container.innerHTML += '<div class="svg-container">' + svgRaw + '</div>';
                    return;
                }
                // if image is plain data URI (png/jpeg), create img tag
                if (imageData.startsWith('data:image/')) {
                    const img = document.createElement('img');
                    img.src = imageData;
                    img.alt = 'Certificate image';
                    img.style.maxWidth = '100%';
                    container.appendChild(img);
                    return;
                }
                // otherwise if it's an http(s) url
                if (/^https?:\/\//.test(imageData)) {
                    const img = document.createElement('img');
                    img.src = imageData;
                    img.alt = 'Certificate image';
                    img.style.maxWidth = '100%';
                    container.appendChild(img);
                    return;
                }
            }

            container.innerHTML += '<p>Không tìm thấy ảnh trong metadata.</p>';
            return;
        }

        // If tokenURI itself is an image data URI (e.g., data:image/svg+xml;base64,...)
        if (tokenURI.startsWith('data:image/svg+xml;base64,')) {
            const svgBase64 = tokenURI.split(',')[1];
            const svgContent = atob(svgBase64);
            container.innerHTML += '<div class="svg-container">' + svgContent + '</div>';
            return;
        }

        // If tokenURI is data:application/json;utf8,{...}
        if (tokenURI.startsWith('data:application/json;utf8,')) {
            const json = tokenURI.split(',')[1];
            const metadata = JSON.parse(decodeURIComponent(json));
            if (metadata.image) {
                // reuse logic by recursively calling with metadata.image as if tokenURI
                await displayCertificateImage(metadata.image, containerId, additionalHTML);
                return;
            }
        }

        // Fallback: show a link to tokenURI
        container.innerHTML += '<p>Không thể hiển thị hình ảnh tự động. <a href="' + escapeHtml(tokenURI) + '" target="_blank">Mở tokenURI</a></p>';

    } catch (error) {
        console.error('Error displaying certificate image:', error);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML += '<p>Lỗi khi hiển thị ảnh.</p>';
    }
}

// Revoke Certificate
async function revokeCertificate() {
    try {
        const tokenId = document.getElementById('revokeTokenId').value.trim();

        if (!tokenId) {
            alert('Vui lòng nhập Token ID!');
            return;
        }

        if (!contract) {
            alert('Vui lòng load contract trước!');
            return;
        }

        if (!confirm('⚠️ Bạn có chắc chắn muốn thu hồi certificate này? Hành động này không thể hoàn tác!')) {
            return;
        }

        revokeCertificateBtn.disabled = true;
        revokeCertificateBtn.textContent = 'Đang xử lý...';

        addLog('🗑️ Đang thu hồi certificate...', 'info');

        const tx = await contract.revokeCertificate(tokenId);
        addLog('⏳ Đợi confirmation... TX: ' + tx.hash, 'info');

        await tx.wait();

        addLog('✅ Thu hồi certificate thành công!', 'success');

        const totalSupply = await contract.totalSupply();
        document.getElementById('totalSupply').textContent = totalSupply.toString();

        document.getElementById('revokeTokenId').value = '';

        alert('✅ Thu hồi certificate thành công!');

    } catch (error) {
        console.error(error);
        addLog('❌ Lỗi: ' + (error.message || error), 'error');
        alert('Lỗi: ' + (error.message || error));
    } finally {
        revokeCertificateBtn.disabled = false;
        revokeCertificateBtn.textContent = 'Thu hồi Certificate';
    }
}

// Switch Tab
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const el = document.getElementById(tabName + 'Tab');
    if (el) el.classList.add('active');
}

// Add Log
function addLog(message, type = 'info') {
    const txLog = document.getElementById('txLog');
    if (!txLog) return;

    const logItem = document.createElement('div');
    logItem.className = 'tx-item ' + type;
    
    const timestamp = new Date().toLocaleTimeString();
    logItem.innerHTML = `<p><strong>${timestamp}</strong> - ${message}</p>`;
    
    txLog.insertBefore(logItem, txLog.firstChild);

    while (txLog.children.length > 10) {
        txLog.removeChild(txLog.lastChild);
    }
}

// Listen to account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        // simple behavior: reload to reflect new account
        location.reload();
    });

    window.ethereum.on('chainChanged', () => {
        location.reload();
    });
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TovchainSoulboundNFT
 * @dev NFT không thể chuyển nhượng (Soulbound Token) với metadata 100% on-chain
 * Mỗi học viên hoàn thành khóa đào tạo sẽ nhận được 1 NFT duy nhất
 */
contract TovchainSoulboundNFT is ERC721, Ownable {
    using Strings for uint256;

    // Counter cho tokenId
    uint256 private _nextTokenId;

    // Struct lưu trữ thông tin chứng chỉ
    struct Certificate {
        string studentName;
        string courseName;
        string completionDate;
        string grade;
        string instructorName;
    }

    // Mapping từ tokenId đến thông tin chứng chỉ
    mapping(uint256 => Certificate) private _certificates;

    // Mapping để kiểm tra địa chỉ đã nhận NFT chưa
    mapping(address => bool) private _hasReceived;

    // Mapping từ địa chỉ đến tokenId của họ
    mapping(address => uint256) private _addressToTokenId;

    // Thông tin chung về chương trình
    string public programName;
    string public organizationName;

    // Events
    event CertificateIssued(
        address indexed recipient,
        uint256 indexed tokenId,
        string studentName,
        string courseName
    );
    event CertificateUpdated(uint256 indexed tokenId);

    constructor(
        string memory _programName,
        string memory _organizationName
    ) ERC721("Tovchain Training Certificate", "TOVNFT") Ownable() {
        programName = _programName;
        organizationName = _organizationName;
    }

    /**
     * @dev Phát hành NFT chứng chỉ cho học viên hoàn thành khóa học
     */
    function issueCertificate(
        address to,
        string memory studentName,
        string memory courseName,
        string memory completionDate,
        string memory grade,
        string memory instructorName
    ) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(
            !_hasReceived[to],
            "Address has already received a certificate"
        );
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(courseName).length > 0, "Course name cannot be empty");

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        _certificates[tokenId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            completionDate: completionDate,
            grade: grade,
            instructorName: instructorName
        });

        _hasReceived[to] = true;
        _addressToTokenId[to] = tokenId;

        emit CertificateIssued(to, tokenId, studentName, courseName);
    }
    /**
     * @dev Cập nhật thông tin chứng chỉ
     */
    function updateCertificate(
        uint256 tokenId,
        string memory studentName,
        string memory courseName,
        string memory completionDate,
        string memory grade,
        string memory instructorName
    ) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        _certificates[tokenId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            completionDate: completionDate,
            grade: grade,
            instructorName: instructorName
        });

        emit CertificateUpdated(tokenId);
    }

    /**
     * @dev Cập nhật thông tin chương trình
     */
    function updateProgramInfo(
        string memory _programName,
        string memory _organizationName
    ) public onlyOwner {
        programName = _programName;
        organizationName = _organizationName;
    }

    /**
     * @dev Lấy thông tin chứng chỉ
     */
    function getCertificate(
        uint256 tokenId
    ) public view returns (Certificate memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _certificates[tokenId];
    }

    /**
     * @dev Tạo JSON attributes - helper function để giảm stack depth
     */
    function _buildAttributes(
        Certificate memory cert,
        uint256 tokenId
    ) private view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '"attributes": [',
                    '{"trait_type": "Student Name", "value": "',
                    cert.studentName,
                    '"},',
                    '{"trait_type": "Course Name", "value": "',
                    cert.courseName,
                    '"},',
                    '{"trait_type": "Completion Date", "value": "',
                    cert.completionDate,
                    '"},',
                    '{"trait_type": "Grade", "value": "',
                    cert.grade,
                    '"},',
                    '{"trait_type": "Instructor", "value": "',
                    cert.instructorName,
                    '"},',
                    '{"trait_type": "Organization", "value": "',
                    organizationName,
                    '"},',
                    '{"trait_type": "Token ID", "value": "',
                    tokenId.toString(),
                    '"}',
                    "]"
                )
            );
    }

    /**
     * @dev Tạo metadata JSON on-chain
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        Certificate memory cert = _certificates[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name": "',
                programName,
                " - ",
                cert.studentName,
                '",',
                '"description": "Certificate of completion for ',
                cert.courseName,
                " issued by ",
                organizationName,
                '",',
                _buildAttributes(cert, tokenId),
                "}"
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    /**
     * @dev Kiểm tra địa chỉ đã nhận NFT chưa
     */
    function hasReceivedCertificate(
        address account
    ) public view returns (bool) {
        return _hasReceived[account];
    }

    /**
     * @dev Lấy tokenId của một địa chỉ
     */
    function getTokenIdByAddress(
        address account
    ) public view returns (uint256) {
        require(
            _hasReceived[account],
            "Address has not received a certificate"
        );
        return _addressToTokenId[account];
    }

    /**
     * @dev Lấy tổng số NFT đã phát hành
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Override approve để vô hiệu hóa
     */
    function approve(address, uint256) public virtual override {
        revert("Soulbound: Token cannot be approved");
    }

    /**
     * @dev Override setApprovalForAll để vô hiệu hóa
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert("Soulbound: Token cannot be approved");
    }

    /**
     * @dev Override getApproved - luôn trả về address(0)
     */
    function getApproved(
        uint256
    ) public view virtual override returns (address) {
        return address(0);
    }

    /**
     * @dev Cho phép owner thu hồi certificate
     */
    function revokeCertificate(uint256 tokenId) public onlyOwner {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");

        _hasReceived[owner] = false;
        delete _addressToTokenId[owner];
        delete _certificates[tokenId];

        _burn(tokenId);
    }
}

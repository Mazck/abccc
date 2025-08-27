// Initialize or update game data when it's loaded
function initializeGameDataFields() {
    // Ensure all required arrays exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    if (!gameData.projectDevelopments) {
        gameData.projectDevelopments = [];
    }

    if (!gameData.marketEvents) {
        gameData.marketEvents = [];
    }

    if (!gameData.bankProducts) {
        gameData.bankProducts = generateInitialBankProducts();
    }

    // Initialize accounts savings, insurance, and other new fields
    Object.keys(gameData.accounts).forEach(userId => {
        const account = gameData.accounts[userId];

        if (!account.savingsAccounts) {
            account.savingsAccounts = [];
        }

        if (!account.insurance) {
            account.insurance = [];
        }

        if (!account.rentedProperties) {
            account.rentedProperties = [];
        }

        if (!account.partnerships) {
            account.partnerships = [];
        }

        if (account.reputationScore === undefined) {
            account.reputationScore = 50;
        }

        if (account.taxPaid === undefined) {
            account.taxPaid = 0;
        }
    });

    // Initialize property new fields
    gameData.properties.forEach(property => {
        if (!property.tenants) {
            property.tenants = [];
        }

        if (property.rentalIncome === undefined) {
            property.rentalIncome = 0;
        }

        if (property.marketValue === undefined) {
            property.marketValue = property.currentPrice;
        }

        if (property.insuranceStatus === undefined) {
            property.insuranceStatus = InsuranceStatus.UNINSURED;
        }

        if (property.appreciationRate === undefined) {
            // Set default appreciation rate based on neighborhood
            property.appreciationRate = 0.05; // Default 5%
        }
    });
}

const fs = require('fs');
const path = require('path');

// Database path for game data
const DATA_DIR = path.join(__dirname, 'cache', 'data');
const GAME_DATA_FILE = path.join(DATA_DIR, 'realestate_game.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const BankProductType = {
    SAVINGS: 'savings',
    CHECKING: 'checking',
    FIXED_DEPOSIT: 'fixed_deposit',
    MONEY_MARKET: 'money_market'
}



const PropertyType = {
    RESIDENTIAL_APARTMENT: 'residential_apartment',
    RESIDENTIAL_HOUSE: 'residential_house',
    RESIDENTIAL_VILLA: 'residential_villa',
    COMMERCIAL_OFFICE: 'commercial_office',
    COMMERCIAL_RETAIL: 'commercial_retail',
    COMMERCIAL_HOTEL: 'commercial_hotel',
    INDUSTRIAL_WAREHOUSE: 'industrial_warehouse',
    INDUSTRIAL_FACTORY: 'industrial_factory',
    LAND_RESIDENTIAL: 'land_residential',
    LAND_COMMERCIAL: 'land_commercial',
    LAND_AGRICULTURAL: 'land_agricultural'
}

const NeighborhoodTier = {
    PREMIUM: 'premium',
    HIGH_END: 'high_end',
    MID_RANGE: 'mid_range',
    AFFORDABLE: 'affordable',
    DEVELOPING: 'developing'
}

const PropertyCondition = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor',
    DILAPIDATED: 'dilapidated'
}

const ZoningType = {
    RESIDENTIAL: 'residential',
    COMMERCIAL: 'commercial',
    INDUSTRIAL: 'industrial',
    MIXED_USE: 'mixed_use',
    AGRICULTURAL: 'agricultural',
    SPECIAL_PURPOSE: 'special_purpose'
}

const InsuranceStatus = {
    FULLY_INSURED: 'fully_insured',
    PARTIALLY_INSURED: 'partially_insured',
    UNINSURED: 'uninsured'
}

const InsuranceCoverageType = {
    BASIC: 'basic',
    STANDARD: 'standard',
    COMPREHENSIVE: 'comprehensive',
    DISASTER: 'disaster',
    LIABILITY: 'liability'
}

const ProjectStatus = {
    PLANNING: 'planning',
    PERMITS: 'permits',
    CONSTRUCTION: 'construction',
    FINISHING: 'finishing',
    COMPLETED: 'completed',
    SELLING: 'selling',
    SOLD_OUT: 'sold_out'
}

const TransactionType = {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    PURCHASE: 'purchase',
    SALE: 'sale',
    INCOME: 'income',
    LOAN: 'loan',
    LOAN_PAYMENT: 'loan_payment',
    RENTAL_INCOME: 'rental_income',
    RENTAL_PAYMENT: 'rental_payment',
    PROPERTY_TAX: 'property_tax',
    MAINTENANCE: 'maintenance',
    INSURANCE_PREMIUM: 'insurance_premium',
    INSURANCE_CLAIM: 'insurance_claim',
    UPGRADE: 'upgrade',
    INTEREST_EARNED: 'interest_earned',
    INVESTMENT: 'investment',
    INVESTMENT_RETURN: 'investment_return',
    PARTNERSHIP_CONTRIBUTION: 'partnership_contribution',
    PARTNERSHIP_DISTRIBUTION: 'partnership_distribution',
    COMMISSION: 'commission',
    PENALTY: 'penalty',
    BANK_FEE: 'bank_fee'
}

const LoanType = {
    MORTGAGE: 'mortgage',
    CONSTRUCTION: 'construction',
    BUSINESS: 'business',
    PERSONAL: 'personal',
    BRIDGE: 'bridge',
    DEVELOPMENT: 'development'
}

// Initial economic indicators
const initialEconomicIndicators = {
    inflationRate: 4.5,
    mortgageBaseRate: 8.0,
    economicGrowth: 5.2,
    unemploymentRate: 3.8,
    consumerConfidence: 68,
    stockMarketIndex: 1500,
    stockMarketChange: 0.8,
    lastUpdate: Date.now()
};

// Initial bank products
function generateInitialBankProducts() {
    return [
        {
            id: generateId(),
            name: 'Tiết kiệm không kỳ hạn',
            type: BankProductType.SAVINGS,
            interestRate: 2.2, // annual percentage
            minTerm: 0,
            maxTerm: 0,
            minDeposit: 100000, // 100k VND
            maxDeposit: null, // no maximum
            earlyWithdrawalPenalty: 0,
            createdAt: Date.now()
        },
        {
            id: generateId(),
            name: 'Tiết kiệm 3 tháng',
            type: BankProductType.FIXED_DEPOSIT,
            interestRate: 4.5, // annual percentage
            minTerm: 3,
            maxTerm: 3,
            minDeposit: 1000000, // 1M VND
            maxDeposit: null,
            earlyWithdrawalPenalty: 50, // lose 50% of interest
            createdAt: Date.now()
        },
        {
            id: generateId(),
            name: 'Tiết kiệm 6 tháng',
            type: BankProductType.FIXED_DEPOSIT,
            interestRate: 5.2, // annual percentage
            minTerm: 6,
            maxTerm: 6,
            minDeposit: 5000000, // 5M VND
            maxDeposit: null,
            earlyWithdrawalPenalty: 50,
            createdAt: Date.now()
        },
        {
            id: generateId(),
            name: 'Tiết kiệm 12 tháng',
            type: BankProductType.FIXED_DEPOSIT,
            interestRate: 6.8, // annual percentage
            minTerm: 12,
            maxTerm: 12,
            minDeposit: 10000000, // 10M VND
            maxDeposit: null,
            earlyWithdrawalPenalty: 50,
            createdAt: Date.now()
        },
        {
            id: generateId(),
            name: 'Tiết kiệm 24 tháng',
            type: BankProductType.FIXED_DEPOSIT,
            interestRate: 7.3, // annual percentage
            minTerm: 24,
            maxTerm: 24,
            minDeposit: 20000000, // 20M VND
            maxDeposit: null,
            earlyWithdrawalPenalty: 50,
            createdAt: Date.now()
        },
        {
            id: generateId(),
            name: 'Thị trường tiền tệ',
            type: BankProductType.MONEY_MARKET,
            interestRate: 3.5, // annual percentage
            minTerm: 1,
            maxTerm: 1,
            minDeposit: 50000000, // 50M VND
            maxDeposit: null,
            earlyWithdrawalPenalty: 75, // lose 75% of interest
            createdAt: Date.now()
        }
    ];
}

// Initial game data
const initialGameData = {
    accounts: {},
    properties: generateInitialProperties(),
    transactions: [],
    loans: [],
    bankProducts: generateInitialBankProducts(),
    marketEvents: generateInitialMarketEvents(),
    projectDevelopments: generateInitialProjects(),
    partnerships: [],
    lastUpdate: Date.now(),
    economicIndicators: initialEconomicIndicators
};

// Initialize game data
let gameData;

// Load game data or create new if not exists
function loadGameData() {
    try {
        if (fs.existsSync(GAME_DATA_FILE)) {
            const data = fs.readFileSync(GAME_DATA_FILE, 'utf8');
            const loadedData = JSON.parse(data);

            // Initialize any missing fields
            gameData = loadedData;
            initializeGameDataFields();

            return gameData;
        } else {
            // Initialize with default data
            gameData = { ...initialGameData };
            saveGameData(gameData);
            return gameData;
        }
    } catch (error) {
        global.logger.error(`Error loading game data: ${error}`);
        // Return default data if loading fails
        gameData = { ...initialGameData };
        return gameData;
    }
}

// Save game data
function saveGameData(data) {
    try {
        fs.writeFileSync(GAME_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        global.logger.error(`Error saving game data: ${error}`);
    }
}

// Generate initial market events
function generateInitialMarketEvents() {
    const now = Date.now();
    return [
        {
            id: generateId(),
            name: 'Tăng trưởng kinh tế',
            description: 'Nền kinh tế đang phát triển mạnh mẽ, tác động tích cực đến thị trường bất động sản',
            affectedPropertyTypes: [
                PropertyType.COMMERCIAL_OFFICE,
                PropertyType.COMMERCIAL_RETAIL,
                PropertyType.RESIDENTIAL_APARTMENT
            ],
            affectedLocations: null, // All locations
            priceImpact: 5, // 5% price increase
            demandImpact: 8, // 8% demand increase
            duration: 30, // 30 days
            startDate: now,
            endDate: now + (30 * 24 * 60 * 60 * 1000),
            active: true
        },
        {
            id: generateId(),
            name: 'Quy hoạch mới khu đô thị',
            description: 'Chính phủ công bố quy hoạch mới cho các khu đô thị vệ tinh',
            affectedPropertyTypes: [
                PropertyType.LAND_RESIDENTIAL,
                PropertyType.LAND_COMMERCIAL
            ],
            affectedLocations: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'],
            priceImpact: 10, // 10% price increase
            demandImpact: 15, // 15% demand increase
            duration: 60, // 60 days
            startDate: now + (5 * 24 * 60 * 60 * 1000), // starts in 5 days
            endDate: now + (65 * 24 * 60 * 60 * 1000),
            active: false
        }
    ];
}

// Generate initial projects
function generateInitialProjects() {
    const now = Date.now();
    return [
        {
            id: generateId(),
            name: 'Khu đô thị Eco Green',
            description: 'Khu đô thị sinh thái hiện đại với nhiều tiện ích',
            location: 'TP.HCM',
            type: PropertyType.RESIDENTIAL_APARTMENT,
            totalUnits: 500,
            soldUnits: 120,
            basePrice: 2500000000, // 2.5 billion VND per unit
            currentPhase: 1,
            totalPhases: 3,
            developerId: 'system', // Developed by system initially
            investors: [],
            startDate: now - (90 * 24 * 60 * 60 * 1000), // Started 90 days ago
            estimatedCompletionDate: now + (360 * 24 * 60 * 60 * 1000), // Completes in 1 year
            completionPercentage: 25,
            status: ProjectStatus.CONSTRUCTION
        },
        {
            id: generateId(),
            name: 'Trung tâm thương mại Star Center',
            description: 'Trung tâm thương mại hiện đại với các thương hiệu hàng đầu',
            location: 'Hà Nội',
            type: PropertyType.COMMERCIAL_RETAIL,
            totalUnits: 200,
            soldUnits: 80,
            basePrice: 5000000000, // 5 billion VND per unit
            currentPhase: 2,
            totalPhases: 2,
            developerId: 'system',
            investors: [],
            startDate: now - (180 * 24 * 60 * 60 * 1000), // Started 6 months ago
            estimatedCompletionDate: now + (180 * 24 * 60 * 60 * 1000), // Completes in 6 months
            completionPercentage: 60,
            status: ProjectStatus.CONSTRUCTION
        }
    ];
}

// Generate initial properties
function generateInitialProperties() {
    const currentYear = new Date().getFullYear();
    const properties = [];

    // Residential Apartments
    properties.push(
        createProperty(
            'Chung cư The Harmony',
            'Căn hộ cao cấp với tầm nhìn panorama',
            1800000000,
            PropertyType.RESIDENTIAL_APARTMENT,
            'TP.HCM',
            'Quận 7',
            NeighborhoodTier.HIGH_END,
            90,
            18000000,
            2000000,
            currentYear - 3,
            ZoningType.RESIDENTIAL
        ),
        createProperty(
            'Chung cư Sun Residence',
            'Căn hộ hiện đại tại trung tâm thành phố',
            1500000000,
            PropertyType.RESIDENTIAL_APARTMENT,
            'Hà Nội',
            'Cầu Giấy',
            NeighborhoodTier.MID_RANGE,
            75,
            15000000,
            1800000,
            currentYear - 5,
            ZoningType.RESIDENTIAL
        )
    );

    // Residential Houses
    properties.push(
        createProperty(
            'Nhà phố Palm Residence',
            'Nhà phố hiện đại trong khu compound an ninh',
            4500000000,
            PropertyType.RESIDENTIAL_HOUSE,
            'TP.HCM',
            'Quận 2',
            NeighborhoodTier.PREMIUM,
            200,
            45000000,
            5000000,
            currentYear - 2,
            ZoningType.RESIDENTIAL
        ),
        createProperty(
            'Nhà liền kề Green Valley',
            'Nhà liền kề phong cách hiện đại tại khu đô thị mới',
            3800000000,
            PropertyType.RESIDENTIAL_HOUSE,
            'Hà Nội',
            'Long Biên',
            NeighborhoodTier.HIGH_END,
            180,
            38000000,
            4500000,
            currentYear - 3,
            ZoningType.RESIDENTIAL
        )
    );

    // Residential Villas
    properties.push(
        createProperty(
            'Biệt thự biển Ocean Vista',
            'Biệt thự nghỉ dưỡng view biển tuyệt đẹp',
            12000000000,
            PropertyType.RESIDENTIAL_VILLA,
            'Phan Thiết',
            'Mũi Né',
            NeighborhoodTier.PREMIUM,
            350,
            120000000,
            15000000,
            currentYear - 1,
            ZoningType.RESIDENTIAL
        )
    );

    // Commercial Office
    properties.push(
        createProperty(
            'Văn phòng Centec Tower',
            'Tòa nhà văn phòng hạng A tại trung tâm',
            25000000000,
            PropertyType.COMMERCIAL_OFFICE,
            'TP.HCM',
            'Quận 1',
            NeighborhoodTier.PREMIUM,
            1500,
            250000000,
            30000000,
            currentYear - 5,
            ZoningType.COMMERCIAL
        )
    );

    // Commercial Retail
    properties.push(
        createProperty(
            'Shophouse Diamond Plaza',
            'Cửa hàng mặt tiền đường lớn trong khu trung tâm',
            6500000000,
            PropertyType.COMMERCIAL_RETAIL,
            'Đà Nẵng',
            'Hải Châu',
            NeighborhoodTier.HIGH_END,
            150,
            65000000,
            8000000,
            currentYear - 2,
            ZoningType.COMMERCIAL
        )
    );

    // Commercial Hotel
    properties.push(
        createProperty(
            'Khách sạn Sea Star',
            'Khách sạn 4 sao view biển',
            35000000000,
            PropertyType.COMMERCIAL_HOTEL,
            'Nha Trang',
            'Trung tâm',
            NeighborhoodTier.PREMIUM,
            2000,
            350000000,
            40000000,
            currentYear - 3,
            ZoningType.COMMERCIAL
        )
    );

    // Industrial Warehouse
    properties.push(
        createProperty(
            'Kho bãi Logistics Center',
            'Kho bãi logistics hiện đại gần cảng',
            18000000000,
            PropertyType.INDUSTRIAL_WAREHOUSE,
            'Hải Phòng',
            'Khu công nghiệp',
            NeighborhoodTier.MID_RANGE,
            5000,
            180000000,
            20000000,
            currentYear - 4,
            ZoningType.INDUSTRIAL
        )
    );

    // Industrial Factory
    properties.push(
        createProperty(
            'Nhà máy sản xuất Mega Factory',
            'Nhà máy sản xuất hiện đại trong khu công nghiệp',
            22000000000,
            PropertyType.INDUSTRIAL_FACTORY,
            'Bình Dương',
            'Khu công nghiệp',
            NeighborhoodTier.MID_RANGE,
            8000,
            220000000,
            25000000,
            currentYear - 3,
            ZoningType.INDUSTRIAL
        )
    );

    // Land types
    properties.push(
        createProperty(
            'Đất nền khu dân cư Phú Mỹ',
            'Đất nền đã có sổ đỏ, hạ tầng hoàn thiện',
            3500000000,
            PropertyType.LAND_RESIDENTIAL,
            'Bà Rịa - Vũng Tàu',
            'Phú Mỹ',
            NeighborhoodTier.DEVELOPING,
            250,
            0,
            0,
            currentYear,
            ZoningType.RESIDENTIAL
        ),
        createProperty(
            'Đất thương mại mặt tiền',
            'Đất thương mại mặt tiền đường chính',
            8000000000,
            PropertyType.LAND_COMMERCIAL,
            'Đà Nẵng',
            'Ngũ Hành Sơn',
            NeighborhoodTier.HIGH_END,
            400,
            0,
            0,
            currentYear,
            ZoningType.COMMERCIAL
        ),
        createProperty(
            'Đất nông nghiệp Lâm Đồng',
            'Đất canh tác màu mỡ phù hợp trồng cà phê',
            1200000000,
            PropertyType.LAND_AGRICULTURAL,
            'Lâm Đồng',
            'Bảo Lộc',
            NeighborhoodTier.DEVELOPING,
            10000,
            12000000,
            0,
            currentYear,
            ZoningType.AGRICULTURAL
        )
    );

    return properties;
}

// Create a property
function createProperty(
    name,
    description,
    price,
    type,
    location,
    district,
    neighborhood,
    size,
    income,
    maintenanceCost,
    yearBuilt,
    zoning
) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;

    // Calculate condition based on age
    let condition = PropertyCondition.EXCELLENT;
    if (age > 20) condition = PropertyCondition.DILAPIDATED;
    else if (age > 15) condition = PropertyCondition.POOR;
    else if (age > 10) condition = PropertyCondition.FAIR;
    else if (age > 5) condition = PropertyCondition.GOOD;

    // Calculate property tax (approximately 0.4% of property value annually)
    const propertyTax = Math.round(price * 0.004);

    // Calculate appreciation rate based on neighborhood
    let appreciationRate = 0.05; // Default 5% annual appreciation
    switch (neighborhood) {
        case NeighborhoodTier.PREMIUM:
            appreciationRate = 0.08; // 8%
            break;
        case NeighborhoodTier.HIGH_END:
            appreciationRate = 0.07; // 7%
            break;
        case NeighborhoodTier.MID_RANGE:
            appreciationRate = 0.05; // 5%
            break;
        case NeighborhoodTier.AFFORDABLE:
            appreciationRate = 0.04; // 4%
            break;
        case NeighborhoodTier.DEVELOPING:
            appreciationRate = 0.06; // 6% (higher potential for growth)
            break;
    }

    const now = Date.now();

    return {
        id: generateId(),
        name,
        description,
        basePrice: price,
        currentPrice: price,
        marketValue: price,
        type,
        location,
        district,
        neighborhood,
        size,
        income,
        maintenanceCost,
        propertyTax,
        condition,
        yearBuilt,
        owner: null,
        tenants: [],
        rentalIncome: 0,
        forSale: true,
        forRent: false,
        salePrice: price,
        rentalPrice: null,
        features: [],
        upgrades: [],
        insuranceStatus: InsuranceStatus.UNINSURED,
        zoning,
        createdAt: now,
        lastPriceUpdate: now,
        lastMaintenance: now,
        lastInsurancePayment: now,
        lastTaxPayment: now,
        appreciationRate,
        mortgaged: false,
        mortgageId: null
    };
}

// Helper function to generate ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Format percentage
function formatPercentage(value) {
    return `${value.toFixed(2)}%`;
}

// Check if user has an account
function hasAccount(userId) {
    return userId in gameData.accounts;
}

// Create user account
function createAccount(userId, username) {
    const account = {
        userId,
        username,
        balance: 0,
        savingsAccounts: [],
        ownedProperties: [],
        rentedProperties: [],
        loans: [],
        transactions: [],
        insurance: [],
        partnerships: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        achievements: [],
        ranking: 0,
        experience: 0,
        level: 1,
        taxPaid: 0,
        businessLicense: false,
        reputationScore: 50 // Start with neutral reputation
    };

    gameData.accounts[userId] = account;
    saveGameData(gameData);

    return account;
}

// Add transaction
function addTransaction(
    type,
    fromUserId,
    toUserId,
    propertyId,
    amount,
    description,
    loanId = null,
    projectId = null,
    insuranceId = null
) {
    const transaction = {
        id: generateId(),
        type,
        fromUserId,
        toUserId,
        propertyId,
        loanId,
        projectId,
        insuranceId,
        amount,
        description,
        timestamp: Date.now()
    };

    gameData.transactions.push(transaction);

    // Add transaction to user's transactions
    if (fromUserId && gameData.accounts[fromUserId]) {
        gameData.accounts[fromUserId].transactions.push(transaction.id);
    }

    if (toUserId && gameData.accounts[toUserId]) {
        gameData.accounts[toUserId].transactions.push(transaction.id);
    }

    saveGameData(gameData);

    return transaction;
}

// Update market conditions
function updateMarketConditions() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return; // Only update once per day

    gameData.lastUpdate = now;

    // Update economic indicators
    updateEconomicIndicators();

    // Process active market events
    processMarketEvents();

    // Update property prices and values
    updatePropertyMarket();

    // Generate rental income
    generateRentalIncome();

    // Process loan payments
    processLoanPayments();

    // Process insurance policies
    processInsurancePolicies();

    // Process tax payments
    processTaxPayments();

    // Process maintenance costs
    processMaintenanceCosts();

    // Process savings account interest
    processSavingsInterest();

    // Update project developments
    updateProjectDevelopments();

    // Check for new achievements
    checkForAchievements();

    saveGameData(gameData);
}

// Update economic indicators
function updateEconomicIndicators() {
    const econ = gameData.economicIndicators;

    // Small random fluctuations in economic indicators
    econ.inflationRate += (Math.random() * 0.5 - 0.25); // -0.25% to +0.25%
    econ.inflationRate = Math.max(0.5, Math.min(10, econ.inflationRate)); // Keep between 0.5% and 10%

    econ.mortgageBaseRate += (Math.random() * 0.3 - 0.15); // -0.15% to +0.15%
    econ.mortgageBaseRate = Math.max(3, Math.min(15, econ.mortgageBaseRate)); // Keep between 3% and 15%

    econ.economicGrowth += (Math.random() * 0.4 - 0.2); // -0.2% to +0.2%
    econ.economicGrowth = Math.max(-3, Math.min(10, econ.economicGrowth)); // Keep between -3% and 10%

    econ.unemploymentRate += (Math.random() * 0.3 - 0.15); // -0.15% to +0.15%
    econ.unemploymentRate = Math.max(1, Math.min(15, econ.unemploymentRate)); // Keep between 1% and 15%

    econ.consumerConfidence += Math.floor(Math.random() * 5 - 2.5); // -2 to +2
    econ.consumerConfidence = Math.max(0, Math.min(100, econ.consumerConfidence)); // Keep between 0 and 100

    // Stock market fluctuations
    const stockChange = (Math.random() * 4 - 2); // -2% to +2%
    econ.stockMarketChange = stockChange;
    econ.stockMarketIndex = Math.round(econ.stockMarketIndex * (1 + stockChange / 100));

    econ.lastUpdate = Date.now();

    // Update bank interest rates based on economic conditions
    updateBankInterestRates();
}

// Update bank interest rates
function updateBankInterestRates() {
    const econ = gameData.economicIndicators;

    // Adjust bank rates based on economic conditions
    gameData.bankProducts.forEach(product => {
        let baseAdjustment = 0;

        // Higher inflation usually means higher interest rates
        baseAdjustment += (econ.inflationRate - 4) * 0.2; // Benchmark against 4% inflation

        // Higher mortgage rates push up all rates
        baseAdjustment += (econ.mortgageBaseRate - 8) * 0.15; // Benchmark against 8% mortgage rate

        // Strong economic growth can push rates up
        baseAdjustment += (econ.economicGrowth - 3) * 0.1; // Benchmark against 3% growth

        // Add small random fluctuation
        baseAdjustment += (Math.random() * 0.2 - 0.1);

        // Different products react differently to market changes
        let adjustmentFactor = 1.0;
        switch (product.type) {
            case BankProductType.FIXED_DEPOSIT:
                adjustmentFactor = 1.2; // Fixed deposits are more sensitive
                break;
            case BankProductType.MONEY_MARKET:
                adjustmentFactor = 1.5; // Money markets are even more sensitive
                break;
            case BankProductType.SAVINGS:
                adjustmentFactor = 0.5; // Savings accounts are less sensitive
                break;
            case BankProductType.CHECKING:
                adjustmentFactor = 0.3; // Checking accounts are least sensitive
                break;
        }

        // Apply the adjustment
        product.interestRate += baseAdjustment * adjustmentFactor;

        // Ensure rates stay within reasonable bounds
        switch (product.type) {
            case BankProductType.FIXED_DEPOSIT:
                // Long-term deposits have higher rates
                const termFactor = (product.minTerm >= 12) ? 1.5 :
                    (product.minTerm >= 6) ? 1.3 :
                        (product.minTerm >= 3) ? 1.1 : 1.0;

                product.interestRate = Math.max(3 * termFactor, Math.min(15 * termFactor, product.interestRate));
                break;
            case BankProductType.MONEY_MARKET:
                product.interestRate = Math.max(2.5, Math.min(12, product.interestRate));
                break;
            case BankProductType.SAVINGS:
                product.interestRate = Math.max(0.5, Math.min(5, product.interestRate));
                break;
            case BankProductType.CHECKING:
                product.interestRate = Math.max(0.1, Math.min(2, product.interestRate));
                break;
        }

        // Round to 1 decimal place for cleaner presentation
        product.interestRate = Math.round(product.interestRate * 10) / 10;
    });
}

// Process market events
function processMarketEvents() {
    const now = Date.now();

    // Update status of scheduled events
    gameData.marketEvents.forEach(event => {
        // Start events whose start date has arrived
        if (!event.active && now >= event.startDate && now < event.endDate) {
            event.active = true;
            // Notify affected users (could implement notification system here)
        }

        // End events whose end date has passed
        if (event.active && now >= event.endDate) {
            event.active = false;
        }
    });

    // Create new random events (with small probability)
    if (Math.random() < 0.05) { // 5% chance per day
        createRandomMarketEvent();
    }
}

// Create a random market event
function createRandomMarketEvent() {
    const now = Date.now();
    const eventTypes = [
        {
            name: 'Bùng nổ du lịch',
            description: 'Lượng khách du lịch tăng mạnh, thúc đẩy bất động sản nhà ở và khách sạn',
            affectedTypes: [PropertyType.COMMERCIAL_HOTEL, PropertyType.RESIDENTIAL_APARTMENT],
            priceImpact: 8,
            demandImpact: 12,
            duration: 45
        },
        {
            name: 'Phát triển hạ tầng mới',
            description: 'Chính phủ công bố kế hoạch phát triển hạ tầng giao thông lớn',
            affectedTypes: [PropertyType.LAND_RESIDENTIAL, PropertyType.LAND_COMMERCIAL],
            priceImpact: 15,
            demandImpact: 20,
            duration: 60
        },
        {
            name: 'Dịch bệnh',
            description: 'Dịch bệnh bùng phát ảnh hưởng đến thị trường bất động sản thương mại',
            affectedTypes: [PropertyType.COMMERCIAL_RETAIL, PropertyType.COMMERCIAL_OFFICE],
            priceImpact: -10,
            demandImpact: -15,
            duration: 30
        },
        {
            name: 'Lạm phát tăng cao',
            description: 'Lạm phát tăng cao ảnh hưởng đến khả năng mua nhà của người dân',
            affectedTypes: [
                PropertyType.RESIDENTIAL_APARTMENT,
                PropertyType.RESIDENTIAL_HOUSE,
                PropertyType.RESIDENTIAL_VILLA
            ],
            priceImpact: -5,
            demandImpact: -12,
            duration: 40
        },
        {
            name: 'Làn sóng đầu tư nước ngoài',
            description: 'Nhà đầu tư nước ngoài đổ xô vào thị trường bất động sản Việt Nam',
            affectedTypes: [
                PropertyType.COMMERCIAL_OFFICE,
                PropertyType.INDUSTRIAL_FACTORY,
                PropertyType.INDUSTRIAL_WAREHOUSE
            ],
            priceImpact: 12,
            demandImpact: 18,
            duration: 50
        }
    ];

    // Randomly select an event
    const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    // Randomly select locations (or null for all locations)
    const locations = Math.random() < 0.5 ? null : ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Nha Trang'].slice(0, Math.floor(Math.random() * 3) + 1);

    const marketEvent = {
        id: generateId(),
        name: eventTemplate.name,
        description: eventTemplate.description,
        affectedPropertyTypes: eventTemplate.affectedTypes,
        affectedLocations: locations,
        priceImpact: eventTemplate.priceImpact,
        demandImpact: eventTemplate.demandImpact,
        duration: eventTemplate.duration,
        startDate: now + (Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Start within next week
        endDate: now + ((eventTemplate.duration + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000),
        active: false
    };

    gameData.marketEvents.push(marketEvent);
}

// Update property market
function updatePropertyMarket() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    const econ = gameData.economicIndicators;
    const activeEvents = gameData.marketEvents.filter(e => e.active);

    gameData.properties.forEach(property => {
        // Base daily appreciation based on annual rate
        const dailyAppreciation = property.appreciationRate / 365;

        // Economic factors influence
        let economicMultiplier = 1.0;

        // Higher economic growth is good for property values
        economicMultiplier += (econ.economicGrowth - 3) * 0.05;

        // High inflation increases nominal property values
        economicMultiplier += (econ.inflationRate - 4) * 0.03;

        // High mortgage rates are bad for property values
        economicMultiplier -= (econ.mortgageBaseRate - 8) * 0.04;

        // High unemployment is bad for property values
        economicMultiplier -= (econ.unemploymentRate - 5) * 0.02;

        // High consumer confidence is good for property values
        economicMultiplier += ((econ.consumerConfidence - 50) / 50) * 0.03;

        // Calculate base price change 
        let priceChangePercent = dailyAppreciation * economicMultiplier * daysSinceLastUpdate;

        // Add a small random fluctuation
        priceChangePercent += (Math.random() * 0.004 - 0.002) * daysSinceLastUpdate;

        // Apply effects from active market events
        activeEvents.forEach(event => {
            // Check if this property is affected by the event
            const typeAffected = event.affectedPropertyTypes.includes(property.type);
            const locationAffected = event.affectedLocations === null ||
                event.affectedLocations.includes(property.location);

            if (typeAffected && locationAffected) {
                // Apply daily impact (distribute event impact over its duration)
                const dailyEventImpact = event.priceImpact / event.duration;
                priceChangePercent += (dailyEventImpact / 100) * daysSinceLastUpdate;
            }
        });

        // Apply property condition effects
        switch (property.condition) {
            case PropertyCondition.EXCELLENT:
                priceChangePercent += 0.01 * daysSinceLastUpdate; // +1% extra growth
                break;
            case PropertyCondition.GOOD:
                priceChangePercent += 0.005 * daysSinceLastUpdate; // +0.5% extra growth
                break;
            case PropertyCondition.FAIR:
                // No adjustment
                break;
            case PropertyCondition.POOR:
                priceChangePercent -= 0.005 * daysSinceLastUpdate; // -0.5% reduced growth
                break;
            case PropertyCondition.DILAPIDATED:
                priceChangePercent -= 0.015 * daysSinceLastUpdate; // -1.5% reduced growth
                break;
        }

        // Update property price
        property.currentPrice = Math.round(property.currentPrice * (1 + priceChangePercent));
        property.marketValue = Math.round(property.currentPrice * (0.9 + Math.random() * 0.2)); // Market value varies slightly
        property.lastPriceUpdate = now;

        // Generate passive income for property owners
        if (property.owner && property.income > 0) {
            const owner = gameData.accounts[property.owner];
            if (owner) {
                const incomeAmount = Math.round(property.income * daysSinceLastUpdate / 30); // Daily income

                if (incomeAmount > 0) {
                    owner.balance += incomeAmount;
                    // Add income transaction
                    addTransaction(
                        TransactionType.INCOME,
                        null,
                        property.owner,
                        property.id,
                        incomeAmount,
                        `Thu nhập từ ${property.name} (${daysSinceLastUpdate} ngày)`
                    );
                }
            }
        }
    });
}

// Generate rental income
function generateRentalIncome() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    // Find properties that are being rented
    gameData.properties.forEach(property => {
        if (property.owner && property.tenants.length > 0 && property.rentalIncome > 0) {
            const owner = gameData.accounts[property.owner];

            // Calculate rental income for the period
            const monthlyRentalIncome = property.rentalIncome;
            const periodIncome = Math.round(monthlyRentalIncome * daysSinceLastUpdate / 30);

            if (periodIncome > 0 && owner) {
                // Add income to owner
                owner.balance += periodIncome;

                // Create rental income transaction
                addTransaction(
                    TransactionType.RENTAL_INCOME,
                    null,
                    property.owner,
                    property.id,
                    periodIncome,
                    `Thu nhập từ cho thuê ${property.name} (${daysSinceLastUpdate} ngày)`
                );

                // Process tenant payments
                property.tenants.forEach(tenantId => {
                    const tenant = gameData.accounts[tenantId];
                    if (tenant) {
                        // Calculate tenant's share of the rent
                        const tenantShare = Math.round(periodIncome / property.tenants.length);

                        // Create rental payment transaction (for record-keeping only, already deducted from balance)
                        addTransaction(
                            TransactionType.RENTAL_PAYMENT,
                            tenantId,
                            property.owner,
                            property.id,
                            tenantShare,
                            `Thanh toán tiền thuê ${property.name} (${daysSinceLastUpdate} ngày)`
                        );
                    }
                });
            }
        }
    });
}

// Process loan payments
function processLoanPayments() {
    const now = Date.now();

    gameData.loans.forEach(loan => {
        if (!loan.active || !loan.approved) return;

        if (now >= loan.nextPaymentDue && loan.remainingPayments > 0) {
            const account = gameData.accounts[loan.userId];

            if (account.balance >= loan.paymentAmount) {
                // Deduct payment
                account.balance -= loan.paymentAmount;
                loan.remainingPayments--;

                // Add payment transaction
                addTransaction(
                    TransactionType.LOAN_PAYMENT,
                    loan.userId,
                    null,
                    null,
                    loan.paymentAmount,
                    `Trả góp khoản vay #${loan.id}`,
                    loan.id
                );

                // Update next payment due
                loan.nextPaymentDue = now + (30 * 24 * 60 * 60 * 1000); // 30 days

                // Check if loan is paid off
                if (loan.remainingPayments === 0) {
                    loan.active = false;

                    // Remove mortgage status if applicable
                    if (loan.loanType === LoanType.MORTGAGE && loan.collateral.length > 0) {
                        loan.collateral.forEach(propId => {
                            const property = gameData.properties.find(p => p.id === propId);
                            if (property) {
                                property.mortgaged = false;
                                property.mortgageId = null;
                            }
                        });
                    }

                    // Award experience for successfully paying off a loan
                    account.experience += Math.floor(loan.amount / 10000000); // 1 XP per 10M loan repaid
                    checkLevelUp(account);
                }
            } else {
                // Not enough funds to pay - handle late payment
                loan.missedPayments++;

                // Apply penalty fee (5% of payment amount)
                const penaltyFee = Math.round(loan.paymentAmount * 0.05);

                // Create penalty transaction
                addTransaction(
                    TransactionType.PENALTY,
                    loan.userId,
                    null,
                    null,
                    penaltyFee,
                    `Phí phạt trễ hạn khoản vay #${loan.id}`,
                    loan.id
                );

                // Update next payment due with grace period
                loan.nextPaymentDue = now + (7 * 24 * 60 * 60 * 1000); // 7 days grace period

                // If too many missed payments, consider foreclosure
                if (loan.missedPayments >= 3 && loan.loanType === LoanType.MORTGAGE) {
                    // Initiate foreclosure process
                    forecloseMortgagedProperty(loan);
                }
            }
        }
    });
}

// Foreclose mortgaged property
function forecloseMortgagedProperty(loan) {
    if (loan.collateral.length === 0) return;

    const userId = loan.userId;
    const account = gameData.accounts[userId];

    // Process each collateral property
    loan.collateral.forEach(propertyId => {
        const property = gameData.properties.find(p => p.id === propertyId);

        if (property && property.owner === userId) {
            // Create foreclosure notification transaction
            addTransaction(
                TransactionType.PENALTY,
                userId,
                null,
                propertyId,
                property.currentPrice,
                `Tịch thu tài sản thế chấp do không trả nợ: ${property.name}`,
                loan.id
            );

            // Reset property ownership
            property.owner = null;
            property.forSale = true;
            property.salePrice = Math.round(property.currentPrice * 0.9); // Discount for quick sale
            property.mortgaged = false;
            property.mortgageId = null;

            // Remove property from user's owned properties
            account.ownedProperties = account.ownedProperties.filter(id => id !== propertyId);

            // Reduce reputation score
            account.reputationScore = Math.max(0, account.reputationScore - 20);
        }
    });

    // Mark loan as inactive after foreclosure
    loan.active = false;
}

// Process insurance policies
function processInsurancePolicies() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    // Process each account's insurance policies
    Object.values(gameData.accounts).forEach(account => {
        account.insurance.forEach(policy => {
            if (!policy.active) return;

            // Check if policy has expired
            if (now > policy.endDate) {
                policy.active = false;

                // Send notification about expired policy
                // (Could implement notification system here)
                return;
            }

            // Check if annual premium is due
            const yearsSinceLastPayment = (now - policy.startDate) / (365 * 24 * 60 * 60 * 1000);
            const fullYearsPassed = Math.floor(yearsSinceLastPayment);
            const nextPaymentDue = policy.startDate + (fullYearsPassed + 1) * (365 * 24 * 60 * 60 * 1000);

            if (now >= nextPaymentDue && policy.active) {
                if (account.balance >= policy.premium) {
                    // Deduct premium
                    account.balance -= policy.premium;

                    // Create insurance payment transaction
                    addTransaction(
                        TransactionType.INSURANCE_PREMIUM,
                        account.userId,
                        null,
                        policy.propertyId,
                        policy.premium,
                        `Phí bảo hiểm hàng năm cho ${gameData.properties.find(p => p.id === policy.propertyId)?.name || 'bất động sản'
                        }`,
                        null,
                        null,
                        policy.id
                    );

                    // Update policy
                    policy.startDate = now; // Reset for next year
                    policy.endDate = now + (365 * 24 * 60 * 60 * 1000);
                } else {
                    // Not enough funds - policy lapses
                    policy.active = false;

                    // Update property insurance status
                    const property = gameData.properties.find(p => p.id === policy.propertyId);
                    if (property) {
                        property.insuranceStatus = InsuranceStatus.UNINSURED;
                    }

                    // Send notification about lapsed policy
                    // (Could implement notification system here)
                }
            }
        });
    });

    // Random insurance claims (disasters, damages, etc.)
    if (Math.random() < 0.01 * daysSinceLastUpdate) { // Small chance each day
        processRandomInsuranceClaim();
    }
}

// Process a random insurance claim
function processRandomInsuranceClaim() {
    // Find insured properties
    const insuredProperties = gameData.properties.filter(
        p => p.owner && p.insuranceStatus !== InsuranceStatus.UNINSURED
    );

    if (insuredProperties.length === 0) return;

    // Randomly select a property for the claim
    const property = insuredProperties[Math.floor(Math.random() * insuredProperties.length)];

    // Find the insurance policy
    const owner = gameData.accounts[property.owner];
    const policy = owner.insurance.find(p => p.propertyId === property.id && p.active);

    if (!policy) return;

    // Generate a random claim scenario
    const claimScenarios = [
        { name: 'Hỏa hoạn nhỏ', damagePercent: 5, description: 'Hỏa hoạn nhỏ gây thiệt hại một phần tài sản' },
        { name: 'Ngập lụt', damagePercent: 8, description: 'Ngập lụt gây thiệt hại cho tầng trệt' },
        { name: 'Bão', damagePercent: 10, description: 'Bão làm tốc mái và gây thiệt hại' },
        { name: 'Hư hỏng cơ sở hạ tầng', damagePercent: 3, description: 'Hệ thống điện nước bị hư hỏng' }
    ];

    const scenario = claimScenarios[Math.floor(Math.random() * claimScenarios.length)];

    // Calculate claim amount
    let claimAmount = Math.round(property.currentPrice * (scenario.damagePercent / 100));

    // Adjust based on insurance coverage
    switch (policy.coverageType) {
        case InsuranceCoverageType.BASIC:
            claimAmount = Math.round(claimAmount * 0.7); // 70% coverage
            break;
        case InsuranceCoverageType.STANDARD:
            claimAmount = Math.round(claimAmount * 0.8); // 80% coverage
            break;
        case InsuranceCoverageType.COMPREHENSIVE:
            claimAmount = Math.round(claimAmount * 0.9); // 90% coverage
            break;
        case InsuranceCoverageType.DISASTER:
            claimAmount = Math.round(claimAmount * 1.0); // 100% coverage
            break;
        case InsuranceCoverageType.LIABILITY:
            claimAmount = Math.round(claimAmount * 0.6); // 60% coverage (liability only)
            break;
    }

    // Apply deductible
    claimAmount = Math.max(0, claimAmount - policy.deductible);

    // Ensure claim doesn't exceed coverage amount
    claimAmount = Math.min(claimAmount, policy.coverageAmount);

    if (claimAmount <= 0) return;

    // Process claim payment
    owner.balance += claimAmount;

    // Create insurance claim transaction
    addTransaction(
        TransactionType.INSURANCE_CLAIM,
        null,
        owner.userId,
        property.id,
        claimAmount,
        `Bồi thường bảo hiểm: ${scenario.description} tại ${property.name}`,
        null,
        null,
        policy.id
    );

    // Update property condition based on damage
    updatePropertyConditionAfterDamage(property, scenario.damagePercent);
}

// Update property condition after damage
function updatePropertyConditionAfterDamage(property, damagePercent) {
    // Reduce property condition based on damage
    if (damagePercent >= 15) {
        // Severe damage - drop condition by two levels
        switch (property.condition) {
            case PropertyCondition.EXCELLENT:
                property.condition = PropertyCondition.FAIR;
                break;
            case PropertyCondition.GOOD:
                property.condition = PropertyCondition.POOR;
                break;
            case PropertyCondition.FAIR:
            case PropertyCondition.POOR:
                property.condition = PropertyCondition.DILAPIDATED;
                break;
        }
    } else if (damagePercent >= 5) {
        // Moderate damage - drop condition by one level
        switch (property.condition) {
            case PropertyCondition.EXCELLENT:
                property.condition = PropertyCondition.GOOD;
                break;
            case PropertyCondition.GOOD:
                property.condition = PropertyCondition.FAIR;
                break;
            case PropertyCondition.FAIR:
                property.condition = PropertyCondition.POOR;
                break;
            case PropertyCondition.POOR:
                property.condition = PropertyCondition.DILAPIDATED;
                break;
        }
    }

    // Adjust property price based on new condition
    updatePropertyPriceAfterConditionChange(property);
}

// Update property price after condition change
function updatePropertyPriceAfterConditionChange(property) {
    // Adjust price based on condition
    let conditionMultiplier = 1.0;

    switch (property.condition) {
        case PropertyCondition.EXCELLENT:
            conditionMultiplier = 1.1; // Premium for excellent condition
            break;
        case PropertyCondition.GOOD:
            conditionMultiplier = 1.0; // Baseline
            break;
        case PropertyCondition.FAIR:
            conditionMultiplier = 0.9; // Slight discount
            break;
        case PropertyCondition.POOR:
            conditionMultiplier = 0.75; // Significant discount
            break;
        case PropertyCondition.DILAPIDATED:
            conditionMultiplier = 0.6; // Major discount
            break;
    }

    // Apply the multiplier to update current price
    const newPrice = Math.round(property.basePrice * conditionMultiplier *
        (1 + (property.appreciationRate * (Date.now() - property.createdAt) / (365 * 24 * 60 * 60 * 1000))));

    // Don't allow price to increase, only decrease in case of damage
    if (newPrice < property.currentPrice) {
        property.currentPrice = newPrice;
        property.marketValue = Math.round(newPrice * (0.9 + Math.random() * 0.2));
    }
}

// Process tax payments
function processTaxPayments() {
    const now = Date.now();

    // Check if it's time for annual property tax (beginning of the year)
    const currentDate = new Date(now);
    const isJanuary = currentDate.getMonth() === 0;
    const isDayOne = currentDate.getDate() === 1;

    if (isJanuary && isDayOne) {
        // Process annual property taxes
        Object.values(gameData.accounts).forEach(account => {
            let totalTax = 0;

            // Calculate tax for each owned property
            account.ownedProperties.forEach(propertyId => {
                const property = gameData.properties.find(p => p.id === propertyId);
                if (property) {
                    const propertyTax = Math.round(property.currentPrice * 0.004); // 0.4% property tax
                    totalTax += propertyTax;

                    // Update property record
                    property.propertyTax = propertyTax;
                    property.lastTaxPayment = now;
                }
            });

            if (totalTax > 0) {
                if (account.balance >= totalTax) {
                    // Deduct tax
                    account.balance -= totalTax;
                    account.taxPaid += totalTax;

                    // Create tax payment transaction
                    addTransaction(
                        TransactionType.PROPERTY_TAX,
                        account.userId,
                        null,
                        null,
                        totalTax,
                        `Thuế bất động sản hàng năm`
                    );
                } else {
                    // Not enough funds - add to debt or create penalty
                    const penaltyAmount = Math.round(totalTax * 0.1); // 10% penalty

                    // Create penalty transaction
                    addTransaction(
                        TransactionType.PENALTY,
                        account.userId,
                        null,
                        null,
                        penaltyAmount,
                        `Phí phạt chậm nộp thuế bất động sản`
                    );

                    // Still need to pay the tax
                    if (account.balance >= totalTax) {
                        account.balance -= totalTax;
                    } else {
                        // Take what's available
                        account.balance = 0;

                        // Remaining tax becomes a lien on properties
                        // (In a more complex system, this would be implemented as property liens)
                    }

                    // Reduce reputation score for tax issues
                    account.reputationScore = Math.max(0, account.reputationScore - 5);
                }
            }
        });
    }
}

// Process maintenance costs
function processMaintenanceCosts() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    // Process monthly maintenance costs
    Object.values(gameData.accounts).forEach(account => {
        // Calculate total daily maintenance
        let totalMaintenance = 0;

        account.ownedProperties.forEach(propertyId => {
            const property = gameData.properties.find(p => p.id === propertyId);
            if (property && property.maintenanceCost > 0) {
                // Calculate daily maintenance cost
                const dailyMaintenance = Math.round(property.maintenanceCost * daysSinceLastUpdate / 30);
                totalMaintenance += dailyMaintenance;

                // Update property record
                property.lastMaintenance = now;
            }
        });

        if (totalMaintenance > 0) {
            if (account.balance >= totalMaintenance) {
                // Deduct maintenance cost
                account.balance -= totalMaintenance;

                // Create maintenance transaction
                addTransaction(
                    TransactionType.MAINTENANCE,
                    account.userId,
                    null,
                    null,
                    totalMaintenance,
                    `Chi phí bảo trì bất động sản (${daysSinceLastUpdate} ngày)`
                );
            } else {
                // Not enough funds - properties deteriorate
                account.ownedProperties.forEach(propertyId => {
                    const property = gameData.properties.find(p => p.id === propertyId);
                    if (property) {
                        // Property condition deteriorates due to lack of maintenance
                        deterioratePropertyCondition(property);
                    }
                });

                // Take whatever balance is available
                if (account.balance > 0) {
                    const partialPayment = account.balance;
                    account.balance = 0;

                    // Create partial maintenance transaction
                    addTransaction(
                        TransactionType.MAINTENANCE,
                        account.userId,
                        null,
                        null,
                        partialPayment,
                        `Chi phí bảo trì bất động sản một phần (không đủ tiền)`
                    );
                }
            }
        }
    });
}

// Deteriorate property condition due to lack of maintenance
function deterioratePropertyCondition(property) {
    // Chance of condition deteriorating based on current condition
    let deteriorationChance = 0;

    switch (property.condition) {
        case PropertyCondition.EXCELLENT:
            deteriorationChance = 0.3; // 30% chance
            break;
        case PropertyCondition.GOOD:
            deteriorationChance = 0.4; // 40% chance
            break;
        case PropertyCondition.FAIR:
            deteriorationChance = 0.5; // 50% chance
            break;
        case PropertyCondition.POOR:
            deteriorationChance = 0.7; // 70% chance
            break;
        case PropertyCondition.DILAPIDATED:
            deteriorationChance = 0; // Already at worst condition
            break;
    }

    if (Math.random() < deteriorationChance) {
        // Deteriorate condition by one level
        switch (property.condition) {
            case PropertyCondition.EXCELLENT:
                property.condition = PropertyCondition.GOOD;
                break;
            case PropertyCondition.GOOD:
                property.condition = PropertyCondition.FAIR;
                break;
            case PropertyCondition.FAIR:
                property.condition = PropertyCondition.POOR;
                break;
            case PropertyCondition.POOR:
                property.condition = PropertyCondition.DILAPIDATED;
                break;
        }

        // Update property price based on new condition
        updatePropertyPriceAfterConditionChange(property);
    }
}

// Process savings account interest
function processSavingsInterest() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    // Process each account's savings
    Object.values(gameData.accounts).forEach(account => {
        // Handle each savings account
        account.savingsAccounts.forEach(savings => {
            // Find the bank product
            const product = gameData.bankProducts.find(p => p.id === savings.productId);
            if (!product) return;

            if (product.type === BankProductType.SAVINGS) {
                // Calculate daily interest for regular savings account
                const dailyRate = savings.interestRate / 365 / 100;
                const interestEarned = Math.round(savings.amount * dailyRate * daysSinceLastUpdate);

                if (interestEarned > 0) {
                    // Add interest to savings balance
                    savings.amount += interestEarned;

                    // Create interest transaction
                    addTransaction(
                        TransactionType.INTEREST_EARNED,
                        null,
                        account.userId,
                        null,
                        interestEarned,
                        `Lãi tiết kiệm từ ${product.name} (${daysSinceLastUpdate} ngày)`
                    );
                }
            } else if (product.type === BankProductType.FIXED_DEPOSIT) {
                // Check if fixed deposit has matured
                if (now >= savings.maturityDate) {
                    // Calculate total interest for the term
                    const termInDays = product.minTerm * 30;
                    const totalInterest = Math.round(savings.amount * (savings.interestRate / 100) * (termInDays / 365));

                    if (savings.autoRenew) {
                        // Renew the fixed deposit
                        savings.amount += totalInterest;
                        savings.startDate = now;
                        savings.maturityDate = now + (product.minTerm * 30 * 24 * 60 * 60 * 1000);

                        // Update interest rate based on current product rate
                        savings.interestRate = product.interestRate;

                        // Create interest transaction
                        addTransaction(
                            TransactionType.INTEREST_EARNED,
                            null,
                            account.userId,
                            null,
                            totalInterest,
                            `Lãi từ kỳ hạn ${product.name} (tự động gia hạn)`
                        );
                    } else {
                        // Mature the fixed deposit and move to balance
                        const totalPayout = savings.amount + totalInterest;
                        account.balance += totalPayout;

                        // Create transactions
                        addTransaction(
                            TransactionType.INTEREST_EARNED,
                            null,
                            account.userId,
                            null,
                            totalInterest,
                            `Lãi từ kỳ hạn ${product.name}`
                        );

                        addTransaction(
                            TransactionType.WITHDRAWAL,
                            null,
                            account.userId,
                            null,
                            savings.amount,
                            `Rút tiền gốc từ ${product.name} đáo hạn`
                        );

                        // Remove the savings account
                        account.savingsAccounts = account.savingsAccounts.filter(s => s.id !== savings.id);
                    }
                }
            }
        });
    });
}

// Update project developments
function updateProjectDevelopments() {
    const now = Date.now();
    const daysSinceLastUpdate = Math.floor((now - gameData.lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate < 1) return;

    gameData.projectDevelopments.forEach(project => {
        // Skip completed projects
        if (project.status === ProjectStatus.SOLD_OUT) return;

        // Update project progress
        if (project.status !== ProjectStatus.COMPLETED) {
            // Calculate daily progress rate
            const totalDays = (project.estimatedCompletionDate - project.startDate) / (24 * 60 * 60 * 1000);
            const dailyProgressRate = 100 / totalDays; // percentage per day

            // Update completion percentage
            project.completionPercentage += dailyProgressRate * daysSinceLastUpdate;
            project.completionPercentage = Math.min(100, project.completionPercentage);

            // Update project phase and status based on completion
            if (project.completionPercentage >= 100) {
                project.status = ProjectStatus.COMPLETED;
                project.currentPhase = project.totalPhases;

                // Generate properties from the completed project
                generatePropertiesFromProject(project);
            } else if (project.completionPercentage >= 75 && project.status !== ProjectStatus.FINISHING) {
                project.status = ProjectStatus.FINISHING;
                project.currentPhase = Math.min(project.totalPhases, project.currentPhase + 1);
            } else if (project.completionPercentage >= 40 && project.status !== ProjectStatus.CONSTRUCTION) {
                project.status = ProjectStatus.CONSTRUCTION;
                project.currentPhase = Math.min(project.totalPhases, project.currentPhase + 1);
            } else if (project.completionPercentage >= 10 && project.status !== ProjectStatus.PERMITS) {
                project.status = ProjectStatus.PERMITS;
                project.currentPhase = Math.min(project.totalPhases, project.currentPhase + 1);
            }
        }

        // Update sales for selling projects
        if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.SELLING) {
            // Automatically sell some units based on market demand
            const economicMultiplier = (gameData.economicIndicators.consumerConfidence / 50); // 0-2 range
            const baseChance = 0.05 * economicMultiplier; // Base chance of a unit selling per day

            // Adjust for project completion
            const completionMultiplier = project.completionPercentage / 100;

            // Calculate units sold in this period
            const remainingUnits = project.totalUnits - project.soldUnits;
            const dailySellRate = baseChance * completionMultiplier;
            const unitsSold = Math.min(
                remainingUnits,
                Math.floor(dailySellRate * daysSinceLastUpdate * remainingUnits)
            );

            if (unitsSold > 0) {
                project.soldUnits += unitsSold;

                // Check if project is sold out
                if (project.soldUnits >= project.totalUnits) {
                    project.status = ProjectStatus.SOLD_OUT;
                    project.soldUnits = project.totalUnits;
                } else if (project.status !== ProjectStatus.SELLING) {
                    project.status = ProjectStatus.SELLING;
                }

                // Process revenue distribution to developer and investors
                processProjectRevenue(project, unitsSold);
            }
        }
    });

    // Generate new random projects (small chance)
    if (Math.random() < 0.02 * daysSinceLastUpdate) { // 2% chance per day
        generateRandomProject();
    }
}

// Generate properties from a completed project
function generatePropertiesFromProject(project) {
    // Determine how many actual properties to create (a subset of total units)
    const propertiesToCreate = Math.min(10, Math.max(1, Math.floor(project.totalUnits / 50)));

    for (let i = 0; i < propertiesToCreate; i++) {
        // Calculate base price based on project unit price with some variation
        const priceVariance = 0.8 + (Math.random() * 0.4); // 80% to 120% of base price
        const propertyPrice = Math.round(project.basePrice * priceVariance);

        // Calculate size based on property type
        let size;
        switch (project.type) {
            case PropertyType.RESIDENTIAL_APARTMENT:
                size = 50 + Math.floor(Math.random() * 100); // 50-150 sqm
                break;
            case PropertyType.RESIDENTIAL_HOUSE:
                size = 100 + Math.floor(Math.random() * 150); // 100-250 sqm
                break;
            case PropertyType.COMMERCIAL_RETAIL:
                size = 80 + Math.floor(Math.random() * 200); // 80-280 sqm
                break;
            case PropertyType.COMMERCIAL_OFFICE:
                size = 200 + Math.floor(Math.random() * 800); // 200-1000 sqm
                break;
            default:
                size = 100 + Math.floor(Math.random() * 200); // 100-300 sqm
                break;
        }

        // Calculate income based on property type and price
        const incomeRate = 0.008 + (Math.random() * 0.004); // 0.8% to 1.2% monthly income rate
        const monthlyIncome = Math.round(propertyPrice * incomeRate);

        // Create property name
        const unitNumber = Math.floor(Math.random() * project.totalUnits) + 1;
        const propertyName = `${project.name} - Unit ${unitNumber}`;

        // Create the property
        const property = createProperty(
            propertyName,
            `Một phần của dự án ${project.name}. ${project.description}`,
            propertyPrice,
            project.type,
            project.location,
            'Dự án mới',
            NeighborhoodTier.HIGH_END, // New projects usually positioned as high-end
            size,
            monthlyIncome,
            Math.round(monthlyIncome * 0.15), // Maintenance cost about 15% of income
            new Date().getFullYear(), // Current year as build year
            project.type.includes('RESIDENTIAL') ? ZoningType.RESIDENTIAL :
                project.type.includes('COMMERCIAL') ? ZoningType.COMMERCIAL :
                    project.type.includes('INDUSTRIAL') ? ZoningType.INDUSTRIAL : ZoningType.MIXED_USE
        );

        // Add to game properties
        gameData.properties.push(property);
    }
}

// Process project revenue
function processProjectRevenue(project, unitsSold) {
    const totalRevenue = unitsSold * project.basePrice;

    // Developer gets base revenue
    if (project.developerId !== 'system' && gameData.accounts[project.developerId]) {
        const developerShare = Math.round(totalRevenue * 0.7); // Developer gets 70%

        // Add to developer's balance
        gameData.accounts[project.developerId].balance += developerShare;

        // Create transaction
        addTransaction(
            TransactionType.INCOME,
            null,
            project.developerId,
            null,
            developerShare,
            `Doanh thu từ dự án ${project.name} (${unitsSold} căn)`,
            null,
            project.id
        );
    }

    // Investors get their share
    if (project.investors.length > 0) {
        const investorShareTotal = Math.round(totalRevenue * 0.3); // Investors split 30%

        project.investors.forEach(investor => {
            if (gameData.accounts[investor.userId]) {
                // Calculate proportional share
                const totalInvestment = project.investors.reduce((sum, inv) => sum + inv.investment, 0);
                const proportion = investor.investment / totalInvestment;
                const investorRevenue = Math.round(investorShareTotal * proportion);

                // Add to investor's balance
                gameData.accounts[investor.userId].balance += investorRevenue;

                // Create transaction
                addTransaction(
                    TransactionType.INVESTMENT_RETURN,
                    null,
                    investor.userId,
                    null,
                    investorRevenue,
                    `Lợi nhuận đầu tư từ dự án ${project.name} (${unitsSold} căn)`,
                    null,
                    project.id
                );
            }
        });
    }
}

// Generate a random project
function generateRandomProject() {
    const now = Date.now();

    // Project templates
    const projectTemplates = [
        {
            namePrefix: 'Khu đô thị',
            nameSuffixes: ['Green Park', 'New City', 'Harmony', 'Sunshine', 'Eco Valley'],
            type: PropertyType.RESIDENTIAL_APARTMENT,
            description: 'Khu đô thị hiện đại với nhiều tiện ích cao cấp',
            units: [200, 500],
            price: [1800000000, 3000000000],
            phases: [2, 4],
            duration: [360, 720]
        },
        {
            namePrefix: 'Chung cư',
            nameSuffixes: ['Luxury', 'Sky Garden', 'The View', 'Golden Park', 'Central'],
            type: PropertyType.RESIDENTIAL_APARTMENT,
            description: 'Chung cư cao cấp với thiết kế hiện đại và tầm nhìn panorama',
            units: [100, 300],
            price: [2500000000, 4500000000],
            phases: [2, 3],
            duration: [300, 540]
        },
        {
            namePrefix: 'Trung tâm thương mại',
            nameSuffixes: ['Plaza', 'Center', 'Mall', 'Square', 'Galleria'],
            type: PropertyType.COMMERCIAL_RETAIL,
            description: 'Trung tâm thương mại hiện đại với các thương hiệu hàng đầu',
            units: [50, 150],
            price: [5000000000, 10000000000],
            phases: [2, 3],
            duration: [360, 600]
        },
        {
            namePrefix: 'Tòa nhà văn phòng',
            nameSuffixes: ['Tower', 'Business Center', 'Office Park', 'Corporate Plaza'],
            type: PropertyType.COMMERCIAL_OFFICE,
            description: 'Tòa nhà văn phòng hạng A với cơ sở vật chất hiện đại',
            units: [30, 100],
            price: [8000000000, 15000000000],
            phases: [2, 3],
            duration: [400, 720]
        }
    ];

    // Locations
    const locations = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Nha Trang', 'Hải Phòng', 'Cần Thơ'];

    // Select a random template
    const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];

    // Generate project details
    const nameSuffix = template.nameSuffixes[Math.floor(Math.random() * template.nameSuffixes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const projectName = `${template.namePrefix} ${nameSuffix}`;

    const totalUnits = Math.floor(template.units[0] + Math.random() * (template.units[1] - template.units[0]));
    const basePrice = Math.round(template.price[0] + Math.random() * (template.price[1] - template.price[0]));
    const totalPhases = Math.floor(template.phases[0] + Math.random() * (template.phases[1] - template.phases[0]));
    const durationDays = Math.floor(template.duration[0] + Math.random() * (template.duration[1] - template.duration[0]));

    const newProject = {
        id: generateId(),
        name: projectName,
        description: template.description,
        location,
        type: template.type,
        totalUnits,
        soldUnits: 0,
        basePrice,
        currentPhase: 1,
        totalPhases,
        developerId: 'system', // Initial developer is system
        investors: [],
        startDate: now,
        estimatedCompletionDate: now + (durationDays * 24 * 60 * 60 * 1000),
        completionPercentage: 0,
        status: ProjectStatus.PLANNING
    };

    gameData.projectDevelopments.push(newProject);
}

// Check for user achievements
function checkForAchievements() {
    Object.values(gameData.accounts).forEach(account => {
        // Check for first property achievement
        if (account.ownedProperties.length > 0 && !hasAchievement(account, 'first_property')) {
            awardAchievement(account, 'first_property', 'Chủ đất đầu tiên', 'Sở hữu bất động sản đầu tiên', 1000000);
        }

        // Check for property tycoon achievement (5+ properties)
        if (account.ownedProperties.length >= 5 && !hasAchievement(account, 'property_tycoon')) {
            awardAchievement(account, 'property_tycoon', 'Ông trùm bất động sản', 'Sở hữu 5 bất động sản trở lên', 5000000);
        }

        // Check for diversified investor (own multiple property types)
        const propertyTypes = new Set();
        account.ownedProperties.forEach(propId => {
            const property = gameData.properties.find(p => p.id === propId);
            if (property) {
                propertyTypes.add(property.type);
            }
        });

        if (propertyTypes.size >= 3 && !hasAchievement(account, 'diversified_investor')) {
            awardAchievement(account, 'diversified_investor', 'Nhà đầu tư đa dạng', 'Sở hữu 3 loại bất động sản khác nhau', 3000000);
        }

        // Check for financial achievements
        const netWorth = calculateNetWorth(account);

        if (netWorth >= 10000000000 && !hasAchievement(account, 'billionaire')) { // 10 billion VND
            awardAchievement(account, 'billionaire', 'Tỷ phú', 'Đạt tổng tài sản 10 tỷ đồng', 10000000);
        }

        // Check for high roller (make a transaction over 5 billion)
        const largeTrans = gameData.transactions.some(t =>
            (t.fromUserId === account.userId || t.toUserId === account.userId) &&
            t.amount >= 5000000000
        );

        if (largeTrans && !hasAchievement(account, 'high_roller')) {
            awardAchievement(account, 'high_roller', 'Đại gia', 'Thực hiện giao dịch trên 5 tỷ đồng', 5000000);
        }
    });
}

// Check if user has an achievement
function hasAchievement(account, achievementId) {
    return account.achievements.some(a => a.id === achievementId);
}

// Award an achievement
function awardAchievement(account, achievementId, name, description, reward) {
    const achievement = {
        id: achievementId,
        name,
        description,
        reward,
        unlockedAt: Date.now()
    };

    // Add achievement
    account.achievements.push(achievement);

    // Award reward
    account.balance += reward;

    // Award experience
    account.experience += Math.floor(reward / 100000); // 1 XP per 100k reward

    // Create transaction
    addTransaction(
        TransactionType.INCOME,
        null,
        account.userId,
        null,
        reward,
        `Phần thưởng thành tựu: ${name}`
    );

    // Check for level up
    checkLevelUp(account);
}

// Calculate net worth
function calculateNetWorth(account) {
    let total = account.balance;

    // Add savings account balances
    account.savingsAccounts.forEach(savings => {
        total += savings.amount;
    });

    // Add property values
    account.ownedProperties.forEach(propertyId => {
        const property = gameData.properties.find(p => p.id === propertyId);
        if (property) {
            total += property.currentPrice;
        }
    });

    // Subtract loan balances
    account.loans.forEach(loanId => {
        const loan = gameData.loans.find(l => l.id === loanId);
        if (loan && loan.active) {
            total -= (loan.remainingPayments * loan.paymentAmount);
        }
    });

    // Add investment values
    gameData.projectDevelopments.forEach(project => {
        const investment = project.investors.find(inv => inv.userId === account.userId);
        if (investment) {
            // Calculate investment value based on project completion
            const completionMultiplier = 1 + (project.completionPercentage / 100);
            total += Math.round(investment.investment * completionMultiplier);
        }
    });

    return total;
}

// Check for level up
function checkLevelUp(account) {
    // Level formula: level = floor(sqrt(experience / 1000)) + 1
    const newLevel = Math.floor(Math.sqrt(account.experience / 1000)) + 1;

    if (newLevel > account.level) {
        const oldLevel = account.level;
        account.level = newLevel;

        // Award level up bonus
        const levelBonus = newLevel * 1000000; // 1 million per level
        account.balance += levelBonus;

        // Create transaction
        addTransaction(
            TransactionType.INCOME,
            null,
            account.userId,
            null,
            levelBonus,
            `Thưởng thăng cấp: Lên cấp ${newLevel}`
        );

        // Unlock business license at level 5
        if (newLevel >= 5 && !account.businessLicense) {
            account.businessLicense = true;

            // Notification transaction
            addTransaction(
                TransactionType.INCOME,
                null,
                account.userId,
                null,
                0,
                `Đã nhận giấy phép kinh doanh bất động sản ở cấp độ 5`
            );
        }
    }
}

/**
 * Parse currency amount from string input
 * Supports formats like:
 * - 1000000
 * - 1,000,000
 * - 1.000.000
 * - 1 triệu
 * - 1tr
 * - 1tỷ
 * - 1.5 tỷ
 * @param input String to parse
 * @returns Parsed amount in VND or NaN if invalid
 */
function parseCurrencyAmount(input) {
    // Normalize input: remove spaces, convert to lowercase
    const normalized = input.toLowerCase().trim();

    // Check for million format (triệu, tr)
    if (normalized.includes('triệu') || normalized.includes('tr')) {
        const numPart = normalized.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(numPart);
        return isNaN(value) ? NaN : value * 1000000;
    }

    // Check for billion format (tỷ, ty)
    if (normalized.includes('tỷ') || normalized.includes('ty')) {
        const numPart = normalized.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(numPart);
        return isNaN(value) ? NaN : value * 1000000000;
    }

    // Handle standard number formats
    // First, normalize separators: replace dots or commas used as thousand separators
    let processedInput = normalized;

    // If there are both commas and dots, assume the last one is the decimal separator
    if (normalized.includes(',') && normalized.includes('.')) {
        const lastCommaIndex = normalized.lastIndexOf(',');
        const lastDotIndex = normalized.lastIndexOf('.');

        if (lastDotIndex > lastCommaIndex) {
            // Dot is the decimal separator, remove all commas
            processedInput = normalized.replace(/,/g, '');
        } else {
            // Comma is the decimal separator, remove all dots and replace the decimal comma with a dot
            processedInput = normalized.replace(/\./g, '').replace(',', '.');
        }
    } else if (normalized.includes(',')) {
        // Only commas present - treat as thousands separator for Vietnamese format
        processedInput = normalized.replace(/,/g, '');
    } else if (normalized.includes('.')) {
        // Only dots present - treat as thousands separator for Vietnamese format
        processedInput = normalized.replace(/\./g, '');
    }

    // Parse the cleaned input
    const value = parseFloat(processedInput);
    return value;
}

module.exports = {
    config: {
        name: "bds",
        version: "1.2",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            vi: "Nhận quà hàng ngày",
            en: "Receive daily gift"
        },
        category: "game",
        guide: {
            vi: "   {pn}: Nhận quà hàng ngày"
                + "\n   {pn} info: Xem thông tin quà hàng ngày",
            en: "   {pn}"
                + "\n   {pn} info: View daily gift information"
        },
        envConfig: {
            rewardFirstDay: {
                coin: 100,
                exp: 10
            }
        }
    },

    langs: {
        vi: {
            monday: "Thứ 2",
            tuesday: "Thứ 3",
            wednesday: "Thứ 4",
            thursday: "Thứ 5",
            friday: "Thứ 6",
            saturday: "Thứ 7",
            sunday: "Chủ nhật",
            alreadyReceived: "Bạn đã nhận quà rồi",
            received: "Bạn đã nhận được %1 coin và %2 exp"
        },
        en: {
            monday: "Monday",
            tuesday: "Tuesday",
            wednesday: "Wednesday",
            thursday: "Thursday",
            friday: "Friday",
            saturday: "Saturday",
            sunday: "Sunday",
            alreadyReceived: "You have already received the gift",
            received: "You have received %1 coin and %2 exp"
        }
    },

    onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
        // Load game data (if not already loaded)
        if (!gameData) {
            gameData = loadGameData();
        }

        // Load game data (if not already loaded)
        if (!gameData) {
            gameData = loadGameData();
        }

        // Ensure all fields are initialized
        initializeGameDataFields();

        // Update market conditions and process periodic events
        updateMarketConditions();

        const user = await usersData.get(event.senderID);

        const name = user.name

        if (!user) {
            await message.reply(
                'Không thể tìm thấy thông tin người dùng. Vui lòng thử lại sau.'
            );
            return;
        }
        console.log(name)
        // If no arguments, show help
        if (!args.length) {
            await showHelp(message);
            return;
        }

        const userId = event.senderID
        const command = args[0].toLowerCase();

        switch (command) {
            case 'tạo':
            case 'tao':
            case 'create':
                await createUserAccount(message, event.senderID, name);
                break;

            case 'gửi':
            case 'gui':
            case 'deposit':
                await deposit(message, userId, args, usersData);
                break;

            case 'rút':
            case 'rut':
            case 'withdraw':
                await withdraw(message, userId, args, usersData);
                break;

            case 'tiết':
            case 'tiet':
            case 'tiết kiệm':
            case 'tietkiem':
            case 'savings':
                await handleSavings(message, userId, args,);
                break;

            case 'thông tin':
            case 'thongtin':
            case 'info':
                await showInfo(userId, args, message);
                break;

            case 'thị trường':
            case 'thitrong':
            case 'ttruong':
            case 'market':
                await showMarketInfo(message);
                break;

            case 'danh sách':
            case 'danhsach':
            case 'ds':
            case 'list':
                await listProperties(userId, args, message);
                break;

            case 'dự án':
            case 'duan':
            case 'projects':
                await listProjects(userId, args, message);
                break;

            case 'mua':
            case 'buy':
                await buyProperty(userId, args, message);
                break;

            case 'bán':
            case 'ban':
            case 'sell':
                await sellProperty(userId, args, message);
                break;

            case 'thuê':
            case 'thue':
            case 'rent':
                await rentProperty(userId, args, message);
                break;

            case 'cho thuê':
            case 'chothue':
            case 'lease':
                await leaseProperty(userId, args, message);
                break;

            case 'vay':
            case 'loan':
                await createLoan(userId, args, message);
                break;

            case 'trả':
            case 'tra':
            case 'pay':
                await payLoan(userId, args, message);
                break;

            case 'nâng cấp':
            case 'nangcap':
            case 'upgrade':
                await upgradeProperty(userId, args, message);
                break;

            case 'bảo trì':
            case 'baotri':
            case 'maintain':
                await maintainProperty(userId, args, message);
                break;

            case 'bảo hiểm':
            case 'baohiem':
            case 'insurance':
                await handleInsurance(userId, args, message);
                break;

            case 'đầu tư':
            case 'dautu':
            case 'invest':
                await investInProject(userId, args, message);
                break;

            case 'hợp tác':
            case 'hoptac':
            case 'partner':
                await handlePartnership(userId, args, message);
                break;

            case 'ranking':
            case 'xếp hạng':
            case 'xephang':
                await showRanking(message);
                break;

            case 'giúp đỡ':
            case 'giupdo':
            case 'help':
            case 'trợ giúp':
            case 'trogiup':
                await showHelp(message);
                break;

            default:
                await showHelp(message);
                break;
        }
    }
};

// Show help
async function showHelp(message) {
    const helpText = `🏠 TRÒ CHƠI BẤT ĐỘNG SẢN 🏠\n\n` +
        `Chào mừng đến với game mua bán bất động sản! Dưới đây là danh sách lệnh:\n\n` +

        `📝 QUẢN LÝ TÀI KHOẢN:\n` +
        `- /bds tạo: Tạo tài khoản mới\n` +
        `- /bds gửi [số tiền]: Gửi tiền vào tài khoản\n` +
        `- /bds rút [số tiền]: Rút tiền từ tài khoản\n` +
        `- /bds thongtin: Xem thông tin tài khoản\n` +
        `- /bds tietkiem [gửi/rút/xem] [id/số tiền] [kỳ hạn]: Quản lý tiết kiệm\n\n` +

        `🏢 BẤT ĐỘNG SẢN:\n` +
        `- /bds danh sách [loại]: Xem danh sách bất động sản\n` +
        `- /bds mua [id]: Mua bất động sản\n` +
        `- /bds bán [id] [giá]: Đặt bất động sản lên bán\n` +
        `- /bds thuê [id]: Thuê bất động sản\n` +
        `- /bds chothue [id] [giá]: Cho thuê bất động sản\n` +
        `- /bds nangcap [id] [số nâng cấp]: Nâng cấp bất động sản\n` +
        `- /bds baotri [id]: Bảo trì bất động sản\n` +
        `- /bds baohiem [mua/hủy] [id] [loại]: Mua bảo hiểm cho BĐS\n\n` +

        `💰 TÀI CHÍNH:\n` +
        `- /bds vay [số tiền] [id_tài_sản]: Vay tiền (cần thế chấp)\n` +
        `- /bds trả [id_khoản_vay] [đầy đủ?]: Trả nợ khoản vay\n` +
        `- /bds ttruong: Xem thông tin thị trường\n\n` +

        `💼 DỰ ÁN & ĐẦU TƯ:\n` +
        `- /bds duan [list/xem/tham gia]: Xem và tham gia dự án\n` +
        `- /bds dautu [id dự án] [số tiền]: Đầu tư vào dự án\n` +
        `- /bds hoptac [tạo/tham gia/list]: Hợp tác đầu tư\n\n` +

        `🏆 KHÁC:\n` +
        `- /bds ranking: Xem bảng xếp hạng\n` +
        `- /bds help: Xem trợ giúp\n\n` +

        `💡 BẮT ĐẦU:\n` +
        `Để bắt đầu, hãy tạo tài khoản với lệnh /bds tạo`;

    await message.reply(helpText);
}

// Create user account
async function createUserAccount(message, userId, displayName) {
    if (hasAccount(userId)) {
        await message.reply(
            'Bạn đã có tài khoản bất động sản rồi!'
        );
        return;
    }

    const account = createAccount(userId, displayName);

    // Give initial balance as welcome bonus
    const initialBonus = 1000000000; // 1 tỷ đồng
    account.balance = initialBonus;

    // Create transaction
    addTransaction(
        TransactionType.DEPOSIT,
        null,
        userId,
        null,
        initialBonus,
        'Tiền thưởng chào mừng'
    );

    saveGameData(gameData);

    await message.reply(
        `🎉 Đã tạo tài khoản bất động sản thành công!\n\n` +
        `👤 Tên tài khoản: ${displayName}\n` +
        `💰 Số dư: ${formatCurrency(account.balance)} (Tiền thưởng chào mừng)\n\n` +
        `💡 Một số việc bạn có thể làm ngay:\n` +
        `- Gửi tiết kiệm để hưởng lãi: /bds tiết kiệm gửi 200tr 6\n` +
        `- Xem danh sách bất động sản: /bds danh sách\n` +
        `- Xem các dự án đầu tư: /bds dự án`,
    );
}

// Deposit money to account
async function deposit(message, userId, args, userData) {
    try {
        if (!hasAccount(userId)) {
            await message.reply(
                'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo');
            return;
        }

        if (args.length < 2) {
            await message.reply(
                'Vui lòng nhập số tiền muốn gửi. Ví dụ: /bds gửi 1000000 hoặc /bds gửi 1tr'
            );
            return;
        }

        // Parse amount using the currency parser
        const amount = parseCurrencyAmount(args[1]);

        if (isNaN(amount) || amount <= 0) {
            await message.reply(
                'Số tiền không hợp lệ. Vui lòng nhập một số dương. Ví dụ: /bds gửi 1000000 hoặc /bds gửi 1tr'
            );
            return;
        }

        // Check if user has enough money in their database account
        const userDb = await userService().getUserMoney(userId);
        if (!userDb || userDb.money < amount) {
            await sendError(
                `Số dư không đủ. Bạn chỉ có ${formatCurrency(userDb ? userDb.money : 0)} trong tài khoản.`,
                replyTo,
                isGroup
            );
            return;
        }

        // Subtract from user's database money
        await userData.addMoney(userId, -amount);

        // Add to in-game account
        const account = gameData.accounts[userId];
        account.balance += amount;
        account.lastActivity = Date.now();

        // Create transaction
        addTransaction(
            TransactionType.DEPOSIT,
            null,
            userId,
            null,
            amount,
            'Gửi tiền vào tài khoản'
        );

        saveGameData(gameData);

        await message.reply(
            `✅ Gửi tiền thành công!\n\n` +
            `💰 Số tiền: ${formatCurrency(amount)}\n` +
            `💰 Số dư trong game: ${formatCurrency(account.balance)}\n\n` +
            `💡 Bạn có thể gửi tiết kiệm để hưởng lãi với lệnh:\n` +
            `/bds tiết kiệm gửi [số tiền] [kỳ hạn]`
        );
    } catch (error) {
        await message.reply(
            'Đã xảy ra lỗi khi gửi tiền. Vui lòng thử lại sau.'
        );
    }
}

// Withdraw money from account
async function withdraw(message, userId, args, userData) {
    try {
        if (!hasAccount(userId)) {
            await message.reply(
                'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
            );
            return;
        }

        if (args.length < 2) {
            await message.reply(
                'Vui lòng nhập số tiền muốn rút. Ví dụ: /bds rút 1000000 hoặc /bds rút 1tr'
            );
            return;
        }

        // Parse amount using the currency parser
        const amount = parseCurrencyAmount(args[1]);

        if (isNaN(amount) || amount <= 0) {
            await message.reply(
                'Số tiền không hợp lệ. Vui lòng nhập một số dương. Ví dụ: /bds rút 1000000 hoặc /bds rút 1tr'
            );
            return;
        }

        const account = gameData.accounts[userId];

        if (account.balance < amount) {
            await message.reply(
                `Số dư trong game không đủ. Bạn chỉ có ${formatCurrency(account.balance)}`
            );
            return;
        }

        // Subtract from in-game account
        account.balance -= amount;
        account.lastActivity = Date.now();

        // Add to user's database money
        await userData.addMoney(userId, amount);

        // Create transaction
        addTransaction(
            TransactionType.WITHDRAWAL,
            userId,
            null,
            null,
            amount,
            'Rút tiền từ tài khoản'
        );

        saveGameData(gameData);

        // Get updated user database money for display
        const userDb = await userData.getMoney(userId);

        await message.reply(
            `✅ Rút tiền thành công!\n\n` +
            `💰 Số tiền: ${formatCurrency(amount)}\n` +
            `💰 Số dư trong game: ${formatCurrency(account.balance)}\n` +
            `💰 Số dư tài khoản chính: ${formatCurrency(userDb ? userDb.money : 0)}`
        );
    } catch (error) {
        await message.reply(
            'Đã xảy ra lỗi khi rút tiền. Vui lòng thử lại sau.'
        );
    }
}

// Handle savings operations
async function handleSavings(message, userId, args) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    const account = gameData.accounts[userId];

    if (args.length < 2) {
        // Show savings products and existing accounts
        await showSavingsInfo(userId, message);
        return;
    }

    const operation = args[1].toLowerCase();

    switch (operation) {
        case 'gửi':
        case 'gui':
        case 'deposit':
            await createSavingsAccount(userId, args, message);
            break;

        case 'rút':
        case 'rut':
        case 'withdraw':
            await withdrawFromSavings(userId, args, message);
            break;

        case 'xem':
        case 'info':
        case 'list':
            await showSavingsInfo(userId, message);
            break;

        default:
            await message.reply(
                'Lệnh không hợp lệ. Sử dụng: /bds tiết kiệm [gửi/rút/xem]'
            );
            break;
    }
}

// Create a savings account
async function createSavingsAccount(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập số tiền muốn gửi tiết kiệm. Ví dụ: /bds tiết kiệm gửi 100tr 6'
        );
        return;
    }

    // Parse amount
    const amount = parseCurrencyAmount(args[2]);

    if (isNaN(amount) || amount <= 0) {
        await message.reply(
            'Số tiền không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    const account = gameData.accounts[userId];

    if (account.balance < amount) {
        await message.reply(
            `Số dư không đủ. Bạn chỉ có ${formatCurrency(account.balance)}`
        );
        return;
    }

    // Determine savings product based on term
    let term = 0; // Default to regular savings
    let productId = null;

    if (args.length >= 4) {
        // Try to parse term
        const inputTerm = parseInt(args[3]);
        term = isNaN(inputTerm) ? 0 : inputTerm;

        // Find appropriate product
        const matchingProducts = gameData.bankProducts.filter(p =>
            (p.minTerm <= term && (p.maxTerm >= term || p.maxTerm === 0))
        );

        if (matchingProducts.length > 0) {
            // Sort by interest rate descending to get best rate
            matchingProducts.sort((a, b) => b.interestRate - a.interestRate);
            productId = matchingProducts[0].id;
        } else {
            // Default to regular savings
            productId = gameData.bankProducts.find(p => p.type === BankProductType.SAVINGS)?.id || null;
            term = 0;
        }
    } else {
        // Default to regular savings
        productId = gameData.bankProducts.find(p => p.type === BankProductType.SAVINGS)?.id || null;
    }

    if (!productId) {
        await message.reply(
            'Không tìm thấy sản phẩm tiết kiệm phù hợp. Vui lòng thử lại sau.'
        );
        return;
    }

    const product = gameData.bankProducts.find(p => p.id === productId);

    // Check minimum deposit
    if (amount < product.minDeposit) {
        await message.reply(
            `Số tiền gửi tối thiểu cho sản phẩm này là ${formatCurrency(product.minDeposit)}`
        );
        return;
    }

    // Check maximum deposit if applicable
    if (product.maxDeposit !== null && amount > product.maxDeposit) {
        await message.reply(
            `Số tiền gửi tối đa cho sản phẩm này là ${formatCurrency(product.maxDeposit)}`
        );
        return;
    }

    // Create savings account
    const now = Date.now();
    const savingsAccount = {
        id: generateId(),
        productId: product.id,
        amount: amount,
        interestRate: product.interestRate,
        term: term,
        startDate: now,
        maturityDate: term > 0 ? now + (term * 30 * 24 * 60 * 60 * 1000) : 0, // 0 for no maturity
        autoRenew: args.length >= 5 && args[4].toLowerCase() === 'renew'
    };

    // Deduct amount from balance
    account.balance -= amount;

    // Add savings account
    account.savingsAccounts.push(savingsAccount);

    // Create transaction
    addTransaction(
        TransactionType.WITHDRAWAL,
        userId,
        null,
        null,
        amount,
        `Gửi tiết kiệm: ${product.name} (${term > 0 ? `${term} tháng` : 'không kỳ hạn'})`
    );

    saveGameData(gameData);

    const maturityDate = term > 0 ? new Date(savingsAccount.maturityDate).toLocaleDateString('vi-VN') : 'Không kỳ hạn';
    const expectedInterest = term > 0 ?
        Math.round(amount * (product.interestRate / 100) * (term / 12)) :
        Math.round(amount * (product.interestRate / 100) / 12); // Monthly interest for non-term

    await message.reply(
        `✅ Đã gửi tiết kiệm thành công!\n\n` +
        `💰 Số tiền gửi: ${formatCurrency(amount)}\n` +
        `📊 Lãi suất: ${formatPercentage(product.interestRate)}/năm\n` +
        `📝 Sản phẩm: ${product.name}\n` +
        `⏱️ Kỳ hạn: ${term > 0 ? `${term} tháng` : 'Không kỳ hạn'}\n` +
        `📅 Ngày đáo hạn: ${maturityDate}\n` +
        `💵 Lãi dự kiến: ${formatCurrency(expectedInterest)}${term > 0 ? ' (toàn kỳ hạn)' : '/tháng'}\n` +
        `💰 Số dư tài khoản còn lại: ${formatCurrency(account.balance)}`
    );
}

// Withdraw money from savings
async function withdrawFromSavings(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID tài khoản tiết kiệm muốn rút. Ví dụ: /bds tiết kiệm rút abc123'
        );
        return;
    }

    const savingsId = args[2];
    const account = gameData.accounts[userId];

    // Find the savings account
    const savingsIndex = account.savingsAccounts.findIndex(s => s.id === savingsId);

    if (savingsIndex === -1) {
        await message.reply(
            'Không tìm thấy tài khoản tiết kiệm với ID này.'
        );
        return;
    }

    const savingsAccount = account.savingsAccounts[savingsIndex];
    const product = gameData.bankProducts.find(p => p.id === savingsAccount.productId);

    if (!product) {
        await message.reply(
            'Không thể tìm thấy thông tin sản phẩm tiết kiệm. Vui lòng thử lại sau.'
        );
        return;
    }

    const now = Date.now();
    let principal = savingsAccount.amount;
    let interest = 0;

    if (product.type === BankProductType.SAVINGS) {
        // Calculate interest for regular savings account up to now
        const daysElapsed = Math.floor((now - savingsAccount.startDate) / (24 * 60 * 60 * 1000));
        const annualRate = savingsAccount.interestRate / 100;
        interest = Math.round(principal * annualRate * (daysElapsed / 365));
    } else if (product.type === BankProductType.FIXED_DEPOSIT) {
        // Check if fixed deposit has matured
        if (now >= savingsAccount.maturityDate) {
            // Full interest if matured
            const termInDays = savingsAccount.term * 30;
            interest = Math.round(principal * (savingsAccount.interestRate / 100) * (termInDays / 365));
        } else {
            // Early withdrawal penalty
            const daysElapsed = Math.floor((now - savingsAccount.startDate) / (24 * 60 * 60 * 1000));
            const fullTermDays = Math.floor((savingsAccount.maturityDate - savingsAccount.startDate) / (24 * 60 * 60 * 1000));
            const fullInterest = principal * (savingsAccount.interestRate / 100) * (daysElapsed / 365);

            // Apply penalty
            interest = Math.round(fullInterest * (1 - product.earlyWithdrawalPenalty / 100));
        }
    }

    // Add principal and interest to balance
    account.balance += principal + interest;

    // Create transactions
    addTransaction(
        TransactionType.DEPOSIT,
        null,
        userId,
        null,
        principal,
        `Rút tiền gốc từ ${product.name}`
    );

    if (interest > 0) {
        addTransaction(
            TransactionType.INTEREST_EARNED,
            null,
            userId,
            null,
            interest,
            `Lãi từ ${product.name}`
        );
    }

    // Remove the savings account
    account.savingsAccounts.splice(savingsIndex, 1);

    saveGameData(gameData);

    await message.reply(
        `✅ Đã rút tiền tiết kiệm thành công!\n\n` +
        `💰 Tiền gốc: ${formatCurrency(principal)}\n` +
        `💸 Tiền lãi: ${formatCurrency(interest)}\n` +
        `💰 Tổng nhận: ${formatCurrency(principal + interest)}\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Show savings account information
async function showSavingsInfo(userId, message) {
    const account = gameData.accounts[userId];

    let infoText = `📊 THÔNG TIN TIẾT KIỆM\n\n`;

    // Show current savings accounts
    if (account.savingsAccounts.length > 0) {
        infoText += `💰 TÀI KHOẢN TIẾT KIỆM CỦA BẠN:\n`;

        account.savingsAccounts.forEach((savings, index) => {
            const product = gameData.bankProducts.find(p => p.id === savings.productId);

            if (product) {
                const now = Date.now();
                const daysElapsed = Math.floor((now - savings.startDate) / (24 * 60 * 60 * 1000));
                let estimatedInterest = 0;

                if (product.type === BankProductType.SAVINGS) {
                    // For regular savings account
                    const annualRate = savings.interestRate / 100;
                    estimatedInterest = Math.round(savings.amount * annualRate * (daysElapsed / 365));
                } else if (product.type === BankProductType.FIXED_DEPOSIT) {
                    // For fixed deposit
                    if (now >= savings.maturityDate) {
                        // Full interest if matured
                        const termInDays = savings.term * 30;
                        estimatedInterest = Math.round(savings.amount * (savings.interestRate / 100) * (termInDays / 365));
                    } else {
                        // Prorated interest
                        estimatedInterest = Math.round(savings.amount * (savings.interestRate / 100) * (daysElapsed / 365));
                    }
                }

                const maturityDate = savings.maturityDate > 0 ?
                    new Date(savings.maturityDate).toLocaleDateString('vi-VN') : 'Không kỳ hạn';

                infoText += `${index + 1}. ${product.name} [ID: ${savings.id}]\n`;
                infoText += `   💰 Số tiền gốc: ${formatCurrency(savings.amount)}\n`;
                infoText += `   📊 Lãi suất: ${formatPercentage(savings.interestRate)}/năm\n`;
                infoText += `   ⏱️ Kỳ hạn: ${savings.term > 0 ? `${savings.term} tháng` : 'Không kỳ hạn'}\n`;
                infoText += `   📅 Ngày đáo hạn: ${maturityDate}\n`;
                infoText += `   💸 Lãi tạm tính: ${formatCurrency(estimatedInterest)}\n`;
                infoText += `   💡 Để rút: /bds tiết kiệm rút ${savings.id}\n\n`;
            }
        });
    } else {
        infoText += `Bạn chưa có tài khoản tiết kiệm nào.\n\n`;
    }

    // Show available savings products
    infoText += `📋 SẢN PHẨM TIẾT KIỆM HIỆN CÓ:\n`;

    gameData.bankProducts.forEach((product, index) => {
        infoText += `${index + 1}. ${product.name}\n`;
        infoText += `   📊 Lãi suất: ${formatPercentage(product.interestRate)}/năm\n`;
        infoText += `   ⏱️ Kỳ hạn: ${product.minTerm > 0 ? `${product.minTerm} tháng` : 'Không kỳ hạn'}\n`;
        infoText += `   💰 Gửi tối thiểu: ${formatCurrency(product.minDeposit)}\n`;

        if (product.type === BankProductType.FIXED_DEPOSIT) {
            const term = product.minTerm;
            const example = 100000000; // 100M VND
            const interestAmount = Math.round(example * (product.interestRate / 100) * (term / 12));

            infoText += `   💡 Ví dụ: ${formatCurrency(example)} trong ${term} tháng sẽ sinh lời ${formatCurrency(interestAmount)}\n`;
        }

        infoText += `\n`;
    });

    infoText += `💡 Để gửi tiết kiệm: /bds tiết kiệm gửi [số tiền] [kỳ hạn]\n`;
    infoText += `💡 Để rút tiền tiết kiệm: /bds tiết kiệm rút [id]`;

    await message.reply(infoText);
}

// Show market information
async function showMarketInfo(message) {
    const econ = gameData.economicIndicators;

    let marketText = `📊 THÔNG TIN THỊ TRƯỜNG BẤT ĐỘNG SẢN\n\n`;

    // Economic indicators
    marketText += `📈 CHỈ SỐ KINH TẾ:\n`;
    marketText += `- Lạm phát: ${formatPercentage(econ.inflationRate)}\n`;
    marketText += `- Lãi suất cơ bản: ${formatPercentage(econ.mortgageBaseRate)}\n`;
    marketText += `- Tăng trưởng GDP: ${formatPercentage(econ.economicGrowth)}\n`;
    marketText += `- Tỷ lệ thất nghiệp: ${formatPercentage(econ.unemploymentRate)}\n`;
    marketText += `- Chỉ số niềm tin tiêu dùng: ${econ.consumerConfidence}/100\n`;
    marketText += `- Chỉ số chứng khoán: ${econ.stockMarketIndex.toLocaleString('vi-VN')} (${econ.stockMarketChange >= 0 ? '+' : ''}${formatPercentage(econ.stockMarketChange)})\n\n`;

    // Active market events
    const activeEvents = gameData.marketEvents.filter(e => e.active);
    if (activeEvents.length > 0) {
        marketText += `🔔 SỰ KIỆN THỊ TRƯỜNG ĐANG DIỄN RA:\n`;
        activeEvents.forEach((event, index) => {
            marketText += `${index + 1}. ${event.name}\n`;
            marketText += `   📝 ${event.description}\n`;
            marketText += `   📊 Tác động giá: ${event.priceImpact >= 0 ? '+' : ''}${formatPercentage(event.priceImpact)}\n`;
            marketText += `   📊 Tác động nhu cầu: ${event.demandImpact >= 0 ? '+' : ''}${formatPercentage(event.demandImpact)}\n`;

            const daysRemaining = Math.ceil((event.endDate - Date.now()) / (24 * 60 * 60 * 1000));
            marketText += `   ⏳ Còn lại: ${daysRemaining} ngày\n\n`;
        });
    } else {
        marketText += `🔔 Không có sự kiện thị trường nào đang diễn ra.\n\n`;
    }

    // Market trends by property type
    marketText += `📈 XU HƯỚNG GIÁ THEO LOẠI BẤT ĐỘNG SẢN:\n`;

    // Calculate average price change for each property type
    const propertyTypeChanges = {};

    gameData.properties.forEach(property => {
        if (!propertyTypeChanges[property.type]) {
            propertyTypeChanges[property.type] = { count: 0, totalChange: 0 };
        }

        const priceChange = property.currentPrice / property.basePrice - 1;
        propertyTypeChanges[property.type].count++;
        propertyTypeChanges[property.type].totalChange += priceChange;
    });

    // Format and display trends
    Object.entries(propertyTypeChanges).forEach(([type, data]) => {
        const avgChange = (data.totalChange / data.count) * 100;
        const trend = avgChange >= 3 ? '↗️ Tăng mạnh' :
            avgChange >= 1 ? '↗️ Tăng nhẹ' :
                avgChange >= -1 ? '→ Ổn định' :
                    avgChange >= -3 ? '↘️ Giảm nhẹ' : '↘️ Giảm mạnh';

        var typeLabel = getPropertyTypeLabel(type);
        marketText += `- ${typeLabel}: ${trend} (${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%)\n`;
    });

    marketText += `\n📊 TOP 3 KHU VỰC TĂNG TRƯỞNG NHANH NHẤT:\n`;

    // Calculate growth by location
    const locationGrowth = {};

    gameData.properties.forEach(property => {
        if (!locationGrowth[property.location]) {
            locationGrowth[property.location] = { count: 0, totalChange: 0 };
        }

        const priceChange = property.currentPrice / property.basePrice - 1;
        locationGrowth[property.location].count++;
        locationGrowth[property.location].totalChange += priceChange;
    });

    // Sort locations by growth rate and show top 3
    const sortedLocations = Object.entries(locationGrowth)
        .map(([location, data]) => ({
            location,
            avgChange: (data.totalChange / data.count) * 100
        }))
        .sort((a, b) => b.avgChange - a.avgChange)
        .slice(0, 3);

    sortedLocations.forEach((loc, index) => {
        marketText += `${index + 1}. ${loc.location}: +${loc.avgChange.toFixed(1)}%\n`;
    });

    marketText += `\n💡 Lời khuyên: ${getMarketAdvice(econ)}`;

    await message.reply(marketText);
}

// Get property type label in Vietnamese
function getPropertyTypeLabel(type) {
    switch (type) {
        case PropertyType.RESIDENTIAL_APARTMENT:
            return 'Căn hộ chung cư';
        case PropertyType.RESIDENTIAL_HOUSE:
            return 'Nhà phố';
        case PropertyType.RESIDENTIAL_VILLA:
            return 'Biệt thự';
        case PropertyType.COMMERCIAL_OFFICE:
            return 'Văn phòng';
        case PropertyType.COMMERCIAL_RETAIL:
            return 'Cửa hàng bán lẻ';
        case PropertyType.COMMERCIAL_HOTEL:
            return 'Khách sạn';
        case PropertyType.INDUSTRIAL_WAREHOUSE:
            return 'Kho bãi';
        case PropertyType.INDUSTRIAL_FACTORY:
            return 'Nhà máy';
        case PropertyType.LAND_RESIDENTIAL:
            return 'Đất ở';
        case PropertyType.LAND_COMMERCIAL:
            return 'Đất thương mại';
        case PropertyType.LAND_AGRICULTURAL:
            return 'Đất nông nghiệp';
        default:
            return type;
    }
}

// Generate market advice based on economic indicators
function getMarketAdvice(econ) {
    if (econ.economicGrowth > 5 && econ.inflationRate < 5 && econ.consumerConfidence > 70) {
        return 'Thị trường đang trong giai đoạn tăng trưởng tốt. Đây là thời điểm thích hợp để đầu tư mở rộng danh mục.';
    } else if (econ.mortgageBaseRate > 10 || econ.inflationRate > 8) {
        return 'Lãi suất cao và lạm phát tăng có thể làm giảm nhu cầu. Nên thận trọng khi vay nợ và đầu tư.';
    } else if (econ.economicGrowth < 2 && econ.unemploymentRate > 6) {
        return 'Kinh tế đang chậm lại. Ưu tiên các bất động sản có thu nhập ổn định và giảm thiểu rủi ro.';
    } else if (econ.stockMarketChange < -3) {
        return 'Thị trường chứng khoán đang giảm. Bất động sản có thể là kênh trú ẩn an toàn nếu bạn có tiền mặt.';
    } else {
        return 'Thị trường ở trạng thái cân bằng. Nên cân nhắc kỹ lưỡng từng cơ hội đầu tư dựa trên vị trí và tiềm năng.';
    }
}

// Show user info
async function showInfo(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    const account = gameData.accounts[userId];

    // If an additional ID is provided, check if it's a property ID
    if (args.length >= 2) {
        const propertyId = args[1];
        const property = gameData.properties.find(p => p.id === propertyId);

        if (property) {
            // Show detailed property information
            await showPropertyDetails(userId, property, replyTo, isGroup);
            return;
        }
    }

    // Calculate total assets
    const netWorth = calculateNetWorth(account);
    let propertyValue = 0;
    let totalIncome = 0;
    let rentalIncome = 0;

    const ownedProperties = gameData.properties.filter(p => p.owner === userId);
    ownedProperties.forEach(property => {
        propertyValue += property.currentPrice;
        totalIncome += property.income;
        rentalIncome += property.rentalIncome;
    });

    // Calculate savings value
    let savingsValue = 0;
    account.savingsAccounts.forEach(savings => {
        savingsValue += savings.amount;
    });

    // Calculate outstanding loans
    let outstandingLoans = 0;
    const activeLoans = gameData.loans.filter(l => l.userId === userId && l.active);
    activeLoans.forEach(loan => {
        outstandingLoans += loan.remainingPayments * loan.paymentAmount;
    });

    // Calculate investment value
    let investmentValue = 0;
    gameData.projectDevelopments.forEach(project => {
        const investment = project.investors.find(inv => inv.userId === account.userId);
        if (investment) {
            // Calculate investment value based on project completion
            const completionMultiplier = 1 + (project.completionPercentage / 100);
            investmentValue += Math.round(investment.investment * completionMultiplier);
        }
    });

    // Basic info text
    let infoText = `📊 THÔNG TIN TÀI KHOẢN BẤT ĐỘNG SẢN\n\n` +
        `👤 Tên tài khoản: ${account.username}\n` +
        `💰 Số dư: ${formatCurrency(account.balance)}\n` +
        `🏦 Tiết kiệm: ${formatCurrency(savingsValue)}\n` +
        `🏠 Số bất động sản sở hữu: ${ownedProperties.length}\n` +
        `💵 Tổng giá trị BĐS: ${formatCurrency(propertyValue)}\n` +
        `💰 Giá trị đầu tư dự án: ${formatCurrency(investmentValue)}\n` +
        `💸 Thu nhập BĐS/tháng: ${formatCurrency(totalIncome + rentalIncome)}\n` +
        `📝 Tổng nợ vay: ${formatCurrency(outstandingLoans)}\n` +
        `💎 Tổng tài sản ròng: ${formatCurrency(netWorth)}\n` +
        `🏆 Cấp độ: ${account.level} (XP: ${account.experience})\n` +
        `⭐ Điểm uy tín: ${account.reputationScore}/100\n`;

    // Business license status
    if (account.businessLicense) {
        infoText += `📄 Giấy phép kinh doanh: ✅ Đã có\n`;
    } else {
        infoText += `📄 Giấy phép kinh doanh: ❌ Chưa có (cần cấp độ 5)\n`;
    }

    infoText += `\n`;

    // List owned properties
    if (ownedProperties.length > 0) {
        infoText += `🏠 BẤT ĐỘNG SẢN SỞ HỮU:\n`;
        ownedProperties.forEach((property, index) => {
            infoText += `${index + 1}. ${property.name} [ID: ${property.id}]\n`;
            infoText += `   💰 Giá: ${formatCurrency(property.currentPrice)} | 📍 ${property.location}\n`;

            // Show profit/loss percentage
            const profitPercent = ((property.currentPrice / property.basePrice) - 1) * 100;
            const profitText = profitPercent >= 0 ?
                `↗️ +${profitPercent.toFixed(1)}%` :
                `↘️ ${profitPercent.toFixed(1)}%`;

            infoText += `   📊 Lợi nhuận: ${profitText} | 💸 Thu nhập: ${formatCurrency(property.income + property.rentalIncome)}/tháng\n`;

            if (index < 4 && ownedProperties.length > 5) {
                infoText += `\n`;
            }
        });

        if (ownedProperties.length > 5) {
            infoText += `... và ${ownedProperties.length - 5} bất động sản khác\n`;
        }

        infoText += `\n`;
    }

    // List active savings accounts
    if (account.savingsAccounts.length > 0) {
        infoText += `🏦 TÀI KHOẢN TIẾT KIỆM:\n`;
        account.savingsAccounts.forEach((savings, index) => {
            const product = gameData.bankProducts.find(p => p.id === savings.productId);
            if (product) {
                infoText += `${index + 1}. ${product.name}: ${formatCurrency(savings.amount)} (${formatPercentage(savings.interestRate)})\n`;
            }
        });

        infoText += `\n`;
    }

    // List active loans
    if (activeLoans.length > 0) {
        infoText += `💰 KHOẢN VAY ĐANG HOẠT ĐỘNG:\n`;
        activeLoans.forEach((loan, index) => {
            infoText += `${index + 1}. ${getLoanTypeLabel(loan.loanType)} [ID: ${loan.id}]\n`;
            infoText += `   💸 Còn ${loan.remainingPayments} kỳ thanh toán, ${formatCurrency(loan.paymentAmount)}/tháng\n`;
        });

        infoText += `\n`;
    }

    // List investments
    const userInvestments = gameData.projectDevelopments.filter(project =>
        project.investors.some(inv => inv.userId === userId)
    );

    if (userInvestments.length > 0) {
        infoText += `💼 ĐẦU TƯ DỰ ÁN:\n`;
        userInvestments.forEach((project, index) => {
            const investment = project.investors.find(inv => inv.userId === userId);
            infoText += `${index + 1}. ${project.name}\n`;
            infoText += `   💰 Đầu tư: ${formatCurrency(investment.investment)} | ⏳ Hoàn thành: ${project.completionPercentage.toFixed(1)}%\n`;
        });

        infoText += `\n`;
    }

    // List achievements
    if (account.achievements.length > 0) {
        infoText += `🏆 THÀNH TỰU ĐẠT ĐƯỢC:\n`;
        account.achievements.slice(0, 3).forEach((achievement, index) => {
            infoText += `${index + 1}. ${achievement.name}: ${achievement.description}\n`;
        });

        if (account.achievements.length > 3) {
            infoText += `... và ${account.achievements.length - 3} thành tựu khác\n`;
        }
    }

    await message.reply(infoText);
}

// Show detailed property information
async function showPropertyDetails(userId, property, message) {
    const isOwner = property.owner === userId;

    // Calculate ROI and other metrics
    const annualIncome = (property.income + property.rentalIncome) * 12;
    const roi = annualIncome / property.currentPrice * 100;
    const capRate = annualIncome / property.marketValue * 100;
    const appreciation = ((property.currentPrice / property.basePrice) - 1) * 100;

    let detailText = `🏠 CHI TIẾT BẤT ĐỘNG SẢN\n\n`;

    // Basic property information
    detailText += `📝 THÔNG TIN CHUNG:\n`;
    detailText += `- Tên: ${property.name}\n`;
    detailText += `- Loại: ${getPropertyTypeLabel(property.type)}\n`;
    detailText += `- Vị trí: ${property.location}, ${property.district}\n`;
    detailText += `- Khu vực: ${getNeighborhoodLabel(property.neighborhood)}\n`;
    detailText += `- Diện tích: ${property.size}m²\n`;
    detailText += `- Năm xây dựng: ${property.yearBuilt}\n`;
    detailText += `- Tình trạng: ${getPropertyConditionLabel(property.condition)}\n`;
    detailText += `- Quy hoạch: ${getZoningLabel(property.zoning)}\n\n`;

    // Financial information
    detailText += `💰 THÔNG TIN TÀI CHÍNH:\n`;
    detailText += `- Giá mua ban đầu: ${formatCurrency(property.basePrice)}\n`;
    detailText += `- Giá hiện tại: ${formatCurrency(property.currentPrice)}\n`;
    detailText += `- Giá thị trường ước tính: ${formatCurrency(property.marketValue)}\n`;
    detailText += `- Tăng giá: ${appreciation >= 0 ? '+' : ''}${appreciation.toFixed(1)}%\n`;
    detailText += `- Thu nhập hàng tháng: ${formatCurrency(property.income)}\n`;
    detailText += `- Thu nhập cho thuê: ${formatCurrency(property.rentalIncome)}/tháng\n`;
    detailText += `- Tỷ suất sinh lời (ROI): ${roi.toFixed(2)}%/năm\n`;
    detailText += `- Tỷ suất vốn hóa: ${capRate.toFixed(2)}%\n`;
    detailText += `- Chi phí bảo trì: ${formatCurrency(property.maintenanceCost)}/tháng\n`;
    detailText += `- Thuế hàng năm: ${formatCurrency(property.propertyTax)}\n\n`;

    // Ownership information
    detailText += `👤 THÔNG TIN SỞ HỮU:\n`;
    if (property.owner) {
        const ownerAccount = gameData.accounts[property.owner];
        detailText += `- Chủ sở hữu: ${isOwner ? 'Bạn' : ownerAccount?.username || 'Không xác định'}\n`;

        if (property.mortgaged) {
            detailText += `- Tình trạng: Đang thế chấp ngân hàng\n`;
        }
    } else {
        detailText += `- Chủ sở hữu: Không có (đang bán)\n`;
    }

    if (property.forSale) {
        detailText += `- Đang bán: Có (${formatCurrency(property.salePrice)})\n`;
    }

    if (property.forRent) {
        detailText += `- Đang cho thuê: Có (${formatCurrency(property.rentalPrice)})\n`;
    }

    if (property.tenants.length > 0) {
        detailText += `- Số người thuê: ${property.tenants.length}\n`;
    }

    detailText += `- Bảo hiểm: ${getInsuranceStatusLabel(property.insuranceStatus)}\n\n`;

    // Upgrades and features
    if (property.upgrades.length > 0) {
        detailText += `🛠️ NÂNG CẤP ĐÃ THỰC HIỆN:\n`;
        property.upgrades.forEach((upgrade, index) => {
            detailText += `${index + 1}. ${upgrade.name}: ${formatCurrency(upgrade.cost)}\n`;
            detailText += `   Tăng giá trị: +${formatCurrency(upgrade.valueIncrease)}, Tăng thu nhập: +${formatCurrency(upgrade.incomeIncrease)}/tháng\n`;
        });
        detailText += `\n`;
    }

    if (property.features.length > 0) {
        detailText += `✨ TÍNH NĂNG ĐẶC BIỆT:\n`;
        property.features.forEach((feature, index) => {
            detailText += `- ${feature}\n`;
        });
        detailText += `\n`;
    }

    // Actions section
    detailText += `💡 CÁC HÀNH ĐỘNG CÓ THỂ THỰC HIỆN:\n`;

    if (isOwner) {
        detailText += `- Bán: /bds bán ${property.id} [giá]\n`;
        detailText += `- Cho thuê: /bds cho thuê ${property.id} [giá]\n`;
        detailText += `- Nâng cấp: /bds nâng cấp ${property.id}\n`;
        detailText += `- Bảo trì: /bds bảo trì ${property.id}\n`;

        if (property.insuranceStatus === InsuranceStatus.UNINSURED) {
            detailText += `- Mua bảo hiểm: /bds bảo hiểm mua ${property.id} [loại]\n`;
        }

        if (!property.mortgaged) {
            detailText += `- Vay thế chấp: /bds vay [số tiền] ${property.id}\n`;
        }
    } else if (property.forSale) {
        detailText += `- Mua: /bds mua ${property.id}\n`;
    }

    if (property.forRent && !property.tenants.includes(userId)) {
        detailText += `- Thuê: /bds thuê ${property.id}\n`;
    }

    await message.reply(detailText);
}

// Get neighborhood tier label
function getNeighborhoodLabel(tier) {
    switch (tier) {
        case NeighborhoodTier.PREMIUM:
            return 'Cao cấp';
        case NeighborhoodTier.HIGH_END:
            return 'Sang trọng';
        case NeighborhoodTier.MID_RANGE:
            return 'Trung cấp';
        case NeighborhoodTier.AFFORDABLE:
            return 'Bình dân';
        case NeighborhoodTier.DEVELOPING:
            return 'Đang phát triển';
        default:
            return tier;
    }
}

// Get property condition label
function getPropertyConditionLabel(condition) {
    switch (condition) {
        case PropertyCondition.EXCELLENT:
            return 'Tuyệt vời (5/5)';
        case PropertyCondition.GOOD:
            return 'Tốt (4/5)';
        case PropertyCondition.FAIR:
            return 'Khá (3/5)';
        case PropertyCondition.POOR:
            return 'Kém (2/5)';
        case PropertyCondition.DILAPIDATED:
            return 'Xuống cấp (1/5)';
        default:
            return condition;
    }
}

// Get zoning type label
function getZoningLabel(zoning) {
    switch (zoning) {
        case ZoningType.RESIDENTIAL:
            return 'Khu dân cư';
        case ZoningType.COMMERCIAL:
            return 'Thương mại';
        case ZoningType.INDUSTRIAL:
            return 'Công nghiệp';
        case ZoningType.MIXED_USE:
            return 'Hỗn hợp';
        case ZoningType.AGRICULTURAL:
            return 'Nông nghiệp';
        case ZoningType.SPECIAL_PURPOSE:
            return 'Mục đích đặc biệt';
        default:
            return zoning;
    }
}

// Get insurance status label
function getInsuranceStatusLabel(status) {
    switch (status) {
        case InsuranceStatus.FULLY_INSURED:
            return 'Đầy đủ ✅';
        case InsuranceStatus.PARTIALLY_INSURED:
            return 'Một phần ⚠️';
        case InsuranceStatus.UNINSURED:
            return 'Không có ❌';
        default:
            return 'Không xác định';
    }
}

// Get loan type label
function getLoanTypeLabel(type) {
    switch (type) {
        case LoanType.MORTGAGE:
            return 'Khoản vay thế chấp nhà đất';
        case LoanType.CONSTRUCTION:
            return 'Khoản vay xây dựng';
        case LoanType.BUSINESS:
            return 'Khoản vay kinh doanh';
        case LoanType.PERSONAL:
            return 'Khoản vay cá nhân';
        case LoanType.BRIDGE:
            return 'Khoản vay ngắn hạn';
        case LoanType.DEVELOPMENT:
            return 'Khoản vay phát triển dự án';
        default:
            return type;
    }
}

// List properties
async function listProperties(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    // Filter properties
    let filteredProperties = [...gameData.properties];
    let filterType = null;
    var sortBy = 'price';
    var allowedSortBy = ['price', 'income', 'roi', 'appreciation'];
    if (allowedSortBy.indexOf(sortBy) === -1) {
        sortBy = 'price';
    }
    var sortOrder = 'asc';

    // Process filter arguments
    if (args.length >= 2) {
        const type = args[1].toLowerCase();

        // Property type filters
        if (type.includes('căn hộ') || type.includes('chung cư') || type === 'apartment') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.RESIDENTIAL_APARTMENT);
            filterType = 'Căn hộ';
        } else if (type.includes('nhà') || type === 'house') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.RESIDENTIAL_HOUSE);
            filterType = 'Nhà phố';
        } else if (type.includes('biệt thự') || type.includes('villa')) {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.RESIDENTIAL_VILLA);
            filterType = 'Biệt thự';
        } else if (type.includes('văn phòng') || type === 'office') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.COMMERCIAL_OFFICE);
            filterType = 'Văn phòng';
        } else if (type.includes('cửa hàng') || type.includes('retail')) {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.COMMERCIAL_RETAIL);
            filterType = 'Cửa hàng';
        } else if (type.includes('khách sạn') || type === 'hotel') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.COMMERCIAL_HOTEL);
            filterType = 'Khách sạn';
        } else if (type.includes('kho') || type === 'warehouse') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.INDUSTRIAL_WAREHOUSE);
            filterType = 'Kho bãi';
        } else if (type.includes('nhà máy') || type === 'factory') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.INDUSTRIAL_FACTORY);
            filterType = 'Nhà máy';
        } else if (type.includes('đất ở') || type === 'residential land') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.LAND_RESIDENTIAL);
            filterType = 'Đất ở';
        } else if (type.includes('đất thương mại') || type === 'commercial land') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.LAND_COMMERCIAL);
            filterType = 'Đất thương mại';
        } else if (type.includes('đất nông nghiệp') || type === 'agricultural') {
            filteredProperties = filteredProperties.filter(p => p.type === PropertyType.LAND_AGRICULTURAL);
            filterType = 'Đất nông nghiệp';
        }
        // Category filters
        else if (type.includes('nhà ở') || type === 'residential') {
            filteredProperties = filteredProperties.filter(p =>
                p.type === PropertyType.RESIDENTIAL_APARTMENT ||
                p.type === PropertyType.RESIDENTIAL_HOUSE ||
                p.type === PropertyType.RESIDENTIAL_VILLA
            );
            filterType = 'Nhà ở';
        } else if (type.includes('thương mại') || type === 'commercial') {
            filteredProperties = filteredProperties.filter(p =>
                p.type === PropertyType.COMMERCIAL_OFFICE ||
                p.type === PropertyType.COMMERCIAL_RETAIL ||
                p.type === PropertyType.COMMERCIAL_HOTEL
            );
            filterType = 'Thương mại';
        } else if (type.includes('công nghiệp') || type === 'industrial') {
            filteredProperties = filteredProperties.filter(p =>
                p.type === PropertyType.INDUSTRIAL_WAREHOUSE ||
                p.type === PropertyType.INDUSTRIAL_FACTORY
            );
            filterType = 'Công nghiệp';
        } else if (type.includes('đất') || type === 'land') {
            filteredProperties = filteredProperties.filter(p =>
                p.type === PropertyType.LAND_RESIDENTIAL ||
                p.type === PropertyType.LAND_COMMERCIAL ||
                p.type === PropertyType.LAND_AGRICULTURAL
            );
            filterType = 'Đất';
        }
        // Status filters
        else if (type.includes('bán') || type === 'sale') {
            filteredProperties = filteredProperties.filter(p => p.forSale);
            filterType = 'Đang bán';
        } else if (type.includes('thuê') || type === 'rent') {
            filteredProperties = filteredProperties.filter(p => p.forRent);
            filterType = 'Cho thuê';
        } else if (type.includes('của tôi') || type === 'my' || type === 'mine') {
            filteredProperties = filteredProperties.filter(p => p.owner === userId);
            filterType = 'Của tôi';
        } else if (type.includes('trống') || type === 'vacant') {
            filteredProperties = filteredProperties.filter(p => p.owner === null);
            filterType = 'Chưa có chủ';
        }
        // Location filters (exact match)
        else {
            const locationFiltered = filteredProperties.filter(p =>
                p.location.toLowerCase().includes(type) ||
                p.district.toLowerCase().includes(type)
            );

            if (locationFiltered.length > 0) {
                filteredProperties = locationFiltered;
                filterType = `Khu vực "${type}"`;
            }
        }
    }

    // Check for sort parameter (third argument)
    if (args.length >= 3) {
        const sortParam = args[2].toLowerCase();

        if (sortParam.includes('giá') || sortParam === 'price') {
            sortBy = 'price';
        } else if (sortParam.includes('thu nhập') || sortParam === 'income') {
            sortBy = 'income';
        } else if (sortParam.includes('roi') || sortParam === 'return') {
            sortBy = 'roi';
        } else if (sortParam.includes('tăng') || sortParam === 'appreciation') {
            sortBy = 'appreciation';
        }

        // Check for sort order
        if (args.length >= 4) {
            const orderParam = args[3].toLowerCase();
            if (orderParam.includes('giảm') || orderParam === 'desc') {
                sortOrder = 'desc';
            }
        }
    }

    // Sort properties
    filteredProperties.sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return sortOrder === 'asc' ? a.currentPrice - b.currentPrice : b.currentPrice - a.currentPrice;
            case 'income':
                return sortOrder === 'asc' ?
                    (a.income + a.rentalIncome) - (b.income + b.rentalIncome) :
                    (b.income + b.rentalIncome) - (a.income + a.rentalIncome);
            case 'roi':
                const roiA = (a.income + a.rentalIncome) * 12 / a.currentPrice;
                const roiB = (b.income + b.rentalIncome) * 12 / b.currentPrice;
                return sortOrder === 'asc' ? roiA - roiB : roiB - roiA;
            case 'appreciation':
                const appA = a.currentPrice / a.basePrice;
                const appB = b.currentPrice / b.basePrice;
                return sortOrder === 'asc' ? appA - appB : appB - appA;
            default:
                return sortOrder === 'asc' ? a.currentPrice - b.currentPrice : b.currentPrice - a.currentPrice;
        }
    });

    // Format header text based on filters and sorting
    let sortText = '';
    switch (sortBy) {
        case 'price':
            sortText = `Sắp xếp theo giá ${sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}`;
            break;
        case 'income':
            sortText = `Sắp xếp theo thu nhập ${sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}`;
            break;
        case 'roi':
            sortText = `Sắp xếp theo ROI ${sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}`;
            break;
        case 'appreciation':
            sortText = `Sắp xếp theo tăng giá ${sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}`;
            break;
    }

    let listText = `📋 DANH SÁCH BẤT ĐỘNG SẢN${filterType ? ` (${filterType})` : ''}\n`;
    if (sortText) {
        listText += `📊 ${sortText}\n`;
    }
    listText += `\n`;

    if (filteredProperties.length === 0) {
        listText += `❌ Không tìm thấy bất động sản nào${filterType ? ` loại ${filterType}` : ''}.`;
    } else {
        // Current page support (simplified pagination)
        const pageSize = 10;
        let page = 1;

        if (args.length >= 4 && args[3].toLowerCase().includes('trang')) {
            const pageNum = parseInt(args[3].replace(/[^\d]/g, ''));
            if (!isNaN(pageNum) && pageNum > 0) {
                page = pageNum;
            }
        } else if (args.length >= 5 && args[4].toLowerCase().includes('trang')) {
            const pageNum = parseInt(args[4].replace(/[^\d]/g, ''));
            if (!isNaN(pageNum) && pageNum > 0) {
                page = pageNum;
            }
        }

        const startIdx = (page - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, filteredProperties.length);
        const paginatedProperties = filteredProperties.slice(startIdx, endIdx);

        paginatedProperties.forEach((property, index) => {
            const displayIndex = startIdx + index + 1;

            const statusText = property.owner
                ? (property.owner === userId
                    ? '✓ Sở hữu'
                    : (property.forSale ? '⭐ Đang bán' : '✗ Đã bán'))
                : '⭐ Đang bán';

            const price = property.forSale ? property.salePrice : property.currentPrice;

            listText += `${displayIndex}. ${property.name} [ID: ${property.id}]\n`;
            listText += `   💰 ${formatCurrency(price)} | 📍 ${property.location} | 🏠 ${property.size}m²\n`;

            // Show ROI for income-generating properties
            if (property.income > 0 || property.rentalIncome > 0) {
                const monthlyIncome = property.income + property.rentalIncome;
                const roi = (monthlyIncome * 12 / price) * 100;
                listText += `   💸 Thu nhập: ${formatCurrency(monthlyIncome)}/tháng | 📊 ROI: ${roi.toFixed(1)}%/năm\n`;
            }

            // Show appreciation
            const appreciation = ((property.currentPrice / property.basePrice) - 1) * 100;
            const appreciationText = appreciation >= 0 ?
                `Tăng giá: +${appreciation.toFixed(1)}%` :
                `Giảm giá: ${appreciation.toFixed(1)}%`;

            listText += `   📈 ${appreciationText} | 🏠 ${getPropertyTypeLabel(property.type)} | ${statusText}\n`;

            if (property.forSale && property.owner !== userId) {
                listText += `   💡 Mua: /bds mua ${property.id}\n`;
            }

            if (property.forRent && !property.tenants.includes(userId)) {
                listText += `   💡 Thuê: /bds thuê ${property.id}\n`;
            }

            listText += `\n`;
        });

        // Pagination info
        const totalPages = Math.ceil(filteredProperties.length / pageSize);
        listText += `📄 Trang ${page}/${totalPages} (${filteredProperties.length} bất động sản)\n\n`;

        // Navigation help
        if (totalPages > 1) {
            listText += `💡 Xem trang tiếp theo: /bds danh sách`;
            if (filterType) {
                listText += ` ${args[1]}`;
            }
            if (sortBy !== 'price' || sortOrder !== 'asc') {
                listText += ` ${sortBy} ${sortOrder}`;
            }
            listText += ` trang ${page + 1}\n\n`;
        }

        listText += `💡 Để xem thông tin chi tiết một bất động sản, hãy dùng lệnh:\n/bds thông tin [id]`;
    }

    await message.reply(listText);
}

// List projects
async function listProjects(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    // Check for specific project
    if (args.length >= 2 && args[1] !== 'list' && args[1] !== 'danh' && args[1] !== 'xem') {
        const projectId = args[1];
        const project = gameData.projectDevelopments.find(p => p.id === projectId);

        if (project) {
            await showProjectDetails(userId, project, replyTo, isGroup);
            return;
        }
    }

    // Get filter type if any
    let filterType = null;
    let filteredProjects = [...gameData.projectDevelopments];

    if (args.length >= 3) {
        const filter = args[2].toLowerCase();

        switch (filter) {
            case 'planning':
            case 'quyhoach':
                filterType = ProjectStatus.PLANNING;
                break;
            case 'construction':
            case 'xaydung':
                filterType = ProjectStatus.CONSTRUCTION;
                break;
            case 'completed':
            case 'hoanthanh':
                filterType = ProjectStatus.COMPLETED;
                break;
            case 'selling':
            case 'dangban':
                filterType = ProjectStatus.SELLING;
                break;
            case 'my':
            case 'mine':
            case 'invested':
                // Filter projects user has invested in
                filteredProjects = filteredProjects.filter(project =>
                    project.investors.some(inv => inv.userId === userId)
                );
                break;
        }

        if (filterType) {
            filteredProjects = filteredProjects.filter(p => p.status === filterType);
        }
    }

    // Sort projects: first by user's investments, then by completion percentage descending
    filteredProjects.sort((a, b) => {
        const aInvested = a.investors.some(inv => inv.userId === userId);
        const bInvested = b.investors.some(inv => inv.userId === userId);

        if (aInvested && !bInvested) return -1;
        if (!aInvested && bInvested) return 1;

        return b.completionPercentage - a.completionPercentage;
    });

    let projectsText = `🏗️ DANH SÁCH DỰ ÁN BẤT ĐỘNG SẢN\n\n`;

    if (filteredProjects.length === 0) {
        projectsText += `❌ Không tìm thấy dự án nào.`;
    } else {
        filteredProjects.forEach((project, index) => {
            // Check if user has invested in this project
            const userInvestment = project.investors.find(inv => inv.userId === userId);
            const investedMark = userInvestment ? `💼 Đã đầu tư` : '';

            projectsText += `${index + 1}. ${project.name} [ID: ${project.id}] ${investedMark}\n`;
            projectsText += `   📍 ${project.location} | 🏠 ${getPropertyTypeLabel(project.type)}\n`;
            projectsText += `   ⏳ Hoàn thành: ${project.completionPercentage.toFixed(1)}% | 📊 Trạng thái: ${getProjectStatusLabel(project.status)}\n`;
            projectsText += `   🏠 Đã bán: ${project.soldUnits}/${project.totalUnits} căn\n`;

            if (userInvestment) {
                const returnMultiplier = 1 + (project.completionPercentage / 100);
                const estimatedReturn = Math.round(userInvestment.investment * returnMultiplier);

                projectsText += `   💰 Đầu tư: ${formatCurrency(userInvestment.investment)} | 📈 Giá trị ước tính: ${formatCurrency(estimatedReturn)}\n`;
            } else if (project.status !== ProjectStatus.SOLD_OUT) {
                projectsText += `   💰 Giá căn hộ: ${formatCurrency(project.basePrice)}\n`;
                projectsText += `   💡 Để đầu tư: /bds đầu tư ${project.id} [số tiền]\n`;
            }

            projectsText += `   💡 Xem chi tiết: /bds dự án ${project.id}\n\n`;

            // Only show 10 projects at a time
            if (index >= 9 && filteredProjects.length > 10) {
                projectsText += `\n... và ${filteredProjects.length - 10} dự án khác\n`;
                return;
            }
        });

        projectsText += `\n💡 Để đầu tư vào dự án, sử dụng lệnh:\n/bds đầu tư [id_dự_án] [số tiền]`;
    }

    await message.reply(projectsText);
}

// Show project details
async function showProjectDetails(userId, project, message) {
    // Check if user has invested in this project
    const userInvestment = project.investors.find(inv => inv.userId === userId);

    // Calculate time remaining
    const now = Date.now();
    const daysRemaining = Math.ceil((project.estimatedCompletionDate - now) / (24 * 60 * 60 * 1000));

    // Calculate project financial metrics
    const totalInvestment = project.investors.reduce((sum, inv) => sum + inv.investment, 0);
    const estimatedTotalValue = project.basePrice * project.totalUnits;
    const soldValue = project.basePrice * project.soldUnits;
    const remainingValue = project.basePrice * (project.totalUnits - project.soldUnits);

    let detailText = `🏗️ CHI TIẾT DỰ ÁN\n\n`;

    // Basic project information
    detailText += `📝 THÔNG TIN CHUNG:\n`;
    detailText += `- Tên dự án: ${project.name}\n`;
    detailText += `- Mô tả: ${project.description}\n`;
    detailText += `- Vị trí: ${project.location}\n`;
    detailText += `- Loại hình: ${getPropertyTypeLabel(project.type)}\n`;
    detailText += `- Trạng thái: ${getProjectStatusLabel(project.status)}\n`;
    detailText += `- Hoàn thành: ${project.completionPercentage.toFixed(1)}%\n`;

    if (daysRemaining > 0) {
        detailText += `- Thời gian còn lại: ${daysRemaining} ngày\n`;
    } else if (project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.SOLD_OUT) {
        detailText += `- Dự kiến hoàn thành: Trễ ${-daysRemaining} ngày\n`;
    }

    detailText += `- Giai đoạn: ${project.currentPhase}/${project.totalPhases}\n\n`;

    // Financial information
    detailText += `💰 THÔNG TIN TÀI CHÍNH:\n`;
    detailText += `- Tổng số căn: ${project.totalUnits}\n`;
    detailText += `- Đã bán: ${project.soldUnits} căn (${(project.soldUnits / project.totalUnits * 100).toFixed(1)}%)\n`;
    detailText += `- Giá mỗi căn: ${formatCurrency(project.basePrice)}\n`;
    detailText += `- Tổng giá trị dự án: ${formatCurrency(estimatedTotalValue)}\n`;
    detailText += `- Giá trị đã bán: ${formatCurrency(soldValue)}\n`;
    detailText += `- Giá trị còn lại: ${formatCurrency(remainingValue)}\n`;

    if (project.developerId !== 'system') {
        const developer = gameData.accounts[project.developerId];
        detailText += `- Nhà phát triển: ${developer?.username || 'Không xác định'}\n`;
    }

    detailText += `- Tổng vốn đầu tư: ${formatCurrency(totalInvestment)}\n`;
    detailText += `- Số nhà đầu tư: ${project.investors.length}\n\n`;

    // User investment information
    if (userInvestment) {
        detailText += `💼 ĐẦU TƯ CỦA BẠN:\n`;
        detailText += `- Số vốn đầu tư: ${formatCurrency(userInvestment.investment)}\n`;

        // Calculate estimated current value
        const returnMultiplier = 1 + (project.completionPercentage / 100);
        const estimatedReturn = Math.round(userInvestment.investment * returnMultiplier);
        const profit = estimatedReturn - userInvestment.investment;

        detailText += `- Giá trị hiện tại: ${formatCurrency(estimatedReturn)}\n`;
        detailText += `- Lợi nhuận: ${formatCurrency(profit)} (${(profit / userInvestment.investment * 100).toFixed(1)}%)\n`;

        // Calculate ROI projections
        if (project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.SOLD_OUT) {
            const projectedFinalValue = userInvestment.investment * 2; // Simplified: 100% ROI at completion
            detailText += `- Giá trị dự kiến khi hoàn thành: ${formatCurrency(projectedFinalValue)}\n`;
        }

        detailText += `\n`;
    }

    // Project timeline
    detailText += `📅 TIẾN ĐỘ DỰ ÁN:\n`;

    // Display progress visualization
    const progressBar = generateProgressBar(project.completionPercentage, 20);
    detailText += `- Tiến độ: ${progressBar} ${project.completionPercentage.toFixed(1)}%\n`;

    // Show key milestones
    if (project.status === ProjectStatus.PLANNING) {
        detailText += `- Đang trong giai đoạn quy hoạch và thiết kế\n`;
    } else if (project.status === ProjectStatus.PERMITS) {
        detailText += `- Đang xin giấy phép xây dựng\n`;
    } else if (project.status === ProjectStatus.CONSTRUCTION) {
        detailText += `- Đang xây dựng (Giai đoạn ${project.currentPhase}/${project.totalPhases})\n`;
    } else if (project.status === ProjectStatus.FINISHING) {
        detailText += `- Đang hoàn thiện công trình\n`;
    } else if (project.status === ProjectStatus.COMPLETED) {
        detailText += `- Đã hoàn thành xây dựng\n`;
    }

    // Display start and estimated completion dates
    const startDate = new Date(project.startDate).toLocaleDateString('vi-VN');
    const completionDate = new Date(project.estimatedCompletionDate).toLocaleDateString('vi-VN');

    detailText += `- Ngày khởi công: ${startDate}\n`;
    detailText += `- Dự kiến hoàn thành: ${completionDate}\n\n`;

    // Investment opportunities
    if (project.status !== ProjectStatus.SOLD_OUT) {
        detailText += `💼 CƠ HỘI ĐẦU TƯ:\n`;

        if (!userInvestment) {
            detailText += `- Vốn đầu tư tối thiểu: ${formatCurrency(project.basePrice * 0.1)}\n`;
            detailText += `- Lợi nhuận dự kiến: 50-100% khi dự án hoàn thành\n`;
            detailText += `- Để đầu tư: /bds đầu tư ${project.id} [số tiền]\n`;
        } else {
            detailText += `- Bạn đã đầu tư vào dự án này\n`;
            detailText += `- Để đầu tư thêm: /bds đầu tư ${project.id} [số tiền]\n`;
        }
    }

    await message.reply(detailText);
}

// Generate text-based progress bar
function generateProgressBar(percentage, length) {
    const filledLength = Math.round(length * (percentage / 100));
    const emptyLength = length - filledLength;

    return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
}

// Invest in project
async function investInProject(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID dự án và số tiền muốn đầu tư. Ví dụ: /bds đầu tư abc123 500tr'
        );
        return;
    }

    const projectId = args[1];
    const project = gameData.projectDevelopments.find(p => p.id === projectId);

    if (!project) {
        await message.reply(
            'Không tìm thấy dự án với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (project.status === ProjectStatus.SOLD_OUT) {
        await message.reply(
            'Dự án này đã bán hết, không còn nhận đầu tư.'
        );
        return;
    }

    // Parse investment amount
    const amount = parseCurrencyAmount(args[2]);

    if (isNaN(amount) || amount <= 0) {
        await message.reply(
            'Số tiền không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    // Check minimum investment (10% of a unit)
    const minInvestment = Math.round(project.basePrice * 0.1);
    if (amount < minInvestment) {
        await message.reply(
            `Số tiền đầu tư tối thiểu là ${formatCurrency(minInvestment)} (10% giá trị một căn).`
        );
        return;
    }

    const account = gameData.accounts[userId];

    if (account.balance < amount) {
        await message.reply(
            `Số dư không đủ. Bạn chỉ có ${formatCurrency(account.balance)}`
        );
        return;
    }

    // Check if user has already invested in this project
    const existingInvestment = project.investors.find(inv => inv.userId === userId);

    // Deduct investment from balance
    account.balance -= amount;
    account.lastActivity = Date.now();

    // Add investment to project
    if (existingInvestment) {
        existingInvestment.investment += amount;
    } else {
        project.investors.push({
            userId,
            investment: amount
        });
    }

    // Create transaction
    addTransaction(
        TransactionType.INVESTMENT,
        userId,
        null,
        null,
        amount,
        `Đầu tư vào dự án ${project.name}`,
        null,
        project.id
    );

    // Add experience points
    account.experience += Math.floor(amount / 10000000); // 1 XP per 10M invested
    checkLevelUp(account);

    saveGameData(gameData);

    const totalInvestment = existingInvestment ?
        existingInvestment.investment + amount :
        amount;

    await message.reply(
        `✅ Đầu tư vào dự án thành công!\n\n` +
        `🏗️ Dự án: ${project.name}\n` +
        `💰 Số tiền đầu tư: ${formatCurrency(amount)}\n` +
        `💼 Tổng đầu tư của bạn: ${formatCurrency(totalInvestment)}\n` +
        `⏳ Tiến độ dự án: ${project.completionPercentage.toFixed(1)}%\n` +
        `📈 Lợi nhuận dự kiến: 50-100% khi dự án hoàn thành\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Handle partnerships
async function handlePartnership(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    const account = gameData.accounts[userId];

    // Check for business license
    if (!account.businessLicense) {
        await message.reply(
            'Bạn cần có giấy phép kinh doanh để quản lý hợp tác đầu tư. Đạt cấp độ 5 để mở khóa tính năng này.'
        );
        return;
    }

    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    if (args.length < 2) {
        // Show partnerships list by default
        await listPartnerships(userId, message);
        return;
    }

    const operation = args[1].toLowerCase();

    switch (operation) {
        case 'tạo':
        case 'tao':
        case 'create':
            await createPartnership(userId, args, message);
            break;

        case 'tham gia':
        case 'thamgia':
        case 'join':
            await joinPartnership(userId, args, message);
            break;

        case 'danh sách':
        case 'danhsach':
        case 'ds':
        case 'list':
            await listPartnerships(userId, message);
            break;

        case 'thông tin':
        case 'thongtin':
        case 'info':
            await partnershipInfo(userId, args, message);
            break;

        case 'rút':
        case 'rut':
        case 'withdraw':
            await withdrawFromPartnership(userId, args, message);
            break;

        default:
            await listPartnerships(userId, message);
            break;
    }
}

// List partnerships
async function listPartnerships(userId, message) {
    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    // Find partnerships user is part of
    const userPartnerships = gameData.partnerships.filter(p =>
        p.partners.some(partner => partner.userId === userId)
    );

    // Find active partnerships user can join
    const availablePartnerships = gameData.partnerships.filter(p =>
        p.active && !p.partners.some(partner => partner.userId === userId)
    );

    let partnershipText = `💼 HỢP TÁC ĐẦU TƯ BẤT ĐỘNG SẢN\n\n`;

    // Show user's partnerships
    if (userPartnerships.length > 0) {
        partnershipText += `📋 HỢP TÁC CỦA BẠN:\n`;

        userPartnerships.forEach((partnership, index) => {
            const userEquity = partnership.partners.find(p => p.userId === userId)?.equity || 0;
            const totalEquity = partnership.partners.reduce((sum, p) => sum + p.equity, 0);
            const equityPercentage = (userEquity / totalEquity * 100).toFixed(1);

            partnershipText += `${index + 1}. ${partnership.name} [ID: ${partnership.id}]\n`;
            partnershipText += `   👥 Số thành viên: ${partnership.partners.length}\n`;
            partnershipText += `   💼 Phần vốn của bạn: ${equityPercentage}%\n`;
            partnershipText += `   🏠 Số dự án: ${partnership.projects.length}, Số BĐS: ${partnership.properties.length}\n`;
            partnershipText += `   💡 Xem chi tiết: /bds hợp tác thông tin ${partnership.id}\n\n`;
        });
    } else {
        partnershipText += `📋 Bạn chưa tham gia hợp tác đầu tư nào.\n\n`;
    }

    // Show available partnerships
    if (availablePartnerships.length > 0) {
        partnershipText += `🔍 CÁC HỢP TÁC CÓ THỂ THAM GIA:\n`;

        availablePartnerships.forEach((partnership, index) => {
            partnershipText += `${index + 1}. ${partnership.name} [ID: ${partnership.id}]\n`;
            partnershipText += `   👥 Số thành viên: ${partnership.partners.length}\n`;
            partnershipText += `   🏠 Số dự án: ${partnership.projects.length}, Số BĐS: ${partnership.properties.length}\n`;
            partnershipText += `   💡 Tham gia: /bds hợp tác tham gia ${partnership.id} [số vốn]\n\n`;
        });
    }

    // Help text
    partnershipText += `💡 HƯỚNG DẪN:\n`;
    partnershipText += `- Tạo hợp tác mới: /bds hợp tác tạo [tên] [số vốn]\n`;
    partnershipText += `- Tham gia hợp tác: /bds hợp tác tham gia [id] [số vốn]\n`;
    partnershipText += `- Xem chi tiết: /bds hợp tác thông tin [id]\n`;

    await message.reply(partnershipText);
}

// Create new partnership
async function createPartnership(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập tên hợp tác và số vốn góp. Ví dụ: /bds hợp tác tạo "Đầu tư ABC" 500tr'
        );
        return;
    }

    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    // Parse partnership name
    let partnershipName = args[2];
    let capitalIndex = 3;

    // Handle quoted names
    if (partnershipName.startsWith('"') && !partnershipName.endsWith('"')) {
        // Find the closing quote
        let nameBuilder = [partnershipName];
        for (let i = 3; i < args.length; i++) {
            nameBuilder.push(args[i]);
            if (args[i].endsWith('"')) {
                capitalIndex = i + 1;
                break;
            }
        }
        partnershipName = nameBuilder.join(' ').replace(/"/g, '');
    }

    if (capitalIndex >= args.length) {
        await message.reply(
            'Vui lòng nhập số vốn góp. Ví dụ: /bds hợp tác tạo "Đầu tư ABC" 500tr'
        );
        return;
    }

    // Parse capital contribution
    const amount = parseCurrencyAmount(args[capitalIndex]);

    if (isNaN(amount) || amount <= 0) {
        await message.reply(
            'Số vốn góp không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    // Check minimum contribution
    const minContribution = 100000000; // 100M VND
    if (amount < minContribution) {
        await message.reply(
            `Số vốn góp tối thiểu là ${formatCurrency(minContribution)} để thành lập hợp tác.`
        );
        return;
    }

    const account = gameData.accounts[userId];

    if (account.balance < amount) {
        await message.reply(
            `Số dư không đủ. Bạn chỉ có ${formatCurrency(account.balance)}`
        );
        return;
    }

    // Deduct capital from balance
    account.balance -= amount;
    account.lastActivity = Date.now();

    // Create new partnership
    const partnership = {
        id: generateId(),
        name: partnershipName,
        partners: [{
            userId,
            equity: amount
        }],
        projects: [],
        properties: [],
        capitalContributed: [{
            userId,
            amount
        }],
        profitDistribution: [{
            userId,
            percentage: 100
        }],
        createdAt: Date.now(),
        active: true
    };

    // Add partnership to game data
    gameData.partnerships.push(partnership);

    // Create transaction
    addTransaction(
        TransactionType.PARTNERSHIP_CONTRIBUTION,
        userId,
        null,
        null,
        amount,
        `Góp vốn thành lập hợp tác đầu tư "${partnershipName}"`
    );

    // Add experience points
    account.experience += Math.floor(amount / 5000000); // 1 XP per 5M contributed
    checkLevelUp(account);

    saveGameData(gameData);

    await message.reply(
        `✅ Đã thành lập hợp tác đầu tư thành công!\n\n` +
        `💼 Tên hợp tác: ${partnershipName}\n` +
        `💰 Vốn góp: ${formatCurrency(amount)}\n` +
        `📊 Tỷ lệ sở hữu: 100%\n\n` +
        `💡 Hãy mời người khác tham gia bằng cách chia sẻ:\n` +
        `/bds hợp tác tham gia ${partnership.id} [số vốn]\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Join existing partnership
async function joinPartnership(userId, args, message) {
    if (args.length < 4) {
        await message.reply(
            'Vui lòng nhập ID hợp tác và số vốn góp. Ví dụ: /bds hợp tác tham gia abc123 200tr'
        );
        return;
    }

    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    const partnershipId = args[2];
    const partnership = gameData.partnerships.find(p => p.id === partnershipId);

    if (!partnership) {
        await message.reply(
            'Không tìm thấy hợp tác đầu tư với ID này.'
        );
        return;
    }

    if (!partnership.active) {
        await message.reply(
            'Hợp tác đầu tư này không còn nhận thêm thành viên.'
        );
        return;
    }

    // Check if user is already a partner
    if (partnership.partners.some(p => p.userId === userId)) {
        await message.reply(
            'Bạn đã là thành viên của hợp tác đầu tư này rồi.'
        );
        return;
    }

    // Parse capital contribution
    const amount = parseCurrencyAmount(args[3]);

    if (isNaN(amount) || amount <= 0) {
        await message.reply(
            'Số vốn góp không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    // Check minimum contribution
    const totalPartnershipCapital = partnership.partners.reduce((sum, p) => sum + p.equity, 0);
    const minContribution = Math.max(50000000, totalPartnershipCapital * 0.05); // 50M VND or 5% of total

    if (amount < minContribution) {
        await message.reply(
            `Số vốn góp tối thiểu là ${formatCurrency(minContribution)} để tham gia hợp tác này.`
        );
        return;
    }

    const account = gameData.accounts[userId];

    if (account.balance < amount) {
        await message.reply(
            `Số dư không đủ. Bạn chỉ có ${formatCurrency(account.balance)}`
        );
        return;
    }

    // Deduct capital from balance
    account.balance -= amount;
    account.lastActivity = Date.now();

    // Add user to partnership
    partnership.partners.push({
        userId,
        equity: amount
    });

    partnership.capitalContributed.push({
        userId,
        amount
    });

    // Recalculate profit distribution
    const newTotalCapital = partnership.partners.reduce((sum, p) => sum + p.equity, 0);
    partnership.profitDistribution = partnership.partners.map(partner => ({
        userId: partner.userId,
        percentage: (partner.equity / newTotalCapital) * 100
    }));

    // Create transaction
    addTransaction(
        TransactionType.PARTNERSHIP_CONTRIBUTION,
        userId,
        null,
        null,
        amount,
        `Góp vốn tham gia hợp tác đầu tư "${partnership.name}"`
    );

    // Add experience points
    account.experience += Math.floor(amount / 5000000); // 1 XP per 5M contributed
    checkLevelUp(account);

    saveGameData(gameData);

    // Calculate user's equity percentage
    const equityPercentage = (amount / newTotalCapital * 100).toFixed(1);

    await message.reply(
        `✅ Đã tham gia hợp tác đầu tư thành công!\n\n` +
        `💼 Tên hợp tác: ${partnership.name}\n` +
        `💰 Vốn góp: ${formatCurrency(amount)}\n` +
        `📊 Tỷ lệ sở hữu: ${equityPercentage}%\n` +
        `👥 Số thành viên: ${partnership.partners.length}\n\n` +
        `💡 Xem chi tiết hợp tác bằng lệnh:\n` +
        `/bds hợp tác thông tin ${partnership.id}\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Display partnership information
async function partnershipInfo(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID hợp tác đầu tư. Ví dụ: /bds hợp tác thông tin abc123'
        );
        return;
    }

    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    const partnershipId = args[2];
    const partnership = gameData.partnerships.find(p => p.id === partnershipId);

    if (!partnership) {
        await message.reply(
            'Không tìm thấy hợp tác đầu tư với ID này.'
        );
        return;
    }

    // Check if user is a partner
    const isPartner = partnership.partners.some(p => p.userId === userId);

    if (!isPartner) {
        await message.reply(
            'Bạn không phải là thành viên của hợp tác đầu tư này.'
        );
        return;
    }

    // Calculate partnership metrics
    const totalCapital = partnership.partners.reduce((sum, p) => sum + p.equity, 0);
    const userEquity = partnership.partners.find(p => p.userId === userId)?.equity || 0;
    const userPercentage = (userEquity / totalCapital * 100).toFixed(1);

    // Calculate portfolio value
    let propertyValue = 0;
    let propertyIncome = 0;

    partnership.properties.forEach(propId => {
        const property = gameData.properties.find(p => p.id === propId);
        if (property) {
            propertyValue += property.currentPrice;
            propertyIncome += property.income + property.rentalIncome;
        }
    });

    // Calculate project value
    let projectValue = 0;
    let projectsCount = partnership.projects.length;

    partnership.projects.forEach(projId => {
        const project = gameData.projectDevelopments.find(p => p.id === projId);
        if (project) {
            // Simplified project valuation: base value * completion percentage * 1.5
            const projectEstimate = project.basePrice * project.totalUnits * (project.completionPercentage / 100) * 1.5;
            projectValue += projectEstimate;
        }
    });

    // Total portfolio value
    const totalValue = totalCapital + propertyValue + projectValue;

    // Calculate ROI
    const totalROI = ((totalValue / totalCapital) - 1) * 100;

    let infoText = `💼 THÔNG TIN HỢP TÁC ĐẦU TƯ\n\n`;

    // Basic information
    infoText += `📝 THÔNG TIN CHUNG:\n`;
    infoText += `- Tên hợp tác: ${partnership.name}\n`;
    infoText += `- ID: ${partnership.id}\n`;
    infoText += `- Ngày thành lập: ${new Date(partnership.createdAt).toLocaleDateString('vi-VN')}\n`;
    infoText += `- Trạng thái: ${partnership.active ? 'Đang hoạt động' : 'Đã đóng'}\n`;
    infoText += `- Số thành viên: ${partnership.partners.length}\n\n`;

    // Financial information
    infoText += `💰 THÔNG TIN TÀI CHÍNH:\n`;
    infoText += `- Tổng vốn góp: ${formatCurrency(totalCapital)}\n`;
    infoText += `- Vốn góp của bạn: ${formatCurrency(userEquity)} (${userPercentage}%)\n`;
    infoText += `- Giá trị bất động sản: ${formatCurrency(propertyValue)}\n`;
    infoText += `- Giá trị dự án: ${formatCurrency(projectValue)}\n`;
    infoText += `- Tổng giá trị: ${formatCurrency(totalValue)}\n`;
    infoText += `- ROI: ${totalROI >= 0 ? '+' : ''}${totalROI.toFixed(1)}%\n`;
    infoText += `- Thu nhập hàng tháng: ${formatCurrency(propertyIncome)}\n\n`;

    // Assets
    if (partnership.properties.length > 0) {
        infoText += `🏠 BẤT ĐỘNG SẢN:\n`;

        // Get property details
        var properties = partnership.properties.map(function (propId) {
            for (var i = 0; i < gameData.properties.length; i++) {
                if (gameData.properties[i].id === propId) {
                    return gameData.properties[i];
                }
            }
            return undefined;
        }).filter(function (p) {
            return p !== undefined;
        });


        properties.slice(0, 5).forEach((property, index) => {
            infoText += `${index + 1}. ${property.name}\n`;
            infoText += `   💰 Giá trị: ${formatCurrency(property.currentPrice)}\n`;
            infoText += `   💸 Thu nhập: ${formatCurrency(property.income + property.rentalIncome)}/tháng\n`;
        });

        if (properties.length > 5) {
            infoText += `... và ${properties.length - 5} bất động sản khác\n`;
        }

        infoText += `\n`;
    }

    if (partnership.projects.length > 0) {
        infoText += `🏗️ DỰ ÁN:\n`;

        // Get project details
        var projects = partnership.projects.map(function (projId) {
            for (var i = 0; i < gameData.projectDevelopments.length; i++) {
                if (gameData.projectDevelopments[i].id === projId) {
                    return gameData.projectDevelopments[i];
                }
            }
            return undefined;
        }).filter(function (p) {
            return p !== undefined;
        });

        projects.slice(0, 5).forEach((project, index) => {
            infoText += `${index + 1}. ${project.name}\n`;
            infoText += `   ⏳ Hoàn thành: ${project.completionPercentage.toFixed(1)}%\n`;
            infoText += `   📊 Trạng thái: ${getProjectStatusLabel(project.status)}\n`;
        });

        if (projects.length > 5) {
            infoText += `... và ${projects.length - 5} dự án khác\n`;
        }

        infoText += `\n`;
    }

    // Partners
    infoText += `👥 THÀNH VIÊN:\n`;

    // Sort partners by equity (descending)
    const sortedPartners = [...partnership.partners].sort((a, b) => b.equity - a.equity);

    sortedPartners.forEach((partner, index) => {
        const partnerAccount = gameData.accounts[partner.userId];
        const percentage = (partner.equity / totalCapital * 100).toFixed(1);

        infoText += `${index + 1}. ${partnerAccount.username}: ${formatCurrency(partner.equity)} (${percentage}%)\n`;
    });

    await message.reply(infoText);
}

// Withdraw from partnership
async function withdrawFromPartnership(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID hợp tác đầu tư. Ví dụ: /bds hợp tác rút abc123'
        );
        return;
    }

    // Initialize partnerships array if it doesn't exist
    if (!gameData.partnerships) {
        gameData.partnerships = [];
    }

    const partnershipId = args[2];
    const partnership = gameData.partnerships.find(p => p.id === partnershipId);

    if (!partnership) {
        await message.reply(
            'Không tìm thấy hợp tác đầu tư với ID này.'
        );
        return;
    }

    // Check if user is a partner
    const partnerIndex = partnership.partners.findIndex(p => p.userId === userId);

    if (partnerIndex === -1) {
        await message.reply(
            'Bạn không phải là thành viên của hợp tác đầu tư này.'
        );
        return;
    }

    // Check if partnership is active
    if (!partnership.active) {
        await message.reply(
            'Hợp tác đầu tư này đã đóng, không thể rút vốn.'
        );
        return;
    }

    const account = gameData.accounts[userId];
    const userEquity = partnership.partners[partnerIndex].equity;

    // Check if partnership has active projects
    if (partnership.projects.length > 0) {
        await message.reply(
            'Không thể rút vốn khi hợp tác đang có dự án đầu tư đang hoạt động.'
        );
        return;
    }

    // Check if partnership has properties
    if (partnership.properties.length > 0) {
        await message.reply(
            'Không thể rút vốn khi hợp tác đang sở hữu bất động sản. Cần bán hết tài sản trước.'
        );
        return;
    }

    // Process withdrawal
    account.balance += userEquity;
    account.lastActivity = Date.now();

    // Create transaction
    addTransaction(
        TransactionType.PARTNERSHIP_DISTRIBUTION,
        null,
        userId,
        null,
        userEquity,
        `Rút vốn từ hợp tác đầu tư "${partnership.name}"`
    );

    // Remove user from partnership
    partnership.partners.splice(partnerIndex, 1);

    // Update profit distribution
    if (partnership.partners.length > 0) {
        const newTotalCapital = partnership.partners.reduce((sum, p) => sum + p.equity, 0);
        partnership.profitDistribution = partnership.partners.map(partner => ({
            userId: partner.userId,
            percentage: (partner.equity / newTotalCapital) * 100
        }));
    } else {
        // If no partners left, close the partnership
        partnership.active = false;
    }

    saveGameData(gameData);

    await message.reply(
        `✅ Đã rút vốn từ hợp tác đầu tư thành công!\n\n` +
        `💼 Tên hợp tác: ${partnership.name}\n` +
        `💰 Số tiền nhận về: ${formatCurrency(userEquity)}\n` +
        `👥 Số thành viên còn lại: ${partnership.partners.length}\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Get project status label
function getProjectStatusLabel(status) {
    switch (status) {
        case ProjectStatus.PLANNING:
            return 'Quy hoạch';
        case ProjectStatus.PERMITS:
            return 'Xin phép';
        case ProjectStatus.CONSTRUCTION:
            return 'Xây dựng';
        case ProjectStatus.FINISHING:
            return 'Hoàn thiện';
        case ProjectStatus.COMPLETED:
            return 'Hoàn thành';
        case ProjectStatus.SELLING:
            return 'Đang bán';
        case ProjectStatus.SOLD_OUT:
            return 'Đã bán hết';
        default:
            return status;
    }
}

// Buy property
async function buyProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn mua. Ví dụ: /bds mua abc123'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (!property.forSale) {
        await message.reply(
            'Bất động sản này không được rao bán.'
        );
        return;
    }

    if (property.owner === userId) {
        await message.reply(
            'Bạn đã sở hữu bất động sản này rồi.'
        );
        return;
    }

    const account = gameData.accounts[userId];
    const price = property.salePrice || property.currentPrice;

    if (account.balance < price) {
        // Check if user can afford with mortgage
        const maxLoanAmount = price * 0.7; // 70% LTV
        const downPayment = price - maxLoanAmount;

        if (account.balance >= downPayment) {
            await message.reply(
                `Số dư không đủ để mua trực tiếp. Bạn có thể vay thế chấp với khoản trả trước ${formatCurrency(downPayment)}.\n\nSử dụng lệnh: /bds vay ${Math.round(maxLoanAmount)} ${propertyId}`
            );
        } else {
            await message.reply(
                `Số dư không đủ để mua bất động sản này. Bạn cần thêm ${formatCurrency(price - account.balance)}.`
            );
        }
        return;
    }

    // Process transaction
    account.balance -= price;
    account.lastActivity = Date.now();
    account.experience += Math.floor(price / 1000000); // 1 XP per 1 million

    // Transfer ownership
    const previousOwner = property.owner;
    property.owner = userId;
    property.forSale = false;
    property.salePrice = null;

    // Add property to user's owned properties
    account.ownedProperties.push(property.id);

    // Create transaction
    addTransaction(
        TransactionType.PURCHASE,
        userId,
        previousOwner,
        property.id,
        price,
        `Mua ${property.name}`
    );

    // If there was a previous owner, add money to their account
    if (previousOwner && gameData.accounts[previousOwner]) {
        gameData.accounts[previousOwner].balance += price;

        // Add commission transaction if user has business license
        if (userId !== previousOwner && gameData.accounts[previousOwner].businessLicense) {
            const commission = Math.round(price * 0.02); // 2% commission
            gameData.accounts[previousOwner].balance += commission;

            addTransaction(
                TransactionType.COMMISSION,
                null,
                previousOwner,
                property.id,
                commission,
                `Hoa hồng bán ${property.name}`
            );
        }
    }

    // Check for level up
    checkLevelUp(account);

    saveGameData(gameData);

    await message.reply(
        `🎉 Chúc mừng! Bạn đã mua thành công bất động sản:\n\n` +
        `🏠 ${property.name}\n` +
        `📍 ${property.location}, ${property.district}\n` +
        `💰 Giá: ${formatCurrency(price)}\n` +
        `💵 Thu nhập hàng tháng: ${formatCurrency(property.income)}\n\n` +
        `💡 Bạn có thể nâng cấp BĐS để tăng giá trị và thu nhập:\n` +
        `/bds nâng cấp ${property.id}\n\n` +
        `💰 Số dư còn lại: ${formatCurrency(account.balance)}`
    );
}

// Sell property
async function sellProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn bán. Ví dụ: /bds bán abc123 5000000000'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    // Check for active loans using this property as collateral
    const hasActiveLoan = gameData.loans.some(
        loan => loan.active && loan.collateral.includes(propertyId)
    );

    if (hasActiveLoan) {
        await message.reply(
            'Bất động sản này đang được dùng làm tài sản thế chấp cho khoản vay. Vui lòng trả hết khoản vay trước khi bán.'
        );
        return;
    }

    let price;

    if (args.length < 3) {
        // List for sale at current price
        price = property.currentPrice;
    } else {
        // List for sale at specified price
        price = parseCurrencyAmount(args[2]);

        if (isNaN(price) || price <= 0) {
            await message.reply(
                'Giá bán không hợp lệ. Vui lòng nhập một số dương.'
            );
            return;
        }

        // Warn if price is too low (less than 70% of market value)
        if (price < property.marketValue * 0.7) {
            if (args.length < 4 || args[3].toLowerCase() !== 'confirm') {
                await message.reply(
                    `Giá bán thấp hơn nhiều so với giá thị trường (${formatCurrency(property.marketValue)}). Nếu bạn vẫn muốn bán với giá này, hãy xác nhận bằng lệnh:\n/bds bán ${propertyId} ${args[2]} confirm`
                );
                return;
            }
        }
    }

    // List for sale
    property.forSale = true;
    property.salePrice = price;

    // If user is selling below market rate, update current price
    if (price < property.currentPrice) {
        property.currentPrice = price;
    }

    saveGameData(gameData);

    // Calculate profit/loss percentage
    const profitPercent = ((price / property.basePrice) - 1) * 100;
    const profitText = profitPercent >= 0 ?
        `lãi ${formatPercentage(profitPercent)}` :
        `lỗ ${formatPercentage(Math.abs(profitPercent))}`;

    await message.reply(
        `✅ Đã đăng bán bất động sản thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `📍 ${property.location}, ${property.district}\n` +
        `💰 Giá niêm yết: ${formatCurrency(price)}\n` +
        `💵 Giá mua ban đầu: ${formatCurrency(property.basePrice)} (${profitText})\n\n` +
        `💡 Bất động sản của bạn đã được đưa lên thị trường. Những người chơi khác có thể mua bất cứ lúc nào.`
    );
}

// Rent a property
async function rentProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn thuê. Ví dụ: /bds thuê abc123'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (!property.forRent) {
        await message.reply(
            'Bất động sản này không được rao cho thuê.'
        );
        return;
    }

    if (property.owner === userId) {
        await message.reply(
            'Bạn không thể thuê bất động sản của chính mình.'
        );
        return;
    }

    if (property.tenants.includes(userId)) {
        await message.reply(
            'Bạn đã đang thuê bất động sản này rồi.'
        );
        return;
    }

    const account = gameData.accounts[userId];
    const rentalPrice = property.rentalPrice || 0;

    if (rentalPrice <= 0) {
        await message.reply(
            'Giá thuê không hợp lệ. Vui lòng liên hệ chủ sở hữu.'
        );
        return;
    }

    if (account.balance < rentalPrice * 3) {
        await message.reply(
            `Số dư không đủ. Bạn cần ít nhất ${formatCurrency(rentalPrice * 3)} (3 tháng tiền thuê) để ký hợp đồng.`
        );
        return;
    }

    // Process first month payment
    account.balance -= rentalPrice;
    account.lastActivity = Date.now();

    // Add tenant to property
    property.tenants.push(userId);

    // Create transaction
    addTransaction(
        TransactionType.RENTAL_PAYMENT,
        userId,
        property.owner,
        property.id,
        rentalPrice,
        `Thanh toán tiền thuê ${property.name} (tháng đầu)`
    );

    // Add rental income for owner
    if (property.owner && gameData.accounts[property.owner]) {
        gameData.accounts[property.owner].balance += rentalPrice;
    }

    saveGameData(gameData);

    await message.reply(
        `✅ Đã thuê bất động sản thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `📍 ${property.location}, ${property.district}\n` +
        `💰 Giá thuê hàng tháng: ${formatCurrency(rentalPrice)}\n` +
        `📆 Đã thanh toán tháng đầu tiên\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Lease out property
async function leaseProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID bất động sản và giá cho thuê. Ví dụ: /bds cho thuê abc123 10tr'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    // Parse rental price
    const rentalPrice = parseCurrencyAmount(args[2]);

    if (isNaN(rentalPrice) || rentalPrice <= 0) {
        await message.reply(
            'Giá cho thuê không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    // Check if rental price is reasonable (between 0.5% and 2% of property value per month)
    const minRent = property.currentPrice * 0.005;
    const maxRent = property.currentPrice * 0.02;

    if (rentalPrice < minRent || rentalPrice > maxRent) {
        // Warn but allow if the user confirms
        if (args.length < 4 || args[3].toLowerCase() !== 'confirm') {
            await message.reply(
                `Giá cho thuê không nằm trong khoảng hợp lý (${formatCurrency(minRent)} - ${formatCurrency(maxRent)}/tháng). Nếu bạn vẫn muốn cho thuê với giá này, hãy xác nhận bằng lệnh:\n/bds cho thuê ${propertyId} ${args[2]} confirm`
            );
            return;
        }
    }

    // Set property for rent
    property.forRent = true;
    property.rentalPrice = rentalPrice;

    // Update rental income for property
    if (property.tenants.length > 0) {
        property.rentalIncome = rentalPrice;
    }

    saveGameData(gameData);

    // Calculate annual yield
    const annualYield = (rentalPrice * 12 / property.currentPrice) * 100;

    await message.reply(
        `✅ Đã đăng cho thuê bất động sản thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `📍 ${property.location}, ${property.district}\n` +
        `💰 Giá cho thuê: ${formatCurrency(rentalPrice)}/tháng\n` +
        `📊 Lợi suất cho thuê: ${formatPercentage(annualYield)}/năm\n\n` +
        `💡 Bất động sản của bạn đã được đưa lên thị trường cho thuê. Những người chơi khác có thể thuê bất cứ lúc nào.`
    );
}

// Create loan
async function createLoan(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập số tiền muốn vay. Ví dụ: /bds vay 1000000000 propertyId'
        );
        return;
    }

    // Parse amount
    const amount = parseCurrencyAmount(args[1]);

    if (isNaN(amount) || amount <= 0) {
        await message.reply(
            'Số tiền không hợp lệ. Vui lòng nhập một số dương.'
        );
        return;
    }

    // Calculate maximum loan amount (based on owned properties)
    const account = gameData.accounts[userId];
    const ownedProperties = gameData.properties.filter(p => p.owner === userId);

    if (ownedProperties.length === 0) {
        await message.reply(
            'Bạn không sở hữu bất kỳ bất động sản nào để thế chấp. Vui lòng mua bất động sản trước khi vay tiền.'
        );
        return;
    }

    let collateralProperties = [];

    // If property ID is provided, use it as collateral
    if (args.length >= 3) {
        const propertyIds = args.slice(2);

        for (const propId of propertyIds) {
            const property = ownedProperties.find(p => p.id === propId);

            if (!property) {
                await message.reply(
                    `Bạn không sở hữu bất động sản với ID ${propId}. Vui lòng chọn một bất động sản bạn sở hữu làm tài sản thế chấp.`
                );
                return;
            }

            // Check if this property is already used as collateral
            const alreadyCollateral = gameData.loans.some(
                loan => loan.active && loan.collateral.includes(propId)
            );

            if (alreadyCollateral) {
                await message.reply(
                    `Bất động sản ${property.name} đã được dùng làm tài sản thế chấp cho khoản vay khác.`
                );
                return;
            }

            collateralProperties.push(property);
        }
    } else {
        // Choose available properties as collateral
        const availableProperties = ownedProperties.filter(property => {
            return !gameData.loans.some(
                loan => loan.active && loan.collateral.includes(property.id)
            );
        });

        if (availableProperties.length === 0) {
            await message.reply(
                'Tất cả bất động sản của bạn đã được dùng làm tài sản thế chấp cho các khoản vay khác.'
            );
            return;
        }

        // Sort by value descending to use most valuable properties first
        availableProperties.sort((a, b) => b.currentPrice - a.currentPrice);

        // Add properties until we have enough collateral
        let totalCollateralValue = 0;
        const requiredCollateral = amount / 0.7; // 70% LTV ratio

        for (const property of availableProperties) {
            collateralProperties.push(property);
            totalCollateralValue += property.currentPrice;

            if (totalCollateralValue >= requiredCollateral) {
                break;
            }
        }
    }

    // Calculate total collateral value
    const totalCollateralValue = collateralProperties.reduce((sum, property) => sum + property.currentPrice, 0);

    // Check if loan amount is valid (up to 70% of total collateral value)
    const maxLoanAmount = Math.floor(totalCollateralValue * 0.7);

    if (amount > maxLoanAmount) {
        await message.reply(
            `Số tiền vay vượt quá giới hạn cho phép. Với tài sản thế chấp này, bạn chỉ có thể vay tối đa ${formatCurrency(maxLoanAmount)} (70% giá trị).`
        );
        return;
    }

    // Calculate loan terms based on economic conditions
    const baseRate = gameData.economicIndicators.mortgageBaseRate;

    // Adjust rate based on LTV ratio and user's reputation
    const ltvRatio = (amount / totalCollateralValue) * 100;
    const reputationAdjustment = (account.reputationScore - 50) * 0.02;

    let interestRate = baseRate;

    // Higher LTV means higher risk, so higher interest rate
    if (ltvRatio > 60) {
        interestRate += 0.5; // +0.5% for high LTV
    } else if (ltvRatio < 50) {
        interestRate -= 0.5; // -0.5% for low LTV
    }

    // Better reputation means lower interest rate
    interestRate -= reputationAdjustment;

    // Ensure reasonable bounds
    interestRate = Math.max(3, Math.min(15, interestRate));

    // Determine loan type based on amount and user input
    let loanType = LoanType.MORTGAGE;
    let term = 12; // 12 months default term

    if (args.length >= 4 && !args[3].match(/^[a-zA-Z0-9]{5,}$/)) {
        // If fourth argument isn't a property ID, it might be loan type
        const typeArg = args[3].toLowerCase();

        if (typeArg.includes('mortgage') || typeArg.includes('thechap')) {
            loanType = LoanType.MORTGAGE;
            term = 12;
        } else if (typeArg.includes('business') || typeArg.includes('kinhdoanh')) {
            loanType = LoanType.BUSINESS;
            term = 6;
            interestRate += 1; // Business loans have higher rates
        } else if (typeArg.includes('construction') || typeArg.includes('xaydung')) {
            loanType = LoanType.CONSTRUCTION;
            term = 24;
        } else if (typeArg.includes('personal') || typeArg.includes('canhan')) {
            loanType = LoanType.PERSONAL;
            term = 6;
            interestRate += 2; // Personal loans have higher rates
        }
    }

    // If there's a term argument
    if (args.length >= 5 && !isNaN(parseInt(args[4]))) {
        term = parseInt(args[4]);

        // Validate term
        if (term < 3 || term > 36) {
            await message.reply(
                'Kỳ hạn khoản vay phải từ 3 đến 36 tháng.'
            );
            return;
        }
    }

    // Calculate monthly payment
    // Formula: P = (A * r * (1 + r)^n) / ((1 + r)^n - 1)
    // Where:
    // P = Payment
    // A = Amount
    // r = Monthly interest rate (annual rate / 12 / 100)
    // n = Number of payments (term in months)

    const monthlyRate = interestRate / 100 / 12;
    const paymentAmount = Math.ceil(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
        (Math.pow(1 + monthlyRate, term) - 1)
    );

    // Create loan
    const loan = {
        id: generateId(),
        userId: userId,
        amount: amount,
        interestRate: interestRate,
        term: term,
        remainingPayments: term,
        paymentAmount: paymentAmount,
        nextPaymentDue: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        collateral: collateralProperties.map(p => p.id),
        loanType: loanType,
        approved: true,
        active: true,
        missedPayments: 0,
        createdAt: Date.now(),
        loanToValue: ltvRatio
    };

    gameData.loans.push(loan);

    // Add loan ID to user's loans
    account.loans.push(loan.id);

    // Add money to user's account
    account.balance += amount;
    account.lastActivity = Date.now();

    // Mark properties as mortgaged
    collateralProperties.forEach(property => {
        property.mortgaged = true;
        property.mortgageId = loan.id;
    });

    // Create transaction
    addTransaction(
        TransactionType.LOAN,
        null,
        userId,
        null,
        amount,
        `Khoản vay ${getLoanTypeLabel(loanType)} với ${collateralProperties.length} bất động sản thế chấp`,
        loan.id
    );

    saveGameData(gameData);

    // Properties list text
    let propertiesText = '';
    collateralProperties.forEach((property, index) => {
        propertiesText += `   ${index + 1}. ${property.name} (${formatCurrency(property.currentPrice)})\n`;
    });

    await message.reply(
        `✅ Khoản vay đã được phê duyệt!\n\n` +
        `💰 Số tiền vay: ${formatCurrency(amount)}\n` +
        `🔒 Loại vay: ${getLoanTypeLabel(loanType)}\n` +
        `🏠 Tài sản thế chấp (${collateralProperties.length}):\n${propertiesText}\n` +
        `💸 Thanh toán hàng tháng: ${formatCurrency(paymentAmount)}\n` +
        `📊 Lãi suất: ${formatPercentage(interestRate)}/năm\n` +
        `📆 Thời hạn: ${term} tháng\n` +
        `📊 Tỷ lệ vay/giá trị (LTV): ${formatPercentage(ltvRatio)}\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}\n\n` +
        `💡 Thanh toán đầu tiên sẽ được thực hiện sau 30 ngày. Đảm bảo bạn có đủ tiền để trả nợ đúng hạn để tránh phí phạt và nguy cơ mất tài sản thế chấp.`
    );
}

// Pay loan
async function payLoan(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    const account = gameData.accounts[userId];

    // Get active loans
    const activeLoans = gameData.loans.filter(
        loan => loan.userId === userId && loan.active
    );

    if (activeLoans.length === 0) {
        await message.reply(
            'Bạn không có khoản vay nào đang hoạt động.'
        );
        return;
    }

    let loan;

    if (args.length < 2) {
        // If no loan ID specified, pay the first active loan
        loan = activeLoans[0];
    } else {
        // Pay specific loan
        const loanId = args[1];
        const specificLoan = activeLoans.find(l => l.id === loanId);

        if (!specificLoan) {
            await message.reply(
                'Không tìm thấy khoản vay với ID này. Vui lòng kiểm tra lại ID.'
            );
            return;
        }

        loan = specificLoan;
    }

    // Check if user wants to pay in full
    const payInFull = args.length >= 3 && (args[2].toLowerCase() === 'full' || args[2].toLowerCase() === 'đủ');

    let amountToPay;

    if (payInFull) {
        // Pay the remaining loan balance
        amountToPay = loan.paymentAmount * loan.remainingPayments;

        // Apply early repayment discount (2% off remaining interest)
        const principalPerPayment = loan.amount / loan.term;
        let totalInterest = 0;
        let remainingPrincipal = loan.amount - (principalPerPayment * (loan.term - loan.remainingPayments));

        for (let i = 0; i < loan.remainingPayments; i++) {
            const interest = remainingPrincipal * (loan.interestRate / 100 / 12);
            totalInterest += interest;
            remainingPrincipal -= principalPerPayment;
        }

        const discount = totalInterest * 0.02; // 2% discount
        amountToPay = Math.round(amountToPay - discount);
    } else {
        // Pay one installment
        amountToPay = loan.paymentAmount;
    }

    // Check if user has enough money
    if (account.balance < amountToPay) {
        await message.reply(
            `Số dư không đủ để thanh toán. Bạn cần thêm ${formatCurrency(amountToPay - account.balance)}.`
        );
        return;
    }

    // Process payment
    account.balance -= amountToPay;
    account.lastActivity = Date.now();

    if (payInFull) {
        loan.remainingPayments = 0;
        loan.active = false;

        // Release collateral properties
        loan.collateral.forEach(propId => {
            const property = gameData.properties.find(p => p.id === propId);
            if (property) {
                property.mortgaged = false;
                property.mortgageId = null;
            }
        });

        // Award reputation points for paying in full
        account.reputationScore = Math.min(100, account.reputationScore + 5);
    } else {
        loan.remainingPayments--;

        if (loan.remainingPayments <= 0) {
            loan.active = false;

            // Release collateral properties
            loan.collateral.forEach(propId => {
                const property = gameData.properties.find(p => p.id === propId);
                if (property) {
                    property.mortgaged = false;
                    property.mortgageId = null;
                }
            });

            // Award reputation points for fully paid loan
            account.reputationScore = Math.min(100, account.reputationScore + 3);
        } else {
            // Set next payment due date
            loan.nextPaymentDue = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

            // Reset missed payments counter
            loan.missedPayments = 0;

            // Award reputation point for on-time payment
            account.reputationScore = Math.min(100, account.reputationScore + 1);
        }
    }

    // Create transaction
    addTransaction(
        TransactionType.LOAN_PAYMENT,
        userId,
        null,
        null,
        amountToPay,
        `${payInFull ? 'Trả hết' : 'Trả góp'} khoản vay ${getLoanTypeLabel(loan.loanType)} #${loan.id}`,
        loan.id
    );

    // Add experience points
    account.experience += Math.floor(amountToPay / 2000000); // 1 XP per 2M loan payment
    checkLevelUp(account);

    saveGameData(gameData);

    await message.reply(
        `✅ Thanh toán khoản vay thành công!\n\n` +
        `💰 Số tiền thanh toán: ${formatCurrency(amountToPay)}\n` +
        `🔒 Loại vay: ${getLoanTypeLabel(loan.loanType)}\n` +
        `📆 Kỳ thanh toán còn lại: ${loan.remainingPayments}\n` +
        (loan.remainingPayments === 0
            ? '🎉 Chúc mừng! Khoản vay đã được thanh toán đầy đủ. Tài sản thế chấp đã được giải phóng.'
            : `📆 Thanh toán tiếp theo: ${new Date(loan.nextPaymentDue).toLocaleDateString('vi-VN')}`
        ) + `\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Upgrade property
async function upgradeProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn nâng cấp. Ví dụ: /bds nâng cấp abc123'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    const account = gameData.accounts[userId];

    // Generate available upgrades based on property type
    var availableUpgrades = [];

    if (property.condition !== PropertyCondition.EXCELLENT) {
        availableUpgrades.push({
            name: 'Cải thiện tình trạng',
            description: 'Nâng cao tình trạng tổng thể của bất động sản',
            cost: Math.round(property.currentPrice * 0.05),
            valueIncrease: Math.round(property.currentPrice * 0.08),
            incomeIncrease: Math.round(property.income * 0.1)
        });
    }


    // Generate specific upgrades based on property type
    generatePropertyTypeUpgrades(property, availableUpgrades);

    // If no specific upgrade is chosen, show available upgrades
    if (args.length < 3) {
        let upgradeText = `🛠️ NÂNG CẤP BẤT ĐỘNG SẢN\n\n` +
            `🏠 ${property.name}\n` +
            `📍 ${property.location}, ${property.district}\n` +
            `💰 Giá hiện tại: ${formatCurrency(property.currentPrice)}\n` +
            `💵 Thu nhập: ${formatCurrency(property.income)}/tháng\n\n` +
            `📝 CÁC NÂNG CẤP CÓ SẴN:\n`;

        availableUpgrades.forEach((upgrade, index) => {
            upgradeText += `${index + 1}. ${upgrade.name} [${index + 1}]\n` +
                `   📝 ${upgrade.description}\n` +
                `   💰 Chi phí: ${formatCurrency(upgrade.cost)}\n` +
                `   💎 Tăng giá trị: +${formatCurrency(upgrade.valueIncrease)}\n` +
                `   💵 Tăng thu nhập: +${formatCurrency(upgrade.incomeIncrease)}/tháng\n\n`;
        });

        upgradeText += `💡 Để nâng cấp, hãy dùng lệnh /bds nâng cấp ${propertyId} [số nâng cấp]`;

        await message.reply(upgradeText);
        return;
    }

    // Process upgrade
    const upgradeIndex = parseInt(args[2]) - 1;

    if (isNaN(upgradeIndex) || upgradeIndex < 0 || upgradeIndex >= availableUpgrades.length) {
        await message.reply(
            `Số nâng cấp không hợp lệ. Vui lòng chọn từ 1 đến ${availableUpgrades.length}.`
        );
        return;
    }

    const selectedUpgrade = availableUpgrades[upgradeIndex];

    // Check if user has enough money
    if (account.balance < selectedUpgrade.cost) {
        await message.reply(
            `Số dư không đủ để thực hiện nâng cấp này. Bạn cần thêm ${formatCurrency(selectedUpgrade.cost - account.balance)}.`
        );
        return;
    }

    // Process upgrade
    account.balance -= selectedUpgrade.cost;
    account.lastActivity = Date.now();
    account.experience += Math.floor(selectedUpgrade.cost / 2000000); // 1 XP per 2M spent on upgrades

    // Update property
    property.currentPrice += selectedUpgrade.valueIncrease;
    property.income += selectedUpgrade.incomeIncrease;

    // If this is a condition improvement upgrade, improve the condition
    if (selectedUpgrade.name === 'Cải thiện tình trạng') {
        improvePropertyCondition(property);
    }

    // Add upgrade to property
    property.upgrades.push({
        id: generateId(),
        name: selectedUpgrade.name,
        description: selectedUpgrade.description,
        cost: selectedUpgrade.cost,
        valueIncrease: selectedUpgrade.valueIncrease,
        incomeIncrease: selectedUpgrade.incomeIncrease,
        appliedAt: Date.now()
    });

    // Add feature if applicable
    if (selectedUpgrade.name.includes('lắp đặt') ||
        selectedUpgrade.name.includes('thêm') ||
        selectedUpgrade.name.includes('xây')) {
        property.features.push(selectedUpgrade.name);
    }

    // Create transaction
    addTransaction(
        TransactionType.UPGRADE,
        userId,
        null,
        property.id,
        selectedUpgrade.cost,
        `Nâng cấp ${property.name}: ${selectedUpgrade.name}`
    );

    // Check for level up
    checkLevelUp(account);

    saveGameData(gameData);

    await message.reply(
        `✅ Nâng cấp bất động sản thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `🛠️ Nâng cấp: ${selectedUpgrade.name}\n` +
        `💰 Chi phí: ${formatCurrency(selectedUpgrade.cost)}\n` +
        `💎 Giá trị mới: ${formatCurrency(property.currentPrice)} (+${formatCurrency(selectedUpgrade.valueIncrease)})\n` +
        `💵 Thu nhập mới: ${formatCurrency(property.income)}/tháng (+${formatCurrency(selectedUpgrade.incomeIncrease)})\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Generate property type specific upgrades
function generatePropertyTypeUpgrades(property, upgrades) {
    switch (property.type) {
        case PropertyType.RESIDENTIAL_APARTMENT:
            upgrades.push(
                {
                    name: 'Cải tạo phòng tắm',
                    description: 'Nâng cấp phòng tắm với thiết bị cao cấp',
                    cost: Math.round(property.currentPrice * 0.03),
                    valueIncrease: Math.round(property.currentPrice * 0.05),
                    incomeIncrease: Math.round(property.income * 0.05)
                },
                {
                    name: 'Cải tạo nhà bếp',
                    description: 'Lắp đặt bếp và thiết bị nhà bếp cao cấp',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.07),
                    incomeIncrease: Math.round(property.income * 0.08)
                },
                {
                    name: 'Lắp đặt điều hòa trung tâm',
                    description: 'Hệ thống điều hòa hiện đại cho toàn căn hộ',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.08),
                    incomeIncrease: Math.round(property.income * 0.1)
                }
            );
            break;

        case PropertyType.RESIDENTIAL_HOUSE:
            upgrades.push(
                {
                    name: 'Xây thêm phòng',
                    description: 'Mở rộng diện tích nhà với phòng mới',
                    cost: Math.round(property.currentPrice * 0.08),
                    valueIncrease: Math.round(property.currentPrice * 0.15),
                    incomeIncrease: Math.round(property.income * 0.2)
                },
                {
                    name: 'Cải tạo sân vườn',
                    description: 'Thiết kế và trang trí sân vườn đẹp mắt',
                    cost: Math.round(property.currentPrice * 0.03),
                    valueIncrease: Math.round(property.currentPrice * 0.06),
                    incomeIncrease: Math.round(property.income * 0.05)
                },
                {
                    name: 'Lắp đặt hệ thống năng lượng mặt trời',
                    description: 'Tiết kiệm chi phí điện và thân thiện với môi trường',
                    cost: Math.round(property.currentPrice * 0.06),
                    valueIncrease: Math.round(property.currentPrice * 0.1),
                    incomeIncrease: Math.round(property.income * 0.12)
                }
            );
            break;

        case PropertyType.RESIDENTIAL_VILLA:
            upgrades.push(
                {
                    name: 'Xây dựng hồ bơi',
                    description: 'Thêm hồ bơi riêng tư vào khuôn viên',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.1),
                    incomeIncrease: Math.round(property.income * 0.15)
                },
                {
                    name: 'Cải tạo nội thất sang trọng',
                    description: 'Nâng cấp nội thất sang phong cách cao cấp',
                    cost: Math.round(property.currentPrice * 0.07),
                    valueIncrease: Math.round(property.currentPrice * 0.12),
                    incomeIncrease: Math.round(property.income * 0.18)
                },
                {
                    name: 'Xây garage rộng rãi',
                    description: 'Thêm khu vực đỗ xe rộng rãi cho nhiều phương tiện',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.08),
                    incomeIncrease: Math.round(property.income * 0.08)
                }
            );
            break;

        case PropertyType.COMMERCIAL_OFFICE:
            upgrades.push(
                {
                    name: 'Hiện đại hóa hạ tầng CNTT',
                    description: 'Nâng cấp hệ thống mạng và công nghệ thông tin',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.08),
                    incomeIncrease: Math.round(property.income * 0.12)
                },
                {
                    name: 'Cải tạo không gian làm việc chung',
                    description: 'Thiết kế không gian làm việc hiện đại và linh hoạt',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.09),
                    incomeIncrease: Math.round(property.income * 0.15)
                },
                {
                    name: 'Nâng cấp hệ thống an ninh',
                    description: 'Lắp đặt hệ thống camera và kiểm soát ra vào hiện đại',
                    cost: Math.round(property.currentPrice * 0.03),
                    valueIncrease: Math.round(property.currentPrice * 0.06),
                    incomeIncrease: Math.round(property.income * 0.08)
                }
            );
            break;

        case PropertyType.COMMERCIAL_RETAIL:
            upgrades.push(
                {
                    name: 'Cải tạo mặt tiền',
                    description: 'Nâng cấp mặt tiền cửa hàng để thu hút khách hàng',
                    cost: Math.round(property.currentPrice * 0.03),
                    valueIncrease: Math.round(property.currentPrice * 0.06),
                    incomeIncrease: Math.round(property.income * 0.1)
                },
                {
                    name: 'Lắp đặt hệ thống trưng bày hiện đại',
                    description: 'Hiện đại hóa kệ hàng và hệ thống trưng bày sản phẩm',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.07),
                    incomeIncrease: Math.round(property.income * 0.12)
                },
                {
                    name: 'Mở rộng không gian kinh doanh',
                    description: 'Tăng diện tích bán hàng để bổ sung thêm sản phẩm',
                    cost: Math.round(property.currentPrice * 0.08),
                    valueIncrease: Math.round(property.currentPrice * 0.15),
                    incomeIncrease: Math.round(property.income * 0.2)
                }
            );
            break;

        case PropertyType.COMMERCIAL_HOTEL:
            upgrades.push(
                {
                    name: 'Nâng cấp phòng nghỉ',
                    description: 'Cải thiện chất lượng và tiện nghi phòng nghỉ',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.09),
                    incomeIncrease: Math.round(property.income * 0.15)
                },
                {
                    name: 'Xây dựng khu spa và giải trí',
                    description: 'Thêm dịch vụ spa, gym và khu vực giải trí',
                    cost: Math.round(property.currentPrice * 0.07),
                    valueIncrease: Math.round(property.currentPrice * 0.12),
                    incomeIncrease: Math.round(property.income * 0.18)
                },
                {
                    name: 'Cải tạo nhà hàng và khu ẩm thực',
                    description: 'Nâng cấp khu vực ẩm thực để cung cấp trải nghiệm cao cấp',
                    cost: Math.round(property.currentPrice * 0.06),
                    valueIncrease: Math.round(property.currentPrice * 0.1),
                    incomeIncrease: Math.round(property.income * 0.14)
                }
            );
            break;

        case PropertyType.INDUSTRIAL_WAREHOUSE:
            upgrades.push(
                {
                    name: 'Hiện đại hóa hệ thống kho vận',
                    description: 'Lắp đặt hệ thống quản lý kho vận hiện đại',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.07),
                    incomeIncrease: Math.round(property.income * 0.12)
                },
                {
                    name: 'Nâng cấp hệ thống điện',
                    description: 'Cải thiện hệ thống điện để đáp ứng nhu cầu sản xuất',
                    cost: Math.round(property.currentPrice * 0.03),
                    valueIncrease: Math.round(property.currentPrice * 0.05),
                    incomeIncrease: Math.round(property.income * 0.08)
                },
                {
                    name: 'Mở rộng khu vực lưu trữ',
                    description: 'Tăng diện tích kho bãi để đáp ứng nhu cầu lưu trữ',
                    cost: Math.round(property.currentPrice * 0.08),
                    valueIncrease: Math.round(property.currentPrice * 0.14),
                    incomeIncrease: Math.round(property.income * 0.2)
                }
            );
            break;

        case PropertyType.INDUSTRIAL_FACTORY:
            upgrades.push(
                {
                    name: 'Tự động hóa dây chuyền sản xuất',
                    description: 'Lắp đặt hệ thống tự động hóa để tăng hiệu suất',
                    cost: Math.round(property.currentPrice * 0.07),
                    valueIncrease: Math.round(property.currentPrice * 0.12),
                    incomeIncrease: Math.round(property.income * 0.2)
                },
                {
                    name: 'Nâng cấp hệ thống an toàn lao động',
                    description: 'Cải thiện an toàn lao động và phòng cháy chữa cháy',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.06),
                    incomeIncrease: Math.round(property.income * 0.05)
                },
                {
                    name: 'Xây dựng thêm xưởng sản xuất',
                    description: 'Mở rộng khu vực sản xuất với xưởng mới',
                    cost: Math.round(property.currentPrice * 0.1),
                    valueIncrease: Math.round(property.currentPrice * 0.18),
                    incomeIncrease: Math.round(property.income * 0.25)
                }
            );
            break;

        case PropertyType.LAND_RESIDENTIAL:
        case PropertyType.LAND_COMMERCIAL:
            upgrades.push(
                {
                    name: 'Làm đường vào',
                    description: 'Xây dựng đường vào thuận tiện',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.1),
                    incomeIncrease: property.income === 0 ? 5000000 : Math.round(property.income * 0.2)
                },
                {
                    name: 'Kết nối điện nước',
                    description: 'Kết nối hệ thống điện nước đến khu đất',
                    cost: Math.round(property.currentPrice * 0.07),
                    valueIncrease: Math.round(property.currentPrice * 0.15),
                    incomeIncrease: property.income === 0 ? 10000000 : Math.round(property.income * 0.3)
                },
                {
                    name: 'Phân lô bán nền',
                    description: 'Phân chia thành nhiều lô nhỏ hơn để tăng giá trị',
                    cost: Math.round(property.currentPrice * 0.1),
                    valueIncrease: Math.round(property.currentPrice * 0.3),
                    incomeIncrease: property.income === 0 ? 20000000 : Math.round(property.income * 0.5)
                }
            );
            break;

        case PropertyType.LAND_AGRICULTURAL:
            upgrades.push(
                {
                    name: 'Hệ thống tưới tiêu',
                    description: 'Lắp đặt hệ thống tưới tiêu hiện đại',
                    cost: Math.round(property.currentPrice * 0.05),
                    valueIncrease: Math.round(property.currentPrice * 0.08),
                    incomeIncrease: property.income === 0 ? 8000000 : Math.round(property.income * 0.2)
                },
                {
                    name: 'Cải tạo đất',
                    description: 'Cải thiện chất lượng đất canh tác',
                    cost: Math.round(property.currentPrice * 0.04),
                    valueIncrease: Math.round(property.currentPrice * 0.06),
                    incomeIncrease: property.income === 0 ? 5000000 : Math.round(property.income * 0.15)
                },
                {
                    name: 'Xây dựng nhà kính',
                    description: 'Xây dựng nhà kính để canh tác hiệu quả hơn',
                    cost: Math.round(property.currentPrice * 0.08),
                    valueIncrease: Math.round(property.currentPrice * 0.12),
                    incomeIncrease: property.income === 0 ? 15000000 : Math.round(property.income * 0.4)
                }
            );
            break;
    }
}

// Improve property condition
function improvePropertyCondition(property) {
    switch (property.condition) {
        case PropertyCondition.DILAPIDATED:
            property.condition = PropertyCondition.POOR;
            break;
        case PropertyCondition.POOR:
            property.condition = PropertyCondition.FAIR;
            break;
        case PropertyCondition.FAIR:
            property.condition = PropertyCondition.GOOD;
            break;
        case PropertyCondition.GOOD:
            property.condition = PropertyCondition.EXCELLENT;
            break;
    }
}

// Maintain property
async function maintainProperty(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn bảo trì. Ví dụ: /bds bảo trì abc123'
        );
        return;
    }

    const propertyId = args[1];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    const account = gameData.accounts[userId];

    // Calculate maintenance cost based on property condition and type
    // Worse condition means higher cost
    let conditionMultiplier = 1.0;
    switch (property.condition) {
        case PropertyCondition.EXCELLENT:
            conditionMultiplier = 0.5; // 50% of normal cost
            break;
        case PropertyCondition.GOOD:
            conditionMultiplier = 0.8; // 80% of normal cost
            break;
        case PropertyCondition.FAIR:
            conditionMultiplier = 1.0; // Normal cost
            break;
        case PropertyCondition.POOR:
            conditionMultiplier = 1.5; // 150% of normal cost
            break;
        case PropertyCondition.DILAPIDATED:
            conditionMultiplier = 2.0; // 200% of normal cost
            break;
    }

    // Calculate maintenance cost - normally 0.5% of property value
    const maintenanceCost = Math.round(property.currentPrice * 0.005 * conditionMultiplier);

    // Check if user can afford maintenance
    if (account.balance < maintenanceCost) {
        await message.reply(
            `Số dư không đủ để bảo trì bất động sản này. Cần ${formatCurrency(maintenanceCost)}, bạn chỉ có ${formatCurrency(account.balance)}.`
        );
        return;
    }

    // Process maintenance
    account.balance -= maintenanceCost;
    account.lastActivity = Date.now();

    // Reset last maintenance date
    property.lastMaintenance = Date.now();

    // Chance to improve condition based on maintenance
    const improvementChance = property.condition === PropertyCondition.EXCELLENT ? 0 : 0.7;

    let conditionImproved = false;

    if (Math.random() < improvementChance) {
        const oldCondition = property.condition;
        improvePropertyCondition(property);
        conditionImproved = oldCondition !== property.condition;

        // If condition improved, increase property value
        if (conditionImproved) {
            const valueIncrease = Math.round(property.currentPrice * 0.03);
            property.currentPrice += valueIncrease;
        }
    }

    // Create transaction
    addTransaction(
        TransactionType.MAINTENANCE,
        userId,
        null,
        property.id,
        maintenanceCost,
        `Bảo trì bất động sản ${property.name}`
    );

    saveGameData(gameData);

    // Create success message
    let successMessage = `✅ Đã bảo trì bất động sản thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `💰 Chi phí bảo trì: ${formatCurrency(maintenanceCost)}\n`;

    if (conditionImproved) {
        successMessage += `🎉 Tình trạng được cải thiện: ${getPropertyConditionLabel(property.condition)}\n`;
    } else {
        successMessage += `📝 Tình trạng hiện tại: ${getPropertyConditionLabel(property.condition)}\n`;
    }

    successMessage += `\n💰 Số dư hiện tại: ${formatCurrency(account.balance)}`;

    await message.reply(successMessage);
}

// Handle insurance operations
async function handleInsurance(userId, args, message) {
    if (!hasAccount(userId)) {
        await message.reply(
            'Bạn chưa có tài khoản bất động sản. Vui lòng tạo tài khoản với lệnh /bds tạo'
        );
        return;
    }

    if (args.length < 2) {
        // Show insurance info
        await showInsuranceInfo(userId, message);
        return;
    }

    const operation = args[1].toLowerCase();

    switch (operation) {
        case 'mua':
        case 'buy':
            await buyInsurance(userId, args, message);
            break;

        case 'hủy':
        case 'cancel':
            await cancelInsurance(userId, args, message);
            break;

        case 'xem':
        case 'info':
            await showInsuranceInfo(userId, message);
            break;

        default:
            await showInsuranceInfo(userId, message);
            break;
    }
}

// Show insurance information
async function showInsuranceInfo(userId, message) {
    const account = gameData.accounts[userId];

    // Get insured properties
    const insuredProperties = gameData.properties.filter(p =>
        p.owner === userId && p.insuranceStatus !== InsuranceStatus.UNINSURED
    );

    // Get uninsured properties
    const uninsuredProperties = gameData.properties.filter(p =>
        p.owner === userId && p.insuranceStatus === InsuranceStatus.UNINSURED
    );

    let infoText = `🛡️ THÔNG TIN BẢO HIỂM BẤT ĐỘNG SẢN\n\n`;

    // Show current insurance policies
    if (insuredProperties.length > 0) {
        infoText += `📋 BẤT ĐỘNG SẢN ĐƯỢC BẢO HIỂM:\n`;

        insuredProperties.forEach((property, index) => {
            const insurance = account.insurance.find(ins => ins.propertyId === property.id && ins.active);

            if (insurance) {
                infoText += `${index + 1}. ${property.name} [ID: ${property.id}]\n`;
                infoText += `   📊 Loại bảo hiểm: ${getInsuranceCoverageLabel(insurance.coverageType)}\n`;
                infoText += `   💰 Phí hàng năm: ${formatCurrency(insurance.premium)}\n`;
                infoText += `   💸 Mức khấu trừ: ${formatCurrency(insurance.deductible)}\n`;

                // Calculate time until renewal
                const expirationDate = new Date(insurance.endDate);
                const now = new Date();
                const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                infoText += `   📅 Gia hạn trong: ${daysRemaining} ngày\n\n`;
            }
        });
    } else {
        infoText += `📋 Bạn chưa có bất động sản nào được bảo hiểm.\n\n`;
    }

    // Show uninsured properties
    if (uninsuredProperties.length > 0) {
        infoText += `❗ BẤT ĐỘNG SẢN CHƯA CÓ BẢO HIỂM:\n`;

        uninsuredProperties.forEach((property, index) => {
            // Calculate suggested premium (0.5% of property value per year)
            const suggestedPremium = Math.round(property.currentPrice * 0.005);

            infoText += `${index + 1}. ${property.name} [ID: ${property.id}]\n`;
            infoText += `   💰 Giá trị: ${formatCurrency(property.currentPrice)}\n`;
            infoText += `   📊 Phí bảo hiểm cơ bản: ${formatCurrency(suggestedPremium)}/năm\n`;
            infoText += `   💡 Mua bảo hiểm: /bds bảo hiểm mua ${property.id} [loại]\n\n`;
        });
    }

    // Show insurance coverage types
    infoText += `📋 CÁC LOẠI BẢO HIỂM:\n`;
    infoText += `1. Cơ bản (BASIC): Bảo hiểm cháy nổ và thiên tai cơ bản, chi phí thấp\n`;
    infoText += `2. Tiêu chuẩn (STANDARD): Bảo hiểm toàn diện hơn với mức bồi thường cao hơn\n`;
    infoText += `3. Toàn diện (COMPREHENSIVE): Bảo hiểm mọi rủi ro với mức bồi thường cao\n`;
    infoText += `4. Thiên tai (DISASTER): Chuyên bảo hiểm cho các thiên tai lớn\n`;
    infoText += `5. Trách nhiệm (LIABILITY): Bảo hiểm trách nhiệm dân sự với bên thứ ba\n\n`;

    infoText += `💡 Để mua bảo hiểm: /bds bảo hiểm mua [id_bđs] [loại 1-5]\n`;
    infoText += `💡 Để hủy bảo hiểm: /bds bảo hiểm hủy [id_bđs]`;

    await message.reply(infoText);
}

// Buy insurance
async function buyInsurance(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID bất động sản và loại bảo hiểm. Ví dụ: /bds bảo hiểm mua abc123 2'
        );
        return;
    }

    const propertyId = args[2];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    // Check if property already has insurance
    const account = gameData.accounts[userId];
    const existingInsurance = account.insurance.find(ins => ins.propertyId === propertyId && ins.active);

    if (existingInsurance) {
        await message.reply(
            'Bất động sản này đã có bảo hiểm. Vui lòng hủy bảo hiểm hiện tại trước khi mua mới.'
        );
        return;
    }

    // Get insurance type
    let coverageType = InsuranceCoverageType.STANDARD; // Default

    if (args.length >= 4) {
        const typeInput = args[3].toLowerCase();

        if (typeInput === '1' || typeInput.includes('basic') || typeInput.includes('cơ bản')) {
            coverageType = InsuranceCoverageType.BASIC;
        } else if (typeInput === '2' || typeInput.includes('standard') || typeInput.includes('tiêu chuẩn')) {
            coverageType = InsuranceCoverageType.STANDARD;
        } else if (typeInput === '3' || typeInput.includes('comprehensive') || typeInput.includes('toàn diện')) {
            coverageType = InsuranceCoverageType.COMPREHENSIVE;
        } else if (typeInput === '4' || typeInput.includes('disaster') || typeInput.includes('thiên tai')) {
            coverageType = InsuranceCoverageType.DISASTER;
        } else if (typeInput === '5' || typeInput.includes('liability') || typeInput.includes('trách nhiệm')) {
            coverageType = InsuranceCoverageType.LIABILITY;
        }
    }

    // Calculate premium based on coverage type and property value
    let premiumRate = 0.005; // 0.5% of property value per year (standard)
    let coverageRate = 0.8; // 80% of property value (standard)
    let deductibleRate = 0.05; // 5% of claim amount (standard)

    switch (coverageType) {
        case InsuranceCoverageType.BASIC:
            premiumRate = 0.003; // 0.3%
            coverageRate = 0.6; // 60%
            deductibleRate = 0.1; // 10%
            break;
        case InsuranceCoverageType.STANDARD:
            premiumRate = 0.005; // 0.5%
            coverageRate = 0.8; // 80%
            deductibleRate = 0.05; // 5%
            break;
        case InsuranceCoverageType.COMPREHENSIVE:
            premiumRate = 0.008; // 0.8%
            coverageRate = 0.9; // 90%
            deductibleRate = 0.02; // 2%
            break;
        case InsuranceCoverageType.DISASTER:
            premiumRate = 0.01; // 1%
            coverageRate = 1.0; // 100%
            deductibleRate = 0.05; // 5%
            break;
        case InsuranceCoverageType.LIABILITY:
            premiumRate = 0.004; // 0.4%
            coverageRate = 0.6; // 60%
            deductibleRate = 0.1; // 10%
            break;
    }

    // Calculate actual premium, coverage amount, and deductible
    const premium = Math.round(property.currentPrice * premiumRate);
    const coverageAmount = Math.round(property.currentPrice * coverageRate);
    const deductible = Math.round(coverageAmount * deductibleRate);

    // Check if user can afford premium
    if (account.balance < premium) {
        await message.reply(
            `Số dư không đủ để mua bảo hiểm. Cần ${formatCurrency(premium)}, bạn chỉ có ${formatCurrency(account.balance)}.`
        );
        return;
    }

    // Process insurance purchase
    account.balance -= premium;
    account.lastActivity = Date.now();

    // Create insurance policy
    const now = Date.now();
    const insurance = {
        id: generateId(),
        propertyId: property.id,
        coverageType: coverageType,
        coverageAmount: coverageAmount,
        premium: premium,
        deductible: deductible,
        startDate: now,
        endDate: now + (365 * 24 * 60 * 60 * 1000), // 1 year
        provider: 'BĐS Insurance',
        active: true
    };

    // Add insurance to user account
    account.insurance.push(insurance);

    // Update property insurance status
    property.insuranceStatus = coverageType === InsuranceCoverageType.COMPREHENSIVE ?
        InsuranceStatus.FULLY_INSURED : InsuranceStatus.PARTIALLY_INSURED;

    // Create transaction
    addTransaction(
        TransactionType.INSURANCE_PREMIUM,
        userId,
        null,
        property.id,
        premium,
        `Phí bảo hiểm ${getInsuranceCoverageLabel(coverageType)} cho ${property.name}`,
        null,
        null,
        insurance.id
    );

    saveGameData(gameData);

    await message.reply(
        `✅ Đã mua bảo hiểm thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `🛡️ Loại bảo hiểm: ${getInsuranceCoverageLabel(coverageType)}\n` +
        `💰 Phí bảo hiểm: ${formatCurrency(premium)}/năm\n` +
        `💵 Mức bảo hiểm: ${formatCurrency(coverageAmount)} (${(coverageRate * 100).toFixed(0)}% giá trị)\n` +
        `💸 Mức khấu trừ: ${formatCurrency(deductible)}\n` +
        `📅 Hiệu lực đến: ${new Date(insurance.endDate).toLocaleDateString('vi-VN')}\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}\n\n` +
        `💡 Bảo hiểm bảo vệ bất động sản của bạn khỏi những rủi ro không lường trước được.`
    );
}

// Cancel insurance
async function cancelInsurance(userId, args, message) {
    if (args.length < 3) {
        await message.reply(
            'Vui lòng nhập ID bất động sản muốn hủy bảo hiểm. Ví dụ: /bds bảo hiểm hủy abc123'
        );
        return;
    }

    const propertyId = args[2];
    const property = gameData.properties.find(p => p.id === propertyId);

    if (!property) {
        await message.reply(
            'Không tìm thấy bất động sản với ID này. Vui lòng kiểm tra lại ID.'
        );
        return;
    }

    if (property.owner !== userId) {
        await message.reply(
            'Bạn không sở hữu bất động sản này.'
        );
        return;
    }

    // Check if property has insurance
    const account = gameData.accounts[userId];
    const insuranceIndex = account.insurance.findIndex(ins => ins.propertyId === propertyId && ins.active);

    if (insuranceIndex === -1) {
        await message.reply(
            'Bất động sản này không có bảo hiểm để hủy.'
        );
        return;
    }

    const insurance = account.insurance[insuranceIndex];

    // Calculate refund (if any)
    // Refund 40% of remaining time premium
    const now = Date.now();
    const totalDuration = insurance.endDate - insurance.startDate;
    const timeRemaining = insurance.endDate - now;
    const remainingRatio = timeRemaining / totalDuration;

    const refundAmount = Math.round(insurance.premium * remainingRatio * 0.4);

    // Process cancellation
    account.balance += refundAmount;
    account.lastActivity = Date.now();

    // Deactivate insurance
    insurance.active = false;

    // Update property insurance status
    property.insuranceStatus = InsuranceStatus.UNINSURED;

    // Create transaction if refund
    if (refundAmount > 0) {
        addTransaction(
            TransactionType.DEPOSIT,
            null,
            userId,
            property.id,
            refundAmount,
            `Hoàn phí bảo hiểm cho ${property.name}`,
            null,
            null,
            insurance.id
        );
    }

    saveGameData(gameData);

    await message.reply(
        `✅ Đã hủy bảo hiểm thành công!\n\n` +
        `🏠 ${property.name}\n` +
        `🛡️ Loại bảo hiểm: ${getInsuranceCoverageLabel(insurance.coverageType)}\n` +
        `💰 Hoàn phí: ${formatCurrency(refundAmount)}\n` +
        `⚠️ Bất động sản không còn được bảo vệ bởi bảo hiểm\n\n` +
        `💰 Số dư hiện tại: ${formatCurrency(account.balance)}`
    );
}

// Get insurance coverage type label
function getInsuranceCoverageLabel(type) {
    switch (type) {
        case InsuranceCoverageType.BASIC:
            return 'Cơ bản';
        case InsuranceCoverageType.STANDARD:
            return 'Tiêu chuẩn';
        case InsuranceCoverageType.COMPREHENSIVE:
            return 'Toàn diện';
        case InsuranceCoverageType.DISASTER:
            return 'Thiên tai';
        case InsuranceCoverageType.LIABILITY:
            return 'Trách nhiệm';
        default:
            return type;
    }
}

// Show ranking
async function showRanking(message) {
    // Calculate net worth for each account
    const accountsWithNetWorth = [];

    for (const userId in gameData.accounts) {
        const account = gameData.accounts[userId];
        const netWorth = calculateNetWorth(account);
        const propertiesCount = account.ownedProperties.length;

        accountsWithNetWorth.push({
            userId,
            username: account.username,
            netWorth,
            level: account.level,
            properties: propertiesCount
        });
    }

    // Sort by net worth
    accountsWithNetWorth.sort((a, b) => b.netWorth - a.netWorth);

    // Update rankings
    accountsWithNetWorth.forEach((account, index) => {
        gameData.accounts[account.userId].ranking = index + 1;
    });

    saveGameData(gameData);

    // Generate ranking message
    let rankingText = `🏆 BẢNG XẾP HẠNG NHÀ ĐẦU TƯ BẤT ĐỘNG SẢN\n\n`;

    if (accountsWithNetWorth.length === 0) {
        rankingText += `❌ Chưa có người chơi nào.`;
    } else {
        accountsWithNetWorth.forEach((account, index) => {
            if (index < 10) { // Show top 10 only
                const crown = index === 0 ? '👑 ' : '';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

                rankingText += `${medal} ${crown}${account.username}\n`;
                rankingText += `   💎 Tài sản: ${formatCurrency(account.netWorth)} | 🏠 BĐS: ${account.properties} | 🏆 Cấp độ: ${account.level}\n\n`;
            }
        });
    }

    rankingText += `💡 Mua và phát triển bất động sản để tăng tài sản và thứ hạng của bạn!`;

    await message.reply(rankingText);
}


// TODO
/**
 * 1. Cập nhật interface GameData
 Thêm trường partnerships: Partnership[] vào interface GameData
 Hoặc thay thế bằng partnerships?: Partnership[] để làm thuộc tính này tùy chọn (an toàn hơn)
2. Cập nhật initialGameData
 Thêm trường partnerships: [] vào đối tượng initialGameData
 Đảm bảo tất cả các trường bắt buộc đều được khởi tạo

 fix lỗi intialGame : done
 */

//____------_____// done todo
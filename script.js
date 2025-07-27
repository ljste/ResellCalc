document.addEventListener('DOMContentLoaded', () => {
    const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€', CAD: '$', AUD: '$' };
    const FEES = {
        USD: {
            ebay: { most_categories: { rate1: 0.136, threshold1: 7500, rate2: 0.0235 }, books_media: { rate1: 0.153, threshold1: 7500, rate2: 0.0235 }, handbags: { rate1: 0.15, threshold1: 2000, rate2: 0.09 }, athletic_shoes: { rate1: 0.08, threshold1: 150, rate2: 0.136 }, perOrderFeeLow: 0.30, perOrderFeeHigh: 0.40, feeName: 'eBay' },
            etsy: { transactionPercent: 0.065, listing: 0.20, paymentPercent: 0.03, paymentFixed: 0.25, offsiteAdRateStandard: 0.15, offsiteAdRateDiscounted: 0.12, offsiteAdCap: 100, feeName: 'Etsy' },
            depop: { paymentPercent: 0.033, paymentFixed: 0.45, boostingRate: 0.08, feeName: 'Depop' }
        },
        GBP: {
            ebay: { most_categories: { rate1: 0.128, threshold1: 5000, rate2: 0.03 }, books_media: { rate1: 0.128, threshold1: 5000, rate2: 0.03 }, handbags: { rate1: 0.128, threshold1: 5000, rate2: 0.03 }, athletic_shoes: { rate1: 0.08, threshold1: 100, rate2: 0.128 }, perOrderFeeLow: 0.30, perOrderFeeHigh: 0.30, feeName: 'eBay' },
            etsy: { transactionPercent: 0.065, listing: 0.16, paymentPercent: 0.04, paymentFixed: 0.20, offsiteAdRateStandard: 0.15, offsiteAdRateDiscounted: 0.12, offsiteAdCap: 80, feeName: 'Etsy' },
            depop: { paymentPercent: 0.029, paymentFixed: 0.30, boostingRate: 0.08, feeName: 'Depop' }
        },
        EUR: {
            ebay: { most_categories: { rate1: 0.12, threshold1: 2000, rate2: 0.02 }, perOrderFeeLow: 0.35, perOrderFeeHigh: 0.35, feeName: 'eBay' },
            etsy: { transactionPercent: 0.065, listing: 0.18, paymentPercent: 0.04, paymentFixed: 0.30, offsiteAdRateStandard: 0.15, offsiteAdRateDiscounted: 0.12, offsiteAdCap: 90, feeName: 'Etsy' },
            depop: { sellingFee: 0.10, paymentPercent: 0.029, paymentFixed: 0.30, boostingRate: 0.08, feeName: 'Depop' }
        },
        CAD: {
            ebay: { most_categories: { rate1: 0.12, threshold1: 600, rate2: 0.07 }, perOrderFeeLow: 0.30, perOrderFeeHigh: 0.30, feeName: 'eBay' },
            etsy: { transactionPercent: 0.065, listing: 0.27, paymentPercent: 0.03, paymentFixed: 0.25, offsiteAdRateStandard: 0.15, offsiteAdRateDiscounted: 0.12, offsiteAdCap: 120, feeName: 'Etsy' },
            depop: { sellingFee: 0.10, paymentPercent: 0.029, paymentFixed: 0.30, boostingRate: 0.08, feeName: 'Depop' }
        },
        AUD: {
            ebay: { most_categories: { rate1: 0.134, threshold1: 4000, rate2: 0.05 }, perOrderFeeLow: 0.30, perOrderFeeHigh: 0.30, feeName: 'eBay' },
            etsy: { transactionPercent: 0.065, listing: 0.32, paymentPercent: 0.03, paymentFixed: 0.25, offsiteAdRateStandard: 0.15, offsiteAdRateDiscounted: 0.12, offsiteAdCap: 150, feeName: 'Etsy' },
            depop: { sellingFee: 0.10, paymentPercent: 0.026, paymentFixed: 0.30, boostingRate: 0.08, feeName: 'Depop' }
        }
    };

    let logEntries = [];
    let currentProfitResult = null;
    let currentCurrency = 'USD';

    const profitForm = document.getElementById('profit-form');
    const pricerForm = document.getElementById('pricer-form');
    const currencySelect = document.getElementById('currency-select');
    const platformSelect = document.getElementById('platform');
    const ebayCategoryGroup = document.getElementById('ebay-category-group');
    const etsyOptionsGroup = document.getElementById('etsy-options-group');
    const depopOptionsGroup = document.getElementById('depop-options-group');
    const modeProfitBtn = document.getElementById('mode-profit');
    const modePricerBtn = document.getElementById('mode-pricer');
    const profitCalculatorSection = document.getElementById('profit-calculator-section');
    const pricerCalculatorSection = document.getElementById('pricer-calculator-section');
    const profitResultsContainer = document.getElementById('profit-results-container');
    const pricerResultsContainer = document.getElementById('pricer-results-container');
    const logbookBody = document.getElementById('logbook-body');
    const clearLogBtn = document.getElementById('clear-log-btn');

    function formatCurrency(amount) {
        return `${CURRENCY_SYMBOLS[currentCurrency]}${amount.toFixed(2)}`;
    }

    function calculateProfit(data) {
        let otherPlatformFees = 0;
        const currentFees = FEES[currentCurrency];
        
        if (data.platform === 'ebay') {
            const platformFees = currentFees.ebay;
            const category = document.getElementById('ebay-category').value;
            const rules = platformFees[category] || platformFees.most_categories;
            const totalAmountForFvf = data.salePrice + data.shippingCharged + data.salesTax;
            let finalValueFee = 0;
            let perOrderFee = totalAmountForFvf <= 10 ? platformFees.perOrderFeeLow : platformFees.perOrderFeeHigh;
            
            if (category === 'athletic_shoes' && platformFees.athletic_shoes) {
                if (totalAmountForFvf >= rules.threshold1) {
                    finalValueFee = totalAmountForFvf * rules.rate1;
                    perOrderFee = 0; 
                } else {
                    finalValueFee = totalAmountForFvf * rules.rate2;
                }
            } else {
                 if (totalAmountForFvf <= rules.threshold1) {
                    finalValueFee = totalAmountForFvf * rules.rate1;
                } else {
                    finalValueFee = (rules.threshold1 * rules.rate1) + ((totalAmountForFvf - rules.threshold1) * rules.rate2);
                }
            }
            const promotedFee = (data.salePrice + data.shippingCharged) * (data.promotedListing / 100);
            otherPlatformFees = finalValueFee + perOrderFee + promotedFee;

        } else if (data.platform === 'etsy') {
            const platformFees = currentFees.etsy;
            const totalOrderAmount = data.salePrice + data.shippingCharged;
            const transactionFee = totalOrderAmount * platformFees.transactionPercent;
            const paymentFee = (totalOrderAmount + data.salesTax) * platformFees.paymentPercent + platformFees.paymentFixed;
            let offsiteAdFee = 0;

            if (data.isOffsiteAd) {
                const adRate = data.adRate === '12' ? platformFees.offsiteAdRateDiscounted : platformFees.offsiteAdRateStandard;
                offsiteAdFee = totalOrderAmount * adRate;
                if (offsiteAdFee > platformFees.offsiteAdCap) {
                    offsiteAdFee = platformFees.offsiteAdCap;
                }
            }
            otherPlatformFees = transactionFee + paymentFee + platformFees.listing + offsiteAdFee;

        } else if (data.platform === 'depop') {
            const platformFees = currentFees.depop;
            const paymentBase = data.salePrice + data.shippingCharged + data.salesTax;
            const depopPaymentFee = paymentBase * platformFees.paymentPercent + platformFees.paymentFixed;
            let boostingFee = 0;
            if (data.isBoosted) {
                boostingFee = (data.salePrice + data.shippingCharged) * platformFees.boostingRate;
            }
            const sellingFee = platformFees.sellingFee ? (data.salePrice + data.shippingCharged) * platformFees.sellingFee : 0;
            otherPlatformFees = depopPaymentFee + boostingFee + sellingFee;
        }

        const totalRevenue = data.salePrice + data.shippingCharged;
        const totalCosts = data.itemCost + data.shippingCost + data.otherFees + otherPlatformFees;
        const netProfit = totalRevenue - totalCosts;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        return { ...data, netProfit, profitMargin, id: Date.now(), timestamp: new Date(), currency: currentCurrency };
    }

    function calculatePrice(platform, itemCost, netShippingCost, desiredProfit) {
        const currentFees = FEES[currentCurrency];
        const totalCosts = itemCost + netShippingCost + desiredProfit;
        let percentageRate = 0;
        let fixedFee = 0;

        if (platform === 'ebay') {
            const platformFees = currentFees.ebay;
            percentageRate = platformFees.most_categories.rate1;
            fixedFee = platformFees.perOrderFeeHigh;
        } else if (platform === 'etsy') {
            const platformFees = currentFees.etsy;
            percentageRate = platformFees.transactionPercent + platformFees.paymentPercent;
            fixedFee = platformFees.listing + platformFees.paymentFixed;
        } else if (platform === 'depop') {
            const platformFees = currentFees.depop;
            percentageRate = platformFees.paymentPercent + (platformFees.sellingFee || 0);
            fixedFee = platformFees.paymentFixed;
        }
        
        if (1 - percentageRate <= 0) return Infinity;
        
        return (totalCosts + fixedFee) / (1 - percentageRate);
    }
    
    function displayProfitResults(result) {
        const profitClass = result.netProfit >= 0 ? 'profit' : 'loss';
        profitResultsContainer.innerHTML = `
            <div style="text-align:center;">
                <span style="display:block; font-size: 1rem;">Net Profit</span>
                <strong class="${profitClass}" style="font-size: 2rem; display:block;">${formatCurrency(result.netProfit)}</strong>
                <span style="font-size: 1rem;">Margin: <strong class="${profitClass}">${result.profitMargin.toFixed(1)}%</strong></span>
                <button id="save-log-btn" style="margin-top: 1rem; width: auto; padding: 0.5rem 1rem;">Save to Log</button>
            </div>
        `;
        document.getElementById('save-log-btn').addEventListener('click', () => {
            logEntries.unshift(currentProfitResult);
            saveAndRender();
            profitResultsContainer.innerHTML = '<p style="text-align:center;">Saved to logbook!</p>';
        });
    }

    function displayPricerResults(price) {
        pricerResultsContainer.innerHTML = `
            <p>To make your desired profit, list the item for:</p>
            <strong class="profit" style="font-size: 1.5rem;">${formatCurrency(price)}</strong>
        `;
    }

    function renderLog() {
        logbookBody.innerHTML = '';
        logEntries.forEach(entry => {
            const row = document.createElement('tr');
            const profitClass = entry.netProfit >= 0 ? 'profit' : 'loss';
            const platformName = FEES[entry.currency][entry.platform].feeName;
            const currencySymbol = CURRENCY_SYMBOLS[entry.currency];
            row.innerHTML = `
                <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
                <td>${platformName}</td>
                <td>${currencySymbol}${entry.salePrice.toFixed(2)}</td>
                <td class="${profitClass}">${currencySymbol}${entry.netProfit.toFixed(2)}</td>
                <td class="${profitClass}">${entry.profitMargin.toFixed(1)}%</td>
                <td><button class="delete-btn" data-id="${entry.id}">Delete</button></td>
            `;
            logbookBody.appendChild(row);
        });
    }

    function updateDashboard() {
        const filteredEntries = logEntries.filter(e => e.currency === currentCurrency);
        const totalProfit = filteredEntries.reduce((acc, entry) => acc + entry.netProfit, 0);
        const totalSales = filteredEntries.reduce((acc, entry) => acc + entry.salePrice, 0);
        const avgMargin = filteredEntries.length > 0 ? filteredEntries.reduce((acc, entry) => acc + entry.profitMargin, 0) / filteredEntries.length : 0;

        document.getElementById('stat-total-profit').textContent = formatCurrency(totalProfit);
        document.getElementById('stat-total-sales').textContent = formatCurrency(totalSales);
        document.getElementById('stat-avg-margin').textContent = `${avgMargin.toFixed(1)}%`;
    }

    function saveAndRender() {
        localStorage.setItem('resellerLog', JSON.stringify(logEntries));
        renderLog();
        updateDashboard();
    }
    
    function loadState() {
        const savedCurrency = localStorage.getItem('resellerCurrency');
        if (savedCurrency && FEES[savedCurrency]) {
            currentCurrency = savedCurrency;
            currencySelect.value = savedCurrency;
        }

        const savedLog = localStorage.getItem('resellerLog');
        if (savedLog) {
            logEntries = JSON.parse(savedLog);
        }
        
        togglePlatformOptions();
        renderLog();
        updateDashboard();
    }

    profitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            platform: document.getElementById('platform').value,
            salePrice: parseFloat(document.getElementById('sale-price').value),
            itemCost: parseFloat(document.getElementById('item-cost').value),
            shippingCost: parseFloat(document.getElementById('shipping-cost').value),
            shippingCharged: parseFloat(document.getElementById('shipping-charged').value),
            salesTax: parseFloat(document.getElementById('sales-tax').value),
            promotedListing: parseFloat(document.getElementById('promoted-listing').value),
            otherFees: parseFloat(document.getElementById('other-fees').value),
            isOffsiteAd: document.getElementById('etsy-offsite-ad').checked,
            adRate: document.getElementById('etsy-ad-rate').value,
            isBoosted: document.getElementById('depop-boosted-listing').checked
        };
        currentProfitResult = calculateProfit(data);
        displayProfitResults(currentProfitResult);
    });

    pricerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const platform = document.getElementById('pricer-platform').value;
        const itemCost = parseFloat(document.getElementById('pricer-item-cost').value);
        const netShippingCost = parseFloat(document.getElementById('pricer-shipping-cost').value);
        const desiredProfit = parseFloat(document.getElementById('pricer-desired-profit').value);
        const requiredPrice = calculatePrice(platform, itemCost, netShippingCost, desiredProfit);
        displayPricerResults(requiredPrice);
    });
    
    function togglePlatformOptions() {
        const platform = platformSelect.value;
        const fees = FEES[currentCurrency];
        ebayCategoryGroup.classList.toggle('hidden', platform !== 'ebay' || !fees.ebay.most_categories.rate2); // Simplified check
        etsyOptionsGroup.classList.toggle('hidden', platform !== 'etsy');
        depopOptionsGroup.classList.toggle('hidden', platform !== 'depop');
    }

    platformSelect.addEventListener('change', togglePlatformOptions);
    currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('resellerCurrency', currentCurrency);
        togglePlatformOptions();
        updateDashboard();
    });

    modeProfitBtn.addEventListener('click', () => {
        profitCalculatorSection.classList.remove('hidden');
        pricerCalculatorSection.classList.add('hidden');
        modeProfitBtn.classList.add('active');
        modePricerBtn.classList.remove('active');
    });

    modePricerBtn.addEventListener('click', () => {
        profitCalculatorSection.classList.add('hidden');
        pricerCalculatorSection.classList.remove('hidden');
        modeProfitBtn.classList.remove('active');
        modePricerBtn.classList.add('active');
    });

    logbookBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const entryId = parseInt(e.target.dataset.id);
            logEntries = logEntries.filter(entry => entry.id !== entryId);
            saveAndRender();
        }
    });

    clearLogBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all log entries? This cannot be undone.')) {
            logEntries = [];
            saveAndRender();
        }
    });

    loadState();
});
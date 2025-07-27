document.addEventListener('DOMContentLoaded', () => {
    const FEES = {
        ebay: { variablePercent: 0.1325, fixedPerOrder: 0.30, feeName: 'eBay' },
        etsy: { transactionPercent: 0.065, listing: 0.20, paymentPercent: 0.03, paymentFixed: 0.25, feeName: 'Etsy' },
        depop: { depopPercent: 0.10, paymentPercent: 0.033, paymentFixed: 0.45, feeName: 'Depop' }
    };

    let logEntries = [];
    let currentProfitResult = null;

    const profitForm = document.getElementById('profit-form');
    const pricerForm = document.getElementById('pricer-form');
    const modeProfitBtn = document.getElementById('mode-profit');
    const modePricerBtn = document.getElementById('mode-pricer');
    const profitCalculatorSection = document.getElementById('profit-calculator-section');
    const pricerCalculatorSection = document.getElementById('pricer-calculator-section');
    const profitResultsContainer = document.getElementById('profit-results-container');
    const pricerResultsContainer = document.getElementById('pricer-results-container');
    const logbookBody = document.getElementById('logbook-body');
    const clearLogBtn = document.getElementById('clear-log-btn');

    function calculateProfit(platform, salePrice, itemCost, shippingCost, shippingCharged) {
        let totalFees = 0;
        const totalSaleAmount = salePrice + shippingCharged;

        switch (platform) {
            case 'ebay':
                totalFees = (totalSaleAmount * FEES.ebay.variablePercent) + FEES.ebay.fixedPerOrder;
                break;
            case 'etsy':
                const transactionFee = totalSaleAmount * FEES.etsy.transactionPercent;
                const paymentFee = (totalSaleAmount * FEES.etsy.paymentPercent) + FEES.etsy.paymentFixed;
                totalFees = transactionFee + paymentFee + FEES.etsy.listing;
                break;
            case 'depop':
                const depopFee = totalSaleAmount * FEES.depop.depopPercent;
                const depopPaymentFee = (totalSaleAmount * FEES.depop.paymentPercent) + FEES.depop.paymentFixed;
                totalFees = depopFee + depopPaymentFee;
                break;
        }

        const netProfit = totalSaleAmount - itemCost - shippingCost - totalFees;
        const profitMargin = (totalSaleAmount > 0) ? (netProfit / totalSaleAmount) * 100 : 0;
        
        return { platform, salePrice, netProfit, profitMargin, id: Date.now(), timestamp: new Date() };
    }

    function calculatePrice(platform, itemCost, shippingCost, desiredProfit) {
        let requiredSalePrice = 0;
        const fixedCosts = itemCost + shippingCost + desiredProfit;

        switch (platform) {
            case 'ebay':
                const ebayTotalFixed = fixedCosts + FEES.ebay.fixedPerOrder;
                requiredSalePrice = ebayTotalFixed / (1 - FEES.ebay.variablePercent);
                break;
            case 'etsy':
                 const etsyTotalFixed = fixedCosts + FEES.etsy.paymentFixed + FEES.etsy.listing;
                 requiredSalePrice = etsyTotalFixed / (1 - FEES.etsy.transactionPercent - FEES.etsy.paymentPercent);
                break;
            case 'depop':
                const depopTotalFixed = fixedCosts + FEES.depop.paymentFixed;
                requiredSalePrice = depopTotalFixed / (1 - FEES.depop.depopPercent - FEES.depop.paymentPercent);
                break;
        }
        return requiredSalePrice;
    }

    function displayProfitResults(result) {
        const profitClass = result.netProfit >= 0 ? 'profit' : 'loss';
        profitResultsContainer.innerHTML = `
            <p>Net Profit: <strong class="${profitClass}">$${result.netProfit.toFixed(2)}</strong> | Margin: <strong class="${profitClass}">${result.profitMargin.toFixed(1)}%</strong></p>
            <button id="save-log-btn">Save to Log</button>
        `;
        document.getElementById('save-log-btn').addEventListener('click', () => {
            logEntries.unshift(currentProfitResult);
            saveAndRender();
            profitResultsContainer.innerHTML = '<p>Saved to logbook!</p>';
        });
    }

    function displayPricerResults(price) {
        pricerResultsContainer.innerHTML = `
            <p>To make your desired profit, you need to set the sale price to:</p>
            <strong class="profit" style="font-size: 1.5rem;">$${price.toFixed(2)}</strong>
        `;
    }

    function renderLog() {
        logbookBody.innerHTML = '';
        logEntries.forEach(entry => {
            const row = document.createElement('tr');
            const profitClass = entry.netProfit >= 0 ? 'profit' : 'loss';
            row.innerHTML = `
                <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
                <td>${FEES[entry.platform].feeName}</td>
                <td>$${entry.salePrice.toFixed(2)}</td>
                <td class="${profitClass}">$${entry.netProfit.toFixed(2)}</td>
                <td class="${profitClass}">${entry.profitMargin.toFixed(1)}%</td>
                <td><button class="delete-btn" data-id="${entry.id}">Delete</button></td>
            `;
            logbookBody.appendChild(row);
        });
    }

    function updateDashboard() {
        const totalProfit = logEntries.reduce((acc, entry) => acc + entry.netProfit, 0);
        const totalSales = logEntries.reduce((acc, entry) => acc + entry.salePrice, 0);
        const avgMargin = logEntries.length > 0 ? logEntries.reduce((acc, entry) => acc + entry.profitMargin, 0) / logEntries.length : 0;

        document.getElementById('stat-total-profit').textContent = `$${totalProfit.toFixed(2)}`;
        document.getElementById('stat-total-sales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('stat-avg-margin').textContent = `${avgMargin.toFixed(1)}%`;
    }

    function saveAndRender() {
        localStorage.setItem('resellerLog', JSON.stringify(logEntries));
        renderLog();
        updateDashboard();
    }
    
    profitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const platform = document.getElementById('platform').value;
        const salePrice = parseFloat(document.getElementById('sale-price').value);
        const itemCost = parseFloat(document.getElementById('item-cost').value);
        const shippingCost = parseFloat(document.getElementById('shipping-cost').value);
        const shippingCharged = parseFloat(document.getElementById('shipping-charged').value);
        
        currentProfitResult = calculateProfit(platform, salePrice, itemCost, shippingCost, shippingCharged);
        displayProfitResults(currentProfitResult);
    });

    pricerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const platform = document.getElementById('pricer-platform').value;
        const itemCost = parseFloat(document.getElementById('pricer-item-cost').value);
        const shippingCost = parseFloat(document.getElementById('pricer-shipping-cost').value);
        const desiredProfit = parseFloat(document.getElementById('pricer-desired-profit').value);

        const requiredPrice = calculatePrice(platform, itemCost, shippingCost, desiredProfit);
        displayPricerResults(requiredPrice);
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

    const savedLog = localStorage.getItem('resellerLog');
    if (savedLog) {
        logEntries = JSON.parse(savedLog);
        renderLog();
        updateDashboard();
    }
});
class CurrencyCalculator {
    constructor() {
        this.amountInput = document.getElementById('curr-amount');
        this.fromSelect = document.getElementById('curr-from');
        this.toSelect = document.getElementById('curr-to');
        this.resultDisplay = document.getElementById('curr-result');
        this.rateTextDisplay = document.getElementById('curr-rate-text');
        this.swapBtn = document.getElementById('curr-swap');

        this.rates = {}; 
        
        this.attachListeners();
        this.fetchLiveRates();

        // Handle scaling adjustments on layout transformations
        window.addEventListener('resize', () => this.adjustResultFontSize());
    }

    async fetchLiveRates() {
        try {
            this.rateTextDisplay.innerText = "Fetching live rates...";
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!response.ok) throw new Error("Network latency or rate limit");
            
            const data = await response.json();
            
            if(data && data.rates) {
                this.rates = data.rates;
                this.calculate();
            } else {
                throw new Error("Invalid API Response Structure");
            }
        } catch (error) {
            console.error("Error fetching rates:", error);
            this.rateTextDisplay.innerHTML = `<span class="text-danger fw-semibold">Offline Mode (Using Base Standard Ratios)</span>`;
            
            // Fallback hardcoded static core rates dataset to ensure zero-break operation if API drops
            this.rates = { 
                USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.50, JPY: 156.20, AUD: 1.51, 
                CAD: 1.37, CHF: 0.90, CNY: 7.25, SGD: 1.35, AED: 3.67 
            };
            this.calculate();
        }
    }

    attachListeners() {
        // Strict input filters preventing visual clutter and layout breaking characters
        this.amountInput.addEventListener('keydown', (e) => {
            if (['-', '+', 'e', 'E'].includes(e.key)) {
                e.preventDefault(); // Stop exponents and negative values out of the gate
            }
        });

        this.amountInput.addEventListener('input', () => {
            // Self-corrective cleaning mechanism for copy-pasted anomalies
            if (this.amountInput.value < 0) this.amountInput.value = 0;
            this.calculate();
        });

        this.fromSelect.addEventListener('change', () => this.calculate());
        this.toSelect.addEventListener('change', () => this.calculate());

        this.swapBtn.addEventListener('click', () => {
            const temp = this.fromSelect.value;
            this.fromSelect.value = this.toSelect.value;
            this.toSelect.value = temp;
            
            this.swapBtn.style.transform = `rotate(180deg)`;
            setTimeout(() => this.swapBtn.style.transform = `rotate(0deg)`, 300);

            this.calculate();
        });

        this.setupSmartDropdown(this.fromSelect);
        this.setupSmartDropdown(this.toSelect);

        document.addEventListener('keydown', (e) => {
            const currContainer = document.getElementById('currency-mode');
            if (!currContainer || !currContainer.classList.contains('active')) return;

            if (document.activeElement === this.amountInput && /^[0-9.]$/.test(e.key)) return;

            const key = e.key.toLowerCase();
            if (key === 'f') { e.preventDefault(); this.fromSelect.focus(); }
            if (key === 't') { e.preventDefault(); this.toSelect.focus(); }
            if (key === 'a') { e.preventDefault(); this.amountInput.focus(); }
            if (key === 's') { e.preventDefault(); this.swapBtn.click(); }
        });
    }

    // --- Upgraded Feature: Complete 3-Digit ISO Strict Buffering Algorithm ---
    setupSmartDropdown(selectElement) {
        let keyBuffer = '';
        let timeout;

        selectElement.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape'].includes(e.key)) return;
            
            if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault(); 
                
                keyBuffer += e.key.toUpperCase();
                
                clearTimeout(timeout);
                timeout = setTimeout(() => { keyBuffer = ''; }, 1000); // 1s window for typing full 3-letter codes

                const options = Array.from(selectElement.options);
                
                // Scan list trying to find perfect match against the explicit 3-letter ISO code string
                let match = options.find(opt => {
                    const cleanText = opt.text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
                    // Split content elements: "IN INR - Indian Rupee" -> looks precisely at index 1 ("INR")
                    const parts = cleanText.split(' ');
                    return parts[1] && parts[1].startsWith(keyBuffer);
                });

                if (match) {
                    selectElement.value = match.value;
                    this.calculate();
                }

                if (keyBuffer.length === 3) {
                    keyBuffer = ''; 
                }
            }
        });
    }

    // --- Dynamic Typography Scaling Engine ---
    adjustResultFontSize() {
        this.resultDisplay.style.transition = 'none';
        this.resultDisplay.style.fontSize = '2.25rem'; // Default starting base scale
        
        const parentCard = this.resultDisplay.parentElement;
        const maxSafeWidth = parentCard.clientWidth - 40; 
        const currentWidth = this.resultDisplay.scrollWidth;

        if (currentWidth > maxSafeWidth) {
            let adjustedRatio = (maxSafeWidth / currentWidth) * 0.95;
            let dynamicSize = 2.25 * adjustedRatio;
            
            if (dynamicSize < 1.1) dynamicSize = 1.1; // Strict compression floor limits
            this.resultDisplay.style.fontSize = `${dynamicSize}rem`;
        }
    }

    calculate() {
        if (!this.rates || Object.keys(this.rates).length === 0) return; 

        const fromCurrency = this.fromSelect.value;
        const toCurrency = this.toSelect.value;
        const amount = parseFloat(this.amountInput.value);

        // Fail-safe calculation bounding checks against edge cases or NaN conversion items
        if (isNaN(amount) || amount <= 0) {
            this.resultDisplay.innerText = "0.00";
            this.adjustResultFontSize();
            return;
        }

        const fromRate = this.rates[fromCurrency];
        const toRate = this.rates[toCurrency];
        
        if (!fromRate || !toRate) return;

        const rawResult = (amount / fromRate) * toRate;
        const singleUnitRate = (1 / fromRate) * toRate;

        // Clean international precision formatting limits contextually matching user standards
        this.resultDisplay.innerText = rawResult.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });

        this.rateTextDisplay.innerText = `1 ${fromCurrency} = ${singleUnitRate.toFixed(4)} ${toCurrency}`;
        
        // Execute dynamic scaling layout calculations
        this.adjustResultFontSize();
    }
}

// Inject HTML and Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const currContainer = document.getElementById('currency-mode');
    if (!currContainer) return;

    // Massively expanded global pool tracking hyper-active trading lines
    const currencyList = [
        { code: 'USD', name: 'US Dollar', prefix: 'US' },
        { code: 'EUR', name: 'Euro', prefix: 'EU' },
        { code: 'GBP', name: 'British Pound', prefix: 'GB' },
        { code: 'INR', name: 'Indian Rupee', prefix: 'IN' },
        { code: 'JPY', name: 'Japanese Yen', prefix: 'JP' },
        { code: 'AUD', name: 'Australian Dollar', prefix: 'AU' },
        { code: 'CAD', name: 'Canadian Dollar', prefix: 'CA' },
        { code: 'CHF', name: 'Swiss Franc', prefix: 'CH' },
        { code: 'CNY', name: 'Chinese Yuan', prefix: 'CN' },
        { code: 'SGD', name: 'Singapore Dollar', prefix: 'SG' },
        { code: 'AED', name: 'UAE Dirham', prefix: 'AE' },
        { code: 'MXN', name: 'Mexican Peso', prefix: 'MX' },
        { code: 'BRL', name: 'Brazilian Real', prefix: 'BR' },
        { code: 'ZAR', name: 'South African Rand', prefix: 'ZA' },
        { code: 'KRW', name: 'South Korean Won', prefix: 'KR' },
        { code: 'NZD', name: 'New Zealand Dollar', prefix: 'NZ' },
        { code: 'HKD', name: 'Hong Kong Dollar', prefix: 'HK' },
        { code: 'SEK', name: 'Swedish Krona', prefix: 'SE' },
        { code: 'THB', name: 'Thai Baht', prefix: 'TH' },
        { code: 'MYR', name: 'Malaysian Ringgit', prefix: 'MY' },
        { code: 'SAR', name: 'Saudi Riyal', prefix: 'SA' },
        { code: 'RUB', name: 'Russian Ruble', prefix: 'RU' },
        { code: 'TRY', name: 'Turkish Lira', prefix: 'TR' }
    ];

    const generateOptions = (selectedCode) => {
        return currencyList.map(c => 
            `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>
                ${c.prefix} \u00A0\u00A0 ${c.code} - ${c.name}
            </option>`
        ).join('');
    };

    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        .currency-scroll-wrapper { max-height: 72vh; overflow-y: auto; padding: 0 4px; }
        .currency-scroll-wrapper::-webkit-scrollbar { width: 5px; }
        .currency-scroll-wrapper::-webkit-scrollbar-thumb { background: var(--nav-text-inactive); border-radius: 10px; }
        
        .result-card { background-color: var(--btn-num-bg); border-radius: 16px; padding: 20px; position: relative; }
        
        .custom-curr-select, .custom-curr-input {
            background-color: transparent !important;
            color: var(--text-primary) !important;
            border: none;
            padding-left: 0;
            box-shadow: none !important;
        }
        .custom-curr-select { font-weight: 600; cursor: pointer; border-bottom: 1px solid var(--nav-bg); border-radius: 0; }
        .custom-curr-input { font-size: 1.5rem; font-weight: 500; }
        .custom-curr-input::placeholder { color: var(--text-secondary); opacity: 0.5; }
        
        #curr-result {
            font-weight: 500;
            margin-top: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;
            width: 100%;
            display: block;
            line-height: 1.2;
        }

        .swap-container {
            display: flex;
            justify-content: center;
            margin-top: -22px;
            margin-bottom: -22px;
            position: relative;
            z-index: 10;
        }
        .swap-btn-custom {
            width: 44px; height: 44px;
            background-color: var(--btn-accent-bg);
            color: white; border: none; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, filter 0.2s ease;
        }
        .swap-btn-custom:active { filter: brightness(0.8); }
    `;
    document.head.appendChild(styleBlock);

    currContainer.innerHTML = `
        <div class="currency-scroll-wrapper w-100 pb-4">
            <div class="result-card text-start shadow-sm">
                <label class="form-label small text-secondary fw-semibold mb-1">From</label>
                <select id="curr-from" class="form-select form-select-lg custom-curr-select mb-2">
                    ${generateOptions('USD')}
                </select>
                <input type="number" id="curr-amount" class="form-control form-control-lg custom-curr-input" placeholder="0.00" value="100" min="0">
            </div>

            <div class="swap-container">
                <button id="curr-swap" class="swap-btn-custom cursor-pointer">
                    <i class="bi bi-arrow-down-up fs-5"></i>
                </button>
            </div>

            <div class="result-card text-start mb-4 shadow-sm pt-4">
                <label class="form-label small text-secondary fw-semibold mb-1 mt-2">To</label>
                <select id="curr-to" class="form-select form-select-lg custom-curr-select mb-2">
                    ${generateOptions('EUR')}
                </select>
                <div id="curr-result">0.00</div>
            </div>

            <div class="result-card text-center shadow-sm">
                <div class="text-secondary small mb-1">Exchange Rate</div>
                <div id="curr-rate-text" class="fs-5 fw-bold text-body">Fetching...</div>
                <div class="small text-secondary mt-2" style="font-size: 0.75rem;">Rates updated dynamically via Open Exchange API</div>
            </div>
        </div>
    `;

    new CurrencyCalculator();

    const calculatorContainer = document.querySelector('.calculator-container');
    const keypadArea = document.getElementById('keypad-area');
    
    const observer = new MutationObserver(() => {
        if (currContainer.classList.contains('active')) {
            calculatorContainer.classList.add('hide-display-area');
            keypadArea.classList.replace('flex-shrink-0', 'flex-grow-1');
        } else if (!document.getElementById('loan-mode').classList.contains('active')) {
            calculatorContainer.classList.remove('hide-display-area');
            keypadArea.classList.replace('flex-grow-1', 'flex-shrink-0');
        }
    });
    observer.observe(currContainer, { attributes: true, attributeFilter: ['class'] });
});